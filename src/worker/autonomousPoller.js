/**
 * Autonomous Playwright Worker Poller
 *
 * Polls the FlowTrace Control Plane work claim API (POST /api/v1/internal/work/claim)
 * and executes claimed runs headlessly with automated heartbeats, SpecRunner Playwright execution,
 * and telemetry callbacks.
 */

const SpecRunner = require('../run/specRunner');
const { CallbackClient } = require('../platform/callbackClient');

const { CallbackJournal } = require('../platform/callbackJournal');

const CONTROL_PLANE_URL = (
  process.env.FLOWTRACE_CONTROL_PLANE_URL ||
  process.env.FLOWTRACE_API_URL ||
  'http://localhost:3200'
).replace(/\/+$/, '');

const WORKER_NODE_ID =
  process.env.FLOWTRACE_WORKER_NODE_ID ||
  process.env.WORKER_NODE_ID ||
  `worker-${process.pid}-${require('os').hostname()}`;

const WORKER_API_KEY = process.env.FLOWTRACE_WORKER_API_KEY || process.env.FLOWTRACE_API_KEY || null;

const POLL_INTERVAL_ACTIVE_MS = Number(process.env.POLL_INTERVAL_ACTIVE_MS || 1000);
const POLL_INTERVAL_IDLE_MS = Number(process.env.POLL_INTERVAL_IDLE_MS || 5000);

let running = false;
let shouldStop = false;

async function claimWork() {
  const url = `${CONTROL_PLANE_URL}/api/v1/internal/work/claim`;
  const headers = {
    'content-type': 'application/json',
  };

  if (WORKER_API_KEY) {
    headers['authorization'] = `Bearer ${WORKER_API_KEY}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      workerNodeId: WORKER_NODE_ID,
      supportedEngines: ['playwright'],
      maxConcurrent: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Work claim failed (HTTP ${res.status}): ${text}`);
  }

  return res.json();
}

