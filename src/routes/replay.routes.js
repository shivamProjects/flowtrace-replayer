/**
 * POST /api/v1/replay — synchronous replay invocation endpoint.
 *
 * Executes browser replay runs via SpecRunner. Dispatches arrive over HTTP from
 * the platform and return streaming NDJSON telemetry followed by a terminal
 * outcome envelope (integration contract §5, §6).
 *
 * ── The dispatch payload (contract §5) ──────────────────────────────────────
 *   { jobExecutionId: "<uuid>",
 *     patchId:        "oracle",
 *     schemaVersion:  1,
 *     steps:          [ ...resolved actions... ],
 *     parameters:     { name: value },      // optional; for re-parameterising heals
 *     knownErrorTypes:{ maskedMessage: label }, // optional; saves model calls
 *     captureScreenshots: true,
 *     callbackUrl:    "https://platform/api/internal/replay",
 *     callbackToken:  "<short-lived>" }
 *
 * Steps arrive INLINE rather than by id because the platform binds real
 * credentials into them before dispatch. They live in memory for the life of
 * this request, are written to one scratch file the engine reads, and that file
 * is deleted in a `finally` (see SpecRunner.replay). Nothing credential-bearing
 * is persisted, logged, or echoed back.
 *
 * ── The response: two channels, deliberately asymmetric (contract §6) ───────
 * The response body is NDJSON — one JSON object per line, flushed as the run
 * happens:
 *
 *   (a) LIVE, LOSSY. start / step-start / step-end / screenshot / heal. A
 *       client that joins late or drops a frame has missed nothing that matters.
 *       Screenshots are forwarded here and NEVER retained on disk past the run.
 *
 *   (b) AUTHORITATIVE, DURABLE. The last line is the terminal envelope, marked
 *       `"type": "result"` and carrying the full StepResult array. Per-step rows
 *       also go to the platform callback AS THEY ARRIVE, not only at the end,
 *       so the socket the client is holding is never the only record of a run.
 *
 * A response that ends WITHOUT a terminal envelope means the engine died
 * (contract §7). That is CRASHED, and it is a different incident class from a
 * run that finished and failed. A 500 and a red test must never share a code
 * path, so this route returns 200 with `success: false` for a real failure and
 * reserves a broken/absent envelope for infrastructure failure.
 */

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');

const SpecRunner = require('../run/specRunner');
const { outerDeadlineMs } = require('../run/specRunner');
const { CallbackClient } = require('../platform/callbackClient');
const { reportHeal } = require('../run/healReporter');
const { buildFixRecord, reportAiFix } = require('../run/aiFixLibrary');
const { reportLearned } = require('../run/errorTypes');

const router = express.Router();

/** How often the run renews its lease with the platform (contract §7). */
const HEARTBEAT_MS = Number(process.env.REPLAY_HEARTBEAT_MS || 15_000);

/**
 * Shared-secret auth.
 *
 * This caller is a SERVER, not a logged-in user, and has no session to present.
 * A bearer token both sides hold is the honest fit.
 *
 * Unset means unset: refuse every request rather than defaulting to open. An
 * endpoint that drives a real browser against a customer's live ERP is not
 * something to leave unauthenticated because a variable was forgotten — failing
 * closed turns that into an obvious 503 instead of a silent hole. Contract §5
 * calls this out as correct and asks for it to be kept. It is kept.
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
  const ok = crypto.timingSafeEqual(Buffer.from(presented), Buffer.from(expected));
  if (!ok) return res.status(401).json({ success: false, error: 'unauthorized' });

  return next();
}

/** One NDJSON line. Never throws — a client that hung up must not fail a run. */
function writeLine(res, object) {
  if (res.writableEnded) return;
  try {
    res.write(JSON.stringify(object) + '\n');
  } catch (_) {
    // A dropped client is channel (a) doing its job: lossy, and not the record.
  }
}

