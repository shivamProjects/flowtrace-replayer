/**
 * Service-level checks for POST /api/v1/replay.
 *
 * These boot the REAL server as a child process and talk to it over HTTP.
 * Nothing is mocked, because the things worth checking here are exactly the
 * things a mock would paper over:
 *
 *   · that the service starts AT ALL with no database — the previous entry
 *     point refused to listen until a MySQL connection succeeded, so a mocked
 *     test of the route would have passed against a service that could never
 *     boot;
 *   · that an unset REPLAYER_SERVICE_TOKEN produces a 503 and not an open door;
 *   · that the response really is NDJSON on an open socket, and that a run that
 *     never reaches a verdict ends WITHOUT a terminal envelope.
 *
 * The engine is not exercised here — checks/run.mjs does that against a real
 * browser. What is exercised is the shell around it.
 */

import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`pass  ${name}`);
    passed++;
  } else {
    console.error(`FAIL  ${name} — ${details}`);
    failed++;
  }
}

/**
 * Start the server on an ephemeral-ish port with a given environment, and wait
 * until /health answers. Returns a handle with the base URL and a killer.
 */
async function startServer(env, port) {
  const child = spawn(process.execPath, [join(ROOT, 'src', 'server.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      // Do not let a developer's own .env leak into the check.
      REPLAYER_SERVICE_TOKEN: '',
      AI_RECOVERY_ENABLED: 'false',
      ...env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = [];
  child.stdout.on('data', (d) => output.push(String(d)));
  child.stderr.on('data', (d) => output.push(String(d)));

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  for (;;) {
    if (Date.now() > deadline) {
      child.kill();
      throw new Error(`server did not become healthy:\n${output.join('')}`);
    }
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return { base, child, output, body: await res.json() };
    } catch (_) {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

function stop(handle) {
  return new Promise((done) => {
    if (!handle || handle.child.exitCode !== null) return done();
    handle.child.once('exit', () => done());
    handle.child.kill('SIGKILL');
  });
}

/** Read an NDJSON body to completion and return the parsed lines. */
async function readNdjson(res) {
  const text = await res.text();
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

const PORT_A = 4731;
const PORT_B = 4732;

let unconfigured = null;
let configured = null;

try {
  /* ── 1. It boots with no database at all ───────────────────────────────── */

  unconfigured = await startServer({}, PORT_A);
  assert(true, 'boot/the-service-listens-with-no-database-configured');
  assert(
    unconfigured.body.acceptingDispatch === false,
    'health/says-plainly-that-it-cannot-accept-dispatch-yet',
    JSON.stringify(unconfigured.body)
  );
  assert(
    unconfigured.output.join('').includes('REPLAYER_SERVICE_TOKEN is not set'),
    'boot/warns-once-at-boot-rather-than-only-on-the-first-refused-dispatch'
  );

  /* ── 2. Fail closed, deliberately ──────────────────────────────────────── */

  {
    const res = await fetch(`${unconfigured.base}/api/v1/replay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobExecutionId: 'j1', steps: [{ action: 'click' }] }),
    });
    assert(res.status === 503, 'auth/unset-token-refuses-with-503-rather-than-running-unauthenticated', `got ${res.status}`);
  }

  /* ── 3. Configured: the token is actually checked ──────────────────────── */

  configured = await startServer({ REPLAYER_SERVICE_TOKEN: 'a'.repeat(64) }, PORT_B);
  assert(configured.body.acceptingDispatch === true, 'health/reports-ready-once-the-token-is-set');

  {
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobExecutionId: 'j1', steps: [{ action: 'click' }] }),
    });
    assert(res.status === 401, 'auth/no-bearer-is-rejected', `got ${res.status}`);
  }

  {
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${'b'.repeat(64)}` },
      body: JSON.stringify({ jobExecutionId: 'j1', steps: [{ action: 'click' }] }),
    });
    assert(res.status === 401, 'auth/a-wrong-token-of-the-right-length-is-rejected', `got ${res.status}`);
  }

  const auth = { authorization: `Bearer ${'a'.repeat(64)}`, 'content-type': 'application/json' };

  {
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ steps: [{ action: 'click' }] }),
    });
    assert(res.status === 400, 'validate/a-missing-jobExecutionId-is-a-400', `got ${res.status}`);
  }

  {
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ jobExecutionId: 'j1', steps: [] }),
    });
    assert(res.status === 400, 'validate/an-empty-step-array-is-a-400', `got ${res.status}`);
  }

  /* ── 4. The queue path is gone, not merely disabled ────────────────────── */

  {
    const res = await fetch(`${configured.base}/api/playwright-execution/1/queue`, { method: 'POST' });
    assert(
      res.status === 404,
      'queue/the-second-invocation-path-no-longer-exists',
      `got ${res.status} — a disabled route would answer differently`
    );
  }

  /* ── 5. NDJSON, and no terminal envelope when nothing reaches a verdict ─ */

  {
    // A recording the engine will refuse outright. The point is not what it
    // refuses — checks/run.mjs covers that — it is the SHAPE of the response.
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        jobExecutionId: 'smoke-1',
        patchId: 'generic',
        schemaVersion: 1,
        captureScreenshots: false,
        steps: [{ action: 'navigate', url: 'not-a-url' }],
      }),
    });

    assert(res.status === 200, 'protocol/a-run-answers-200-and-reports-its-verdict-in-the-body', `got ${res.status}`);
    assert(
      String(res.headers.get('content-type') || '').includes('application/x-ndjson'),
      'protocol/the-body-is-ndjson',
      String(res.headers.get('content-type'))
    );
    assert(
      Number(res.headers.get('x-replay-deadline-ms')) > 0,
      'protocol/the-deadline-the-service-will-enforce-is-advertised-up-front'
    );

    const lines = await readNdjson(res);
    const terminal = lines.filter((l) => l.type === 'result');

    // Whatever happened, the two channels must not contradict each other: a
    // terminal envelope carries the full StepResult array, and its absence
    // means the engine never reached a verdict. Both are legal here; a
    // half-written envelope is not.
    assert(terminal.length <= 1, 'protocol/at-most-one-terminal-envelope', `saw ${terminal.length}`);
    if (terminal.length === 1) {
      const t = terminal[0];
      assert(
        typeof t.success === 'boolean' && Array.isArray(t.results) && 'error' in t && 'outputs' in t,
        'protocol/the-terminal-envelope-carries-the-documented-shape',
        JSON.stringify(Object.keys(t))
      );
      assert(
        lines[lines.length - 1].type === 'result',
        'protocol/the-envelope-is-the-last-line'
      );
    } else {
      assert(true, 'protocol/no-envelope-is-the-crash-signal-and-the-body-simply-ends');
    }

    // Whatever else it did, it must not have leaked the token or the steps.
    const log = configured.output.join('');
    assert(!log.includes('a'.repeat(64)), 'secrets/the-service-token-is-never-logged');
  }
} catch (err) {
  console.error('FAIL  suite threw —', err.message);
  failed++;
} finally {
  await stop(unconfigured);
  await stop(configured);
}

console.log(`\n${passed}/${passed + failed} service checks passed\n`);
process.exitCode = failed > 0 ? 1 : 0;
