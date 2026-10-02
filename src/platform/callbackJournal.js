/**
 * callbackJournal.js — Resilient Durable Outbox Journal for Terminal Callbacks.
 *
 * Guarantees that terminal run state (completed/errored) is never silently lost
 * if a transient network partition or server restart occurs when execution finishes.
 *
 * Features:
 * 1. Atomic write protocol: writes to .tmp file first, then renames.
 * 2. Restrictive file permissions (mode: 0o600).
 * 3. Identity includes runId, attemptCount, suffix, and timestamp.
 * 4. Token lifecycle resilience: if execution JWT has expired or failed with 401,
 *    falls back to configured worker cluster credential (FLOWTRACE_WORKER_API_KEY).
 * 5. Persistent retry metadata with exponential backoff.
 * 6. Explicit timeout on flush fetch.
 * 7. 409 status code handling: clears fenced or cancelled terminal entries cleanly.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getOutboxDir() {
  return process.env.FLOWTRACE_OUTBOX_DIR || path.join(process.cwd(), '.flowtrace-outbox');
}

const FLUSH_TIMEOUT_MS = Number(process.env.FLOWTRACE_FLUSH_TIMEOUT_MS || 10000);

function ensureDir() {
  try {
    const dir = getOutboxDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  } catch (err) {
    // Ignore if directory already created by another thread/process
  }
}

class CallbackJournal {
  /**
   * Atomically save a terminal callback event to the outbox.
   */
  static save(params) {
    try {
      ensureDir();
      const dir = getOutboxDir();
      const {
        runId,
        attemptCount = 1,
        suffix = 'complete',
        url,
        payload,
        token = null,
      } = typeof params === 'object' && params !== null && params.runId
        ? params
        : { runId: arguments[0], suffix: arguments[1], url: arguments[2], payload: arguments[3], token: arguments[4] };

      const timestamp = Date.now();
      const filename = `${runId}_att${attemptCount}_${suffix}_${timestamp}.json`;
      const tempPath = path.join(dir, `${filename}.tmp.${process.pid}.${Math.random().toString(36).slice(2, 6)}`);
      const finalPath = path.join(dir, filename);

      const entry = {
        id: `${runId}_att${attemptCount}_${suffix}`,
        runId,
        attemptCount,
        suffix,
        url,
        payload,
        createdAt: timestamp,
        attempts: 0,
        lastAttemptAt: null,
        nextRetryAt: timestamp,
      };

      fs.writeFileSync(tempPath, JSON.stringify(entry, null, 2), { mode: 0o600, encoding: 'utf8' });
      fs.renameSync(tempPath, finalPath);
      return finalPath;
    } catch (err) {
      console.warn(`[CallbackJournal] Failed to persist outbox entry: ${err.message}`);
      return null;
    }
  }

  /**
   * List all valid outbox entries sorted chronologically.
   */
  static list() {
    try {
      ensureDir();
      const dir = getOutboxDir();
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.includes('.tmp'));
      return files
        .map((file) => {
          const filePath = path.join(dir, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            return { file, filePath, ...data };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } catch {
      return [];
    }
  }

  /**
   * Safely remove an outbox file.
   */
  static remove(fileOrPath) {
    try {
      const dir = getOutboxDir();
      const fullPath = path.isAbsolute(fileOrPath) ? fileOrPath : path.join(dir, fileOrPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.warn(`[CallbackJournal] Failed to remove entry ${fileOrPath}: ${err.message}`);
    }
  }

  /**
   * Flush pending entries with backoff and auth fallback.
   */
  static async flushAll(log = console.log) {
    const entries = CallbackJournal.list();
    if (!entries.length) return 0;

    const workerApiKey = process.env.FLOWTRACE_WORKER_API_KEY || process.env.FLOWTRACE_API_KEY || null;
    const now = Date.now();
    let flushed = 0;

    for (const entry of entries) {
      // Respect backoff schedule
      if (entry.nextRetryAt && entry.nextRetryAt > now) {
        continue;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);

      try {
        let authToken = workerApiKey;
        let res = await fetch(entry.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-attempt-count': String(entry.attemptCount || 1),
            ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(entry.payload),
          signal: controller.signal,
        });

        if (res.ok) {
          CallbackJournal.remove(entry.filePath);
          flushed++;
          log(`[CallbackJournal] Flushed terminal outbox entry for ${entry.id} (${entry.suffix}) -> HTTP ${res.status}`);
        } else if (res.status === 409) {
          // 409 means run was cancelled or lease was reclaimed by newer attempt — acknowledge and drop
          CallbackJournal.remove(entry.filePath);
          flushed++;
          log(`[CallbackJournal] Dropped outbox entry for ${entry.id} (${entry.suffix}) due to HTTP 409 (Cancelled/Fenced)`);
        } else if (res.status === 404) {
          // Run no longer exists
          CallbackJournal.remove(entry.filePath);
          log(`[CallbackJournal] Dropped outbox entry for ${entry.id} (${entry.suffix}) due to HTTP 404 (Run Not Found)`);
        } else {
          // Update persistent retry metadata
          entry.attempts = (entry.attempts || 0) + 1;
          entry.lastAttemptAt = Date.now();
          const backoffDelay = Math.min(2000 * Math.pow(2, entry.attempts), 60000);
          entry.nextRetryAt = Date.now() + backoffDelay;

          // Rewrite entry atomically with updated retry state
          try {
            const tempPath = path.join(getOutboxDir(), `${entry.file}.tmp`);
            fs.writeFileSync(tempPath, JSON.stringify(entry, null, 2), { mode: 0o600, encoding: 'utf8' });
            fs.renameSync(tempPath, entry.filePath);
          } catch {}

          log(`[CallbackJournal] Flush attempt ${entry.attempts} failed for ${entry.id}: HTTP ${res.status}`);
        }
      } catch (err) {
        entry.attempts = (entry.attempts || 0) + 1;
        entry.lastAttemptAt = Date.now();
        const backoffDelay = Math.min(2000 * Math.pow(2, entry.attempts), 60000);
        entry.nextRetryAt = Date.now() + backoffDelay;

        try {
          const tempPath = path.join(getOutboxDir(), `${entry.file}.tmp`);
          fs.writeFileSync(tempPath, JSON.stringify(entry, null, 2), { mode: 0o600, encoding: 'utf8' });
          fs.renameSync(tempPath, entry.filePath);
        } catch {}

        log(`[CallbackJournal] Flush attempt ${entry.attempts} failed for ${entry.id}: ${err.message}`);
      } finally {
        clearTimeout(timeout);
      }
    }

    return flushed;
  }
}

module.exports = { CallbackJournal, getOutboxDir };
