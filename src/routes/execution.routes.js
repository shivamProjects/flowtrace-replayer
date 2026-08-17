/**
 * Execution routes — the HTTP surface over the queue worker.
 *
 *   POST /:id/queue   enqueue an execution (worker picks it up on its next tick)
 *   POST /:id/stop    kill a running execution
 *   GET  /:id/live    SSE stream of step events while it runs   ← stage 6
 *   GET  /:id/report  fetch the finished PDF (S3 presigned URL or local file)
 *   GET  /:id/status  plain JSON status, for pollers that don't want SSE
 *
 * Mounted under the same prefix the replay service used, so an existing
 * frontend needs no URL changes.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const { pool } = require('../config/database');
const queueWorker = require('../queue/queueWorker');
const { authenticate } = require('../middleware/auth.middleware');
const EnvEncryption = require('../utils/envEncryption');

/**
 * The browser's EventSource cannot set an Authorization header, so the SSE
 * endpoint also accepts `?token=<jwt>` and promotes it to a header before the
 * normal authenticate middleware runs. Same verification either way — this only
 * changes where the token is read from.
 */
router.use((req, res, next) => {
  if (!req.headers.authorization && req.query && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

// All routes require authentication.
router.use(authenticate);

/* ─────────────────────────── live stream (SSE) ─────────────────────────── */

// The event log itself lives on the queue worker, which owns an execution from
// the moment it starts — see queueWorker.recordExecutionStream. This route is a
// reader of it. Buffering here was the old arrangement and the reason joining a
// run late showed nothing: an event was only ever kept if a viewer happened to
// be connected when it happened.

router.get('/:id/live', async function (req, res) {
  const { id } = req.params;
  const lastEventId = req.headers['last-event-id'];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // stop nginx buffering the stream
  res.flushHeaders?.();

  // Tell the browser to reconnect after 3s if the connection drops.
  res.write('retry: 3000\n\n');

  // This connection's own notices — connected, queued, finished. Deliberately
  // written WITHOUT an SSE id: ids belong to the worker's log, so that a
  // Last-Event-Id sent on reconnect always means the same thing.
  const write = (data) => {
    if (res.writableEnded) return;
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  };

  const writeEntry = (entry) => {
    if (res.writableEnded) return;
    res.write(`id: ${entry.seq}\n`);
    res.write('data: ' + JSON.stringify(entry.data) + '\n\n');
  };

  let unsubscribe = null;
  let finishTimer = null;

  try {
    // Scoped by user_id, not id alone: authenticate() proves WHO is calling but
    // not that this execution is theirs. Without the ownership predicate any
    // authenticated user can stream, retry, stop or read any other user's run.
    const [rows] = await pool.query(
      'SELECT id, api_name, execution_status FROM api_execution_history WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      write({ type: 'error', error: 'Execution record not found' });
      return res.end();
    }

    const record = rows[0];
    write({ type: 'connected', executionId: id, apiName: record.api_name, status: record.execution_status });

    const since = lastEventId ? parseInt(lastEventId, 10) || 0 : 0;
    let lastSeq = since;

    // Subscribe BEFORE replaying, holding anything that arrives meanwhile.
    // Replaying first would drop every event that landed in the gap between
    // reading the log and attaching to it.
    let replaying = true;
    const pending = [];

    const deliver = (entry) => {
      if (entry.seq <= lastSeq) return;
      lastSeq = entry.seq;
      writeEntry(entry);

      // The spec's own 'done' marks the end of the stream.
      if (entry.data && entry.data.type === 'done') {
        write({ type: 'finished', ...entry.data });
        finishTimer = setTimeout(() => { if (!res.writableEnded) res.end(); }, 500);
      }
    };

    unsubscribe = queueWorker.subscribeToExecution(id, (entry) => {
      if (replaying) return pending.push(entry);
      deliver(entry);
    });

    const buffered = queueWorker.getExecutionEvents(id, since);
    if (buffered.length) {
      console.log(`[Live] Catching execution ${id} up with ${buffered.length} earlier event(s)`);
      buffered.forEach(deliver);
    }
    replaying = false;
    pending.forEach(deliver);

    const running = queueWorker.getExecutionEmitter(id);

    if (running) {
      console.log(`[Live] Client attached to running execution ${id}`);

    } else if (record.execution_status === 'in_queue') {
      // Not started yet. The subscription above already covers the events; this
      // only tells the client why nothing is happening yet, and when it does.
      write({ type: 'status', status: 'in_queue', message: 'Execution is queued, waiting to start...' });

      const poll = setInterval(() => {
        if (res.writableEnded) return clearInterval(poll);
        if (queueWorker.getExecutionEmitter(id)) {
          clearInterval(poll);
          console.log(`[Live] Execution ${id} started`);
          write({ type: 'status', status: 'in_execution', message: 'Execution has started' });
        }
      }, 2000);

      req.on('close', () => clearInterval(poll));

    } else {
      // Already finished. The replay above has just handed over the whole run
      // if it ended recently, which is exactly what someone opening the view a
      // moment too late wants to see.
      write({
        type: 'status',
        status: record.execution_status,
        message: `Execution already completed with status: ${record.execution_status}`,
      });
      if (unsubscribe) unsubscribe();
      return res.end();
    }

    // Keep-alive comment so idle proxies don't drop the connection mid-run.
    const heartbeat = setInterval(() => {
      if (res.writableEnded) return clearInterval(heartbeat);
      res.write(': ping\n\n');
    }, 20_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      if (finishTimer) clearTimeout(finishTimer);
      if (unsubscribe) unsubscribe();
      console.log(`[Live] Client disconnected from execution ${id}`);
    });

  } catch (error) {
    console.error(`[Live] Error on execution ${id}:`, error.message);
    if (unsubscribe) unsubscribe();
    write({ type: 'error', error: error.message });
    res.end();
  }
});

/* ───────────────────────────── queue / stop ────────────────────────────── */

router.post('/:id/queue', async function (req, res) {
  try {
    const { id } = req.params;

    // Ownership predicate — see the note on the /live route.
    const [rows] = await pool.query(
      'SELECT id, execution_status FROM api_execution_history WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Execution not found' });
    }

    // Re-queuing something already running would have two browsers driving the
    // same flow against Oracle at once.
    if (rows[0].execution_status === 'in_execution') {
      return res.status(409).json({ success: false, message: 'Execution is already running' });
    }

    await pool.query(
      'UPDATE api_execution_history SET execution_status = ?, error_message = NULL WHERE id = ? AND user_id = ?',
      ['in_queue', id, req.user.id]
    );

    // The previous attempt's event log is replaced when the worker picks this
    // up — see queueWorker.recordExecutionStream.

    res.json({ success: true, message: 'Execution queued', executionId: id, status: 'in_queue' });

  } catch (error) {
    console.error('[Queue] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/stop', async function (req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT id, execution_status FROM api_execution_history WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Execution not found' });
    }

    const result = await queueWorker.stopExecution(id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Stop] Error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/* ─────────────────────────────── artefacts ─────────────────────────────── */

router.get('/:id/status', async function (req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, api_name, execution_status, error_message, response_time_ms,
              executed_at, response_body AS report, report_size_bytes,
              defect_created, captured_outputs
         FROM api_execution_history WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Execution not found' });
    }

    res.json({ success: true, execution: rows[0], isRunning: Boolean(queueWorker.getExecutionEmitter(req.params.id)) });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/report', async function (req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT response_body FROM api_execution_history WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0 || !rows[0].response_body) {
      return res.status(404).json({ success: false, message: 'No report available for this execution' });
    }

    const reportPath = rows[0].response_body;

    // Local fallback path (S3 upload was skipped or failed).
    if (!/^https?:\/\//i.test(reportPath)) {
      if (!fs.existsSync(reportPath)) {
        return res.status(404).json({ success: false, message: 'Report file no longer on disk' });
      }
      return res.download(path.resolve(reportPath));
    }

    // S3 object — stream it back through this process. Credentials go through
    // EnvEncryption so ENC:-prefixed values in .env are decrypted at read time.
    const s3Client = new S3Client({
      region: EnvEncryption.getEnv('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: EnvEncryption.getEnv('AWS_ACCESS_KEY_ID'),
        secretAccessKey: EnvEncryption.getEnv('AWS_SECRET_ACCESS_KEY'),
      },
    });

    const bucket = EnvEncryption.getEnv('AWS_S3_BUCKET_NAME');
    const key = decodeURIComponent(new URL(reportPath).pathname.replace(/^\//, ''));

    const s3Object = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="execution-${req.params.id}.pdf"`);
    if (s3Object.ContentLength) res.setHeader('Content-Length', s3Object.ContentLength);

    s3Object.Body.pipe(res);

  } catch (error) {
    console.error('[Report] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