router.post('/replay', requireServiceToken, async function (req, res) {
  const {
    jobExecutionId,
    steps,
    patchId,
    schemaVersion,
    parameters,
    knownErrorTypes,
    captureScreenshots,
    callbackUrl,
    callbackToken,
  } = req.body || {};

  if (!jobExecutionId || typeof jobExecutionId !== 'string') {
    return res.status(400).json({ success: false, error: 'jobExecutionId is required' });
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ success: false, error: 'steps must be a non-empty array' });
  }

  // Never log `steps` or `parameters`: the platform has already bound real
  // credentials into them. Never log `callbackToken` either — count, patch, and
  // whether a callback exists are the whole of what is safe to say.
  console.log(
    `[replay] job ${jobExecutionId}: ${steps.length} step(s)` +
      `${patchId ? ` [patch: ${patchId}]` : ''}` +
      ` [callbacks: ${callbackUrl ? 'on' : 'off'}]`
  );

  const callbacks = new CallbackClient(
    { jobExecutionId, callbackUrl, callbackToken },
    (msg) => console.log(`[replay ${jobExecutionId}] ${msg}`)
  );

  const runner = new SpecRunner(jobExecutionId);

  // NDJSON, streamed. Committing the headers here rather than at the first
  // event means a client sees the connection is live immediately, and means
  // every later failure is a truncated body — which is exactly the signal §7
  // asks for — rather than a status code that would conflate crash with
  // failure.
  res.status(200);
  res.setHeader('content-type', 'application/x-ndjson');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-replay-deadline-ms', String(outerDeadlineMs(steps.length)));
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  // Lease renewal. Fire-and-forget, unref'd so a pending tick can never be the
  // thing holding this process open.
  const heartbeat = setInterval(() => {
    callbacks.postHeartbeat({ jobExecutionId, phase: 'running' });
  }, HEARTBEAT_MS);
  heartbeat.unref();

  // A client that hangs up does NOT stop the run: the run is mutating a live
  // ERP and abandoning it half-done is worse than finishing it. The callbacks
  // are what make that safe — the record survives the socket.
  let clientGone = false;
  req.on('aborted', () => {
    clientGone = true;
    console.log(`[replay ${jobExecutionId}] client disconnected — the run continues`);
  });

  /* ── channel (a): live, lossy ─────────────────────────────────────────── */

  runner.on('start', (p) => writeLine(res, { type: 'start', totalSteps: p.totalSteps ?? steps.length }));

  runner.on('step-start', (p) =>
    writeLine(res, {
      type: 'step-start',
      index: p.index,
      action: p.action,
      description: p.description ?? null,
    })
  );

  runner.on('step-end', (p) =>
    writeLine(res, {
      type: 'step-end',
      index: p.index,
      status: p.status,
      durationMs: p.duration ?? null,
      recovered: Boolean(p.recovered),
      summary: p.summary ?? null,
      error: p.error ?? null,
    })
  );

  // Forwarded live, never retained: the whole run directory is deleted in the
  // `finally` below, so a screenshot exists only for as long as it takes to
  // encode it and put it on the wire.
  runner.on('screenshot', (shot) =>
    writeLine(res, {
      type: 'screenshot',
      index: (shot.step ?? 1) - 1,
      mimeType: shot.mimeType,
      imageBase64: shot.screenshot,
    })
  );

  /* ── channel (b): authoritative, as it arrives ────────────────────────── */

  // Per-step rows go to the platform the moment the engine produces them. The
  // engine has already written them to its results file by this point, so a
  // callback that fails costs a row, not the run — the terminal envelope still
  // carries the complete array.
  const pending = [];
  runner.on('step-end', (p) => {
    pending.push(callbacks.postStep({ index: p.index, status: p.status, durationMs: p.duration ?? null }));
  });

  // Anything that only DESCRIBES a run — a learned label, a self-healed fix, a
  // library entry — is fire-and-forget by construction. None of it can sink a
  // good run.
  runner.on('heal', (heal) => {
    writeLine(res, {
      type: 'heal',
      index: heal.index,
      stepLabel: heal.description ?? null,
      errorClass: heal.failureStage ?? null,
      fix: { steps: heal.steps ?? [] },
    });

    pending.push(
      (async () => {
        const { log, record } = await reportHeal({
          heal,
          dispatchedSteps: steps,
          parameters,
          callbacks,
          jobExecutionId,
        });
        console.log(`[replay ${jobExecutionId}] ${log}`);

        if (record) {
          const fix = buildFixRecord({ heal, originalStep: steps[heal.index], aiSteps: record });
          console.log(`[replay ${jobExecutionId}] ${await reportAiFix(callbacks, fix)}`);
        }
      })().catch(() => {})
    );
  });

  runner.on('error-type-learned', (entry) => {
    pending.push(
      reportLearned(callbacks, entry)
        .then((log) => console.log(`[replay ${jobExecutionId}] ${log}`))
        .catch(() => {})
    );
  });

  try {
    const result = await runner.replay(steps, {
      patchId,
      schemaVersion,
      knownErrorTypes,
      captureScreenshots: captureScreenshots !== false,
    });

    // Let the in-flight per-step and heal callbacks land before the envelope
    // does, so the platform never sees "done" before the rows it describes.
    await Promise.allSettled(pending);

    if (result.crashed) {
      // No terminal envelope. The body simply ends — that IS the signal
      // (contract §7). Writing a `success: false` envelope here would tell the
      // platform a test failed when in fact nothing reached a verdict, which is
      // the exact conflation the CRASHED status exists to prevent.
      console.error(`[replay ${jobExecutionId}] engine produced no verdict: ${result.error}`);
      return;
    }

    // The engine's own verdict, passed through unchanged. Softening a failure
    // here would show a green job for a red run.
    writeLine(res, {
      type: 'result',
      success: Boolean(result.success),
      cancelled: Boolean(result.cancelled),
      error: result.error ?? null,
      outputs: result.outputs || {},
      heals: result.heals || [],
      results: result.results || [],
      transactionInfo: result.transactionInfo ?? null,
    });
  } catch (err) {
    // `err.message` can quote a step, and a resolved step can carry a
    // credential. Keep the detail in this service's log and end the body
    // without an envelope — the platform reads that as CRASHED, which is what
    // an unexpected throw in here actually is.
    console.error(`[replay ${jobExecutionId}] replay threw: ${err.message}`);
  } finally {
    clearInterval(heartbeat);
    await runner.close().catch(() => {});
    await callbacks.postHeartbeat({ jobExecutionId, phase: 'finished' });

    // The run directory holds the screenshots and the engine's results file.
    // Neither is ours to keep: screenshots are forwarded live and not retained,
    // and the platform owns the durable record. Removing it also guarantees no
    // scratch file outlives the request, whatever path got us here.
    try {
      if (runner.screenshotDir && fs.existsSync(runner.screenshotDir)) {
        fs.rmSync(runner.screenshotDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`[replay ${jobExecutionId}] could not remove the run directory: ${err.message}`);
    }

    if (!res.writableEnded) res.end();
    if (clientGone) console.log(`[replay ${jobExecutionId}] finished after the client had gone`);
  }
});

module.exports = router;
