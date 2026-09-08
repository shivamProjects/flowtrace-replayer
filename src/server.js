/**
 * Service entrypoint.
 *
 * The replayer drives Playwright browser executions and reports structured
 * telemetry over HTTP (integration contract §1). Execution is ephemeral, with
 * durable state managed by the platform:
 *
 *   in    POST /api/v1/replay      one run, steps inline, service-token auth
 *   out   NDJSON on that response  live progress, then a terminal envelope
 *   out   the dispatch callbacks   per-step rows, heals, labels, heartbeat
 *
 * ── Architecture ────────────────────────────────────────────────────────────
 * Execution requests arrive exclusively through POST /api/v1/replay as defined
 * in the integration contract.
 *
 * The replay engine runs as an isolated child process via src/run/specRunner.js,
 * preserving process boundary safety.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const replayRoutes = require('./routes/replay.routes');

const app = express();

app.use(cors());
// Resolved recordings can be large.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({
    service: 'flowtrace-replayer',
    status: 'ok',
    message: 'FlowTrace replayer is running.',
    uptime: process.uptime(),
  });
});

// Unauthenticated liveness probe.
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'flowtrace-replayer',
    uptime: process.uptime(),
    // Say plainly whether this instance can accept work. A process that is
    // listening but will 503 every dispatch is the failure mode worth
    // surfacing here — see requireServiceToken in routes/replay.routes.js.
    acceptingDispatch: Boolean(process.env.REPLAYER_SERVICE_TOKEN),
  });
});

// The platform's Java side dispatches here — steps inline, service-token auth.
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

/**
 * Port policy moves this service to 4000. It is configurable, and the platform
 * side's `platform.replayer.url` MUST move with it — the two are a pair, and a
 * mismatch does not fail loudly, it just means no dispatch ever arrives. See
 * .env.example.
 */
const PORT = Number(process.env.PORT || 4000);

let server = null;
let shuttingDown = false;

function start() {
  // There is no boot-time database gate any more, because there is no database.
  // What DOES decide whether this process can do useful work is the service
  // token, so say so once at boot rather than only on the first refused
  // dispatch.
  if (!process.env.REPLAYER_SERVICE_TOKEN) {
    console.warn(
      '! REPLAYER_SERVICE_TOKEN is not set — POST /api/v1/replay will refuse every ' +
        'request with 503. This is deliberate: an endpoint that drives a real browser ' +
        'against a live ERP fails closed rather than open.'
    );
  }

  server = app.listen(PORT, () => {
    console.log(`✓ FlowTrace replayer listening on port ${PORT}`);
  });
}

/**
 * Stop accepting new work, then let what is running finish.
 *
 * A replay mutates a live ERP and is not idempotent, so an in-flight run is not
 * something to abandon lightly — but a shutdown that hangs is worse than an
 * abrupt one, so the hard timer below is the backstop. Runs that do not make it
 * lose their socket, not their record: the platform has the per-step callbacks,
 * and heartbeat expiration indicates process termination.
 */
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

  clearTimeout(hardExit);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

module.exports = app;
