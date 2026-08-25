/**
 * Service entrypoint.
 *
 * Wraps the existing Playwright spec in the three stages ported from the replay
 * service:
 *
 *   3. queue worker    — polls api_execution_history and runs eligible jobs
 *   5. reporting       — PDF with per-step screenshots, uploaded to S3
 *   6. extras          — defect creation + live SSE streaming
 *
 * The replay engine is untouched by any of this: src/queue/specRunner.js drives
 * engine/main.ts as a child process, and nothing under engine/ imports from here.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/database');
const queueWorker = require('./queue/queueWorker');
const executionRoutes = require('./routes/execution.routes');
const replayRoutes = require('./routes/replay.routes');

const app = express();

app.use(cors());
// Recorded scripts can be large.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({
    service: 'replay-runner',
    status: 'ok',
    message: 'Playwright replay runner is running.',
    uptime: process.uptime(),
  });
});

// Unauthenticated liveness probe.
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'replay-runner', uptime: process.uptime() });
});

// Same prefix the replay service used, so an existing frontend needs no changes.
app.use('/api/playwright-execution', executionRoutes);
// The platform's Java side dispatches here — steps inline, service-token auth.
// See routes/replay.routes.js for why this does not go through the queue.
app.use('/api/v1', replayRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

const PORT = process.env.PORT || 9200;

let server = null;
let shuttingDown = false;

async function start() {
  // Every stage here reads or writes the queue table, so a dead database means
  // the service can do nothing useful — fail loudly at boot instead of serving
  // a healthy-looking process that silently processes nothing.
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Database connection failed — check DEV_DB_* / PROD_DB_* in .env');
  }

  // Only ONE worker may poll api_execution_history across the whole system. If
  // the replay service is also running its worker against this database, set
  // QUEUE_WORKER_ENABLED=false on one side or they will double-process jobs.
  if (process.env.QUEUE_WORKER_ENABLED !== 'false') {
    queueWorker.start();
    console.log('✓ Queue worker started');
  } else {
    console.log('• Queue worker disabled (QUEUE_WORKER_ENABLED=false)');
  }

  // Kept in a module-scoped `server` so shutdown() can close it.
  server = app.listen(PORT, () => {
    console.log(`✓ Replay runner listening on port ${PORT}`);
  });
}

// Leave running executions in a truthful state rather than stuck at
// 'in_execution' forever when the process is stopped.
//
// That is what the comment always claimed; until queueWorker.shutdown() existed
// it was not what the code did — stop() only cleared the poll interval and the
// immediate exit(0) orphaned every spawned Playwright child. The hard timer
// below is the backstop: a shutdown that hangs is worse than an abrupt one.
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down`);

  const hardExit = setTimeout(() => {
    console.error('Shutdown did not complete within 30s — exiting anyway');
    process.exit(1);
  }, 30_000);
  hardExit.unref();

  if (server) server.close();

  try {
    await queueWorker.shutdown();
  } catch (err) {
    console.error('Error while shutting down the queue worker:', err.message);
  }
  clearTimeout(hardExit);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  console.error('✗ Failed to start replay runner:', err.message);
  process.exit(1);
});

module.exports = app;