async function executeRun(claimData) {
  const { run } = claimData;
  if (!run || !run.runId) return;

  const runId = run.runId;
  const executionToken = run.executionToken;
  const callbackUrl = `${CONTROL_PLANE_URL}/api/v1/internal/runs`;

  const callbackClient = new CallbackClient(
    {
      runId,
      callbackUrl,
      callbackToken: executionToken,
    },
    (msg) => console.log(`[${runId}] ${msg}`),
  );

  const runner = new SpecRunner(runId);
  const leaseExpiresAt = run.leaseExpiresAt
    ? new Date(run.leaseExpiresAt).getTime()
    : Date.now() + 15 * 60 * 1000;
  const LEASE_SAFETY_BUFFER_MS = 15_000;
  let lastHeartbeatSuccess = Date.now();

  // Start heartbeat timer
  const heartbeatInterval = setInterval(async () => {
    try {
      const ok = await callbackClient.postHeartbeat({
        workerNodeId: WORKER_NODE_ID,
        attemptCount: run.attemptCount,
      });
      if (ok) {
        lastHeartbeatSuccess = Date.now();
      } else if (callbackClient.cancelled || callbackClient.lastStatus === 409) {
        console.warn(`[${runId}] Heartbeat returned 409 (Fencing conflict or Run Cancelled). Aborting runner immediately...`);
        await runner.close();
      }
    } catch (err) {
      console.error(`[${runId}] Heartbeat error: ${err.message}`);
    }

    // Local lease expiry guard: If heartbeat has not succeeded and current time exceeds lease deadline, self-abort locally
    const now = Date.now();
    if (now > leaseExpiresAt - LEASE_SAFETY_BUFFER_MS && now - lastHeartbeatSuccess > 30_000) {
      console.warn(`[${runId}] Local lease expiry deadline approaching without renewed heartbeat. Aborting runner locally to prevent split-brain...`);
      await runner.close();
    }
  }, 15_000);

  const startTime = Date.now();

  try {
    if (!run.executionRequest) {
      throw new Error('Claimed run is missing authoritative ExecutionRequest from Control Plane compiler');
    }

    const executionRequest = run.executionRequest;
    const steps = executionRequest.steps || [];
    console.log(`[${runId}] Executing ${steps.length} steps via SpecRunner against ${run.baseUrl || 'configured target'}...`);

    // Wire live events to callbacks with fencing rejection abortion
    runner.on('step-end', async (stepResult) => {
      try {
        const ok = await callbackClient.postStep(stepResult);
        if (!ok && (callbackClient.cancelled || callbackClient.lastStatus === 409)) {
          console.warn(`[${runId}] Step callback returned 409 (Fencing conflict / Cancelled). Aborting runner...`);
          await runner.close();
        }
      } catch (err) {
        console.warn(`[${runId}] Failed to post step callback:`, err.message);
      }
    });

    runner.on('heal', async (healData) => {
      try {
        const ok = await callbackClient.postHeal(healData);
        if (!ok && (callbackClient.cancelled || callbackClient.lastStatus === 409)) {
          console.warn(`[${runId}] Heal callback returned 409 (Fencing conflict / Cancelled). Aborting runner...`);
          await runner.close();
        }
      } catch (err) {
        console.warn(`[${runId}] Failed to post heal callback:`, err.message);
      }
    });

    const replayResult = await runner.replay(steps, {
      headless: true,
      aiRecovery: process.env.AI_RECOVERY_ENABLED !== 'false',
      knownErrorTypes: executionRequest.knownErrorTypes,
      parameters: executionRequest.parameters,
    });

    await runner.close();

    const totalDuration = Date.now() - startTime;

    if (replayResult.cancelled || callbackClient.cancelled || callbackClient.lastStatus === 409) {
      console.log(`[${runId}] Run was cancelled or fenced mid-flight. Halting callback finalization.`);
      return;
    }

    if (replayResult.outputs && Object.keys(replayResult.outputs).length > 0) {
      await callbackClient.postOutputs(replayResult.outputs);
    }

    await callbackClient.postComplete({
      runId,
      status: replayResult.success ? 'PASSED' : 'FAILED',
      durationMs: totalDuration,
      healed: (replayResult.healCount || 0) > 0,
      healCount: replayResult.healCount || 0,
      errorMessage: replayResult.error || undefined,
    });

    console.log(`[${runId}] Completed (success: ${replayResult.success}) in ${totalDuration}ms`);
  } catch (err) {
    console.error(`[${runId}] Execution failed: ${err.message}`);
    await callbackClient.postError({
      runId,
      error: err.message,
      errorType: 'RUNNER_CRASH',
    });

    await callbackClient.postComplete({
      runId,
      status: 'FAILED',
      durationMs: Date.now() - startTime,
      errorMessage: err.message,
    });
  } finally {
    clearInterval(heartbeatInterval);
  }
}

async function startWorkerLoop() {
  if (running) return;
  running = true;
  console.log(`[worker] FlowTrace Autonomous Worker started. Node ID: ${WORKER_NODE_ID}`);
  console.log(`[worker] Connecting to Control Plane: ${CONTROL_PLANE_URL}`);

  while (!shouldStop) {
    let claimed = false;
    try {
      // Flush any pending durable journaled outbox entries
      await CallbackJournal.flushAll((msg) => console.log(`[worker] ${msg}`));

      const claimResult = await claimWork();
      if (claimResult && claimResult.claimed && claimResult.run) {
        claimed = true;
        await executeRun(claimResult);
      }
    } catch (err) {
      console.error(`[worker] Polling cycle error: ${err.message}`);
    }

    const waitMs = claimed ? POLL_INTERVAL_ACTIVE_MS : POLL_INTERVAL_IDLE_MS;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  running = false;
  console.log('[worker] Autonomous Worker stopped.');
}

function stopWorker() {
  shouldStop = true;
}

if (require.main === module) {
  startWorkerLoop().catch((err) => {
    console.error(`[worker] Fatal error: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\n[worker] Interrupted. Stopping...');
    stopWorker();
  });
  process.on('SIGTERM', () => {
    console.log('\n[worker] Terminating. Stopping...');
    stopWorker();
  });
}

module.exports = { startWorkerLoop, stopWorker, claimWork, executeRun };
