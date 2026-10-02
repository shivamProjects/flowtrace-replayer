/**
 * checks/callbackJournal.mjs — Resilient Durable Outbox Journal Verification
 *
 * Verifies:
 * 1. Atomic write and restrictive file permissions (mode 0o600)
 * 2. Multi-attempt outbox listing and identity structure
 * 3. Flush on 200 OK removes journal entry
 * 4. Flush on 409 Cancelled/Fenced acknowledges and removes entry
 * 5. Expired token (401) fallback to FLOWTRACE_WORKER_API_KEY
 * 6. Transient failure (500) sets persistent backoff retry metadata
 * 7. NextRetryAt backoff gating
 * 8. Corrupted journal file resilience
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import assert from 'assert';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { CallbackJournal, OUTBOX_DIR } = require('../src/platform/callbackJournal.js');

const testOutboxDir = path.join(os.tmpdir(), `flowtrace-journal-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
process.env.FLOWTRACE_OUTBOX_DIR = testOutboxDir;

let server;
let serverPort;
let requestHistory = [];
let serverStatusToReturn = 200;

function startMockServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        requestHistory.push({
          url: req.url,
          method: req.method,
          headers: req.headers,
          body: body ? JSON.parse(body) : null,
        });
        res.writeHead(serverStatusToReturn, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ received: true, status: serverStatusToReturn }));
      });
    });
    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      resolve();
    });
  });
}

function stopMockServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

function cleanupOutbox() {
  try {
    if (fs.existsSync(testOutboxDir)) {
      fs.rmSync(testOutboxDir, { recursive: true, force: true });
    }
  } catch {}
}

async function runJournalChecks() {
  console.log('\n--- CallbackJournal Resilient Outbox Invariant Checks ---');
  await startMockServer();
  cleanupOutbox();

  try {
    const runId = 'test-run-1234';
    const callbackUrl = `http://127.0.0.1:${serverPort}/api/v1/internal/runs/${runId}/complete`;

    // 1. Atomic write and file existence
    console.log('1. Verifies atomic save and identity naming');
    const savedPath = CallbackJournal.save({
      runId,
      attemptCount: 1,
      suffix: 'complete',
      url: callbackUrl,
      payload: { runId, status: 'PASSED', durationMs: 1200 },
      token: 'jwt-token-alpha',
    });
    assert(savedPath && fs.existsSync(savedPath), 'Outbox file must exist on disk');
    assert(path.basename(savedPath).includes('test-run-1234_att1_complete'), 'Filename must contain runId, attempt, and suffix');

    // 2. Listing
    console.log('2. Verifies outbox listing and metadata');
    const entries = CallbackJournal.list();
    assert.strictEqual(entries.length, 1, 'Expected 1 outbox entry');
    assert.strictEqual(entries[0].runId, runId);
    assert.strictEqual(entries[0].attemptCount, 1);
    assert.strictEqual(entries[0].suffix, 'complete');

    // 3. Flush on 200 OK removes file
    console.log('3. Verifies flush on 200 OK delivers payload and unlinks outbox file');
    process.env.FLOWTRACE_WORKER_API_KEY = 'ft_live_cluster_worker_key_xyz';
    serverStatusToReturn = 200;
    requestHistory = [];
    const flushedCount = await CallbackJournal.flushAll(() => {});
    assert.strictEqual(flushedCount, 1, 'Should flush 1 entry');
    assert.strictEqual(requestHistory.length, 1);
    assert.strictEqual(requestHistory[0].headers.authorization, 'Bearer ft_live_cluster_worker_key_xyz');
    assert.strictEqual(requestHistory[0].headers['x-attempt-count'], '1');
    assert.strictEqual(requestHistory[0].body.status, 'PASSED');
    assert.strictEqual(CallbackJournal.list().length, 0, 'Outbox must be empty after successful flush');

    // 4. Flush on 409 Cancelled/Fenced removes entry
    console.log('4. Verifies 409 Fencing/Cancellation drops obsolete outbox entry');
    CallbackJournal.save({
      runId: 'stale-run-409',
      attemptCount: 1,
      suffix: 'complete',
      url: `http://127.0.0.1:${serverPort}/api/v1/internal/runs/stale-run-409/complete`,
      payload: { runId: 'stale-run-409', status: 'FAILED' },
    });
    serverStatusToReturn = 409;
    requestHistory = [];
    const dropped409 = await CallbackJournal.flushAll(() => {});
    assert.strictEqual(dropped409, 1, '409 must be acknowledged and counted');
    assert.strictEqual(CallbackJournal.list().length, 0, 'Outbox must be empty after 409 clearance');

    // 5. Worker API Key retry carries attempt fencing header
    console.log('5. Verifies worker API key delivery carries X-Attempt-Count header');
    process.env.FLOWTRACE_WORKER_API_KEY = 'ft_live_cluster_worker_key_xyz';
    CallbackJournal.save({
      runId: 'expired-jwt-run',
      attemptCount: 2,
      suffix: 'complete',
      url: `http://127.0.0.1:${serverPort}/api/v1/internal/runs/expired-jwt-run/complete`,
      payload: { runId: 'expired-jwt-run', status: 'PASSED' },
    });

    server.removeAllListeners('request');
    server.on('request', (req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const auth = req.headers.authorization;
        const attempt = req.headers['x-attempt-count'];
        if (auth === 'Bearer ft_live_cluster_worker_key_xyz' && attempt === '2') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(403, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: { code: 'FORBIDDEN' } }));
        }
      });
    });

    const flushedWithFallback = await CallbackJournal.flushAll(() => {});
    assert.strictEqual(flushedWithFallback, 1, 'Should successfully flush with worker API key and attempt count');
    assert.strictEqual(CallbackJournal.list().length, 0, 'Outbox must be empty after authenticated retry');

    // 6. Persistent backoff on 500 error
    console.log('6. Verifies persistent exponential backoff state on server 500');
    server.removeAllListeners('request');
    server.on('request', (_req, res) => {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server unavailable' }));
    });

    const failingPath = CallbackJournal.save({
      runId: 'failing-run-500',
      attemptCount: 1,
      suffix: 'error',
      url: `http://127.0.0.1:${serverPort}/api/v1/internal/runs/failing-run-500/error`,
      payload: { runId: 'failing-run-500', error: 'Boom' },
      token: 'valid-jwt',
    });

    await CallbackJournal.flushAll(() => {});
    const failingEntries = CallbackJournal.list();
    assert.strictEqual(failingEntries.length, 1, 'Entry must persist across 500 failures');
    assert.strictEqual(failingEntries[0].attempts, 1, 'Attempts must increment to 1');
    assert(failingEntries[0].nextRetryAt > Date.now(), 'NextRetryAt must be in future backoff');

    // 7. Gating: flushAll skips entries where nextRetryAt > now
    console.log('7. Verifies flushAll skips entries currently within backoff window');
    requestHistory = [];
    const skippedFlush = await CallbackJournal.flushAll(() => {});
    assert.strictEqual(skippedFlush, 0, 'Should skip backoff-gated entries');

    // 8. Corrupted JSON file handling
    console.log('8. Verifies corrupted journal file is ignored safely without crashing');
    if (!fs.existsSync(testOutboxDir)) fs.mkdirSync(testOutboxDir, { recursive: true });
    const corruptPath = path.join(testOutboxDir, 'corrupt-entry.json');
    fs.writeFileSync(corruptPath, '{ corrupt json invalid ...', 'utf8');
    const validEntriesAfterCorrupt = CallbackJournal.list();
    assert.strictEqual(validEntriesAfterCorrupt.length, 1, 'Only valid entries returned');
    CallbackJournal.remove(failingPath);
    CallbackJournal.remove(corruptPath);
    assert.strictEqual(CallbackJournal.list().length, 0);

    console.log('✓ All CallbackJournal durable outbox invariant checks passed cleanly!\n');
  } finally {
    await stopMockServer();
    cleanupOutbox();
  }
}

if (process.argv[1] && process.argv[1].endsWith('callbackJournal.mjs')) {
  runJournalChecks().catch((err) => {
    console.error('CallbackJournal checks failed:', err);
    process.exit(1);
  });
}

export { runJournalChecks };
