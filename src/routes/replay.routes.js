/**
 * POST /api/v1/replay — the contract the platform's Java side already speaks.
 *
 * `ReplayerServiceClient.java` has been POSTing here since the replay split;
 * nothing was listening. It sends:
 *
 *   { jobExecutionId: "<uuid>", steps: [ ...actions... ] }
 *
 * and expects a JSON object back. This route is deliberately a thin adapter
 * onto the SAME SpecRunner the queue worker drives — the engine, the candidate
 * ladder and the reporting path are shared, so a replay dispatched from
 * platform behaves identically to one queued locally.
 *
 * ── Why steps arrive INLINE rather than by id ──────────────────────────────
 * The queue worker's flow is DB-driven: `POST /:id/queue` marks a row in
 * `api_execution_history` and the worker later reads `script_json_complete`
 * back out. That is right for locally-owned executions and wrong here, because
 * Java binds real credentials into the steps before dispatch
 * (ReplayerServiceClient.bindSteps, from `Environment.credentials`). Writing
 * those to MySQL would put plaintext credentials at rest — the exact problem
 * that already exists in 329 stored recordings and is still awaiting rotation.
 *
 * So the steps stay in memory for the life of the request and are never
 * persisted here. Java remains the owner of tenancy, JobExecution state,
 * redaction and the PDF; this service owns the browser and nothing else.
 */

const express = require('express');

const SpecRunner = require('../queue/specRunner');

const router = express.Router();

/** A replay can legitimately run for a long time; cap it rather than hang. */
const REPLAY_TIMEOUT_MS = Number(process.env.REPLAY_HTTP_TIMEOUT_MS || 30 * 60 * 1000);

/**
 * Shared-secret auth.
 *
 * The queue routes authenticate a logged-in USER (`req.user.id`); this caller
 * is a SERVER, and has no session to present. A bearer token both sides hold
 * is the honest fit.
 *
 * Unset means unset: refuse every request rather than defaulting to open. An
 * endpoint that drives a real browser against a customer's Oracle tenant is
 * not something to leave unauthenticated because a variable was forgotten —
 * failing closed turns that into an obvious 503 instead of a silent hole.
 */
function requireServiceToken(req, res, next) {
  const expected = process.env.REPLAYER_SERVICE_TOKEN;
  if (!expected) {
    console.error('[replay] REPLAYER_SERVICE_TOKEN is not set — refusing to serve /api/v1/replay');
    return res.status(503).json({
      success: false,
      error: 'replayer is not configured to accept service calls (REPLAYER_SERVICE_TOKEN unset)',
    });
  }

  const header = String(req.get('authorization') || '');
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  // Length check first: timingSafeEqual throws on a length mismatch, and the
  // length of a shared secret is not the part worth protecting.
  if (presented.length !== expected.length) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  const crypto = require('crypto');
  const ok = crypto.timingSafeEqual(Buffer.from(presented), Buffer.from(expected));
  if (!ok) return res.status(401).json({ success: false, error: 'unauthorized' });

  return next();
}

router.post('/replay', requireServiceToken, async function (req, res) {
  const { jobExecutionId, steps } = req.body || {};

  if (!jobExecutionId || typeof jobExecutionId !== 'string') {
    return res.status(400).json({ success: false, error: 'jobExecutionId is required' });
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ success: false, error: 'steps must be a non-empty array' });
  }

  // Never log `steps`: Java has already bound real credentials into them.
  console.log(`[replay] job ${jobExecutionId}: ${steps.length} step(s)`);

  const runner = new SpecRunner(jobExecutionId);

  try {
    const result = await runner.replay(steps, { timeout: REPLAY_TIMEOUT_MS });

    // Pass the engine's own verdict through unchanged. Java records the
    // JobExecution status from it, so softening a failure here would show a
    // green job for a red run.
    return res.json({
      success: Boolean(result.success),
      jobExecutionId,
      totalSteps: steps.length,
      results: result.results || [],
      outputs: result.outputs || {},
      heals: result.heals || [],
      transactionInfo: result.transactionInfo ?? null,
      error: result.error ?? null,
    });
  } catch (err) {
    // `err.message` can quote a step, and a bound step can carry a credential.
    // Java redacts what it stores, but it cannot redact what it never sees, so
    // keep the detail in this service's log and return the shape only.
    console.error(`[replay] job ${jobExecutionId} failed:`, err.message);
    return res.status(500).json({
      success: false,
      jobExecutionId,
      error: 'replay failed — see replayer logs',
    });
  } finally {
    await runner.close().catch(() => {});
  }
});

module.exports = router;
