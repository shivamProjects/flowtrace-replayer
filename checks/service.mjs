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
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runBoundaryChecks } from './callbackBoundary.mjs';

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

/**
 * The same, but stamping each line with the moment IT arrived rather than the
 * moment the body finished.
 *
 * Ordering between the socket and the callbacks is a real guarantee here — the
 * platform must never be able to read the terminal envelope before the values
 * it describes have landed — and `await res.text()` collapses the whole stream
 * to one timestamp, which would make that guarantee untestable.
 */
async function readNdjsonTimed(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const lines = [];
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const at = Date.now();
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const raw = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (raw) lines.push({ at, ...JSON.parse(raw) });
    }
  }
  if (buffer.trim()) lines.push({ at: Date.now(), ...JSON.parse(buffer.trim()) });
  return lines;
}

/**
 * Stand in for the platform's callback receiver.
 *
 * Records every POST with the moment it was RECEIVED, so the checks below can
 * assert on ordering and not merely on arrival.
 */
function startCallbackReceiver() {
  const received = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      let parsed = null;
      try {
        parsed = JSON.parse(body || 'null');
      } catch (_) {
        parsed = { unparseable: body };
      }
      received.push({
        at: Date.now(),
        path: req.url || '',
        kind: String(req.url || '').split('/').pop(),
        auth: req.headers.authorization || null,
        body: parsed,
      });
      res.writeHead(204, { connection: 'close' });
      res.end();
    });
  });
  return new Promise((ok) => {
    server.listen(0, '127.0.0.1', () =>
      ok({ received, server, base: `http://127.0.0.1:${server.address().port}/internal/runs` })
    );
  });
}

/** Serve checks/pages out of its own process, exactly as checks/run.mjs does. */
function startFixtureServer() {
  const child = spawn(process.execPath, [join(HERE, 'fixture-server.mjs')], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return new Promise((ok, fail) => {
    let buf = '';
    child.stdout.on('data', (d) => {
      buf += d;
      const m = buf.match(/PORT=(\d+)/);
      if (m) ok({ child, origin: `http://127.0.0.1:${m[1]}` });
    });
    child.on('exit', (code) => fail(new Error(`fixture server exited (${code}) before listening`)));
    setTimeout(() => fail(new Error('fixture server did not report a port within 10s')), 10_000).unref();
  });
}

const PORT_A = 4731;
const PORT_B = 4732;
const PORT_C = 4733;

let unconfigured = null;
let configured = null;
let receiver = null;
let fixtures = null;

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

  configured = await startServer(
    {
      REPLAYER_SERVICE_TOKEN: 'a'.repeat(64),
      // The fixture server is on loopback, which the engine blocks by default.
      // This is the flag an on-premise install needs anyway — no test-only
      // escape hatch is added to production code for it.
      REPLAY_ALLOW_PRIVATE_HOSTS: 'true',
    },
    PORT_B
  );
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

  /* ── 6. The outputs callback (C1.2) ────────────────────────────────────── */
  //
  // The defect being pinned: the engine captures `copy`-step values correctly
  // and they reach exactly ONE place — the terminal envelope on the socket —
  // where the platform drops the whole node into a blob it never reads by name.
  // Every run with a copy step loses a real captured value. These checks fail
  // if that callback ever stops firing, or fires when it must not.

  receiver = await startCallbackReceiver();
  fixtures = await startFixtureServer();

  const CAPTURED = 'McGrath RentCorp';
  const callbackAuth = { authorization: `Bearer ${'a'.repeat(64)}`, 'content-type': 'application/json' };

  {
    // The two identifiers are given DIFFERENT values, deliberately.
    //
    // This check previously read `const runId = 'outputs-1'` and dispatched it
    // as `jobExecutionId`, then asserted the path contained it. One value for
    // both identifiers means the assertion held whichever field the sender
    // read, so it could not distinguish a correct sender from one posting to an
    // id the receiver has never heard of. The fixture supplied the very thing
    // under test.
    //
    // Separating them is the single change that converts that assertion from
    // decorative to real. `runId` is a uuid because `runs.id` is one.
    const runId = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    const jobExecutionId = 'job-outputs-1';
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: callbackAuth,
      body: JSON.stringify({
        jobExecutionId,
        // Carried so the sender HAS the contracted value available. Today it
        // ignores this field entirely — CallbackClient's constructor accepts
        // only jobExecutionId — which is the defect the path assertion below
        // now surfaces instead of hiding.
        runId,
        patchId: 'generic',
        schemaVersion: 1,
        captureScreenshots: false,
        callbackUrl: receiver.base,
        callbackToken: 'callback-secret',
        steps: [
          { action: 'navigate', type: 'navigate', url: `${fixtures.origin}/adf.html` },
          {
            action: 'fill',
            type: 'fill',
            locator: { id: 'bu', label: 'Business Unit' },
            value: CAPTURED,
            description: 'Fill Business Unit',
          },
          {
            action: 'copy',
            type: 'copy',
            locator: { id: 'bu', label: 'Business Unit' },
            outputName: 'businessUnit',
            description: 'Copy the value the application assigned',
          },
        ],
      }),
    });

    const lines = await readNdjsonTimed(res);
    const envelope = lines.find((l) => l.type === 'result') || null;
    // Scoped by KIND and by the id this run is DISPATCHED under, never by the
    // id the path is asserted to carry.
    //
    // Matching on `path.includes(runId)` would silently return zero the moment
    // the two identifiers differ, and AT-1 would fail with "saw 0 outputs
    // callbacks" — reporting a missing callback when the real defect is a
    // callback sent to the wrong id. A filter must never encode the property
    // being asserted, or the failure describes the wrong defect. Scoping on
    // `jobExecutionId` keeps this block isolated from the two below, which share
    // this receiver, while leaving the path itself free to be judged.
    const outputsPosts = receiver.received.filter(
      (r) => r.kind === 'outputs' && r.path.includes(jobExecutionId)
    );

    // AT-1. The whole point of the ticket.
    assert(
      outputsPosts.length === 1,
      'outputs/a-copy-step-run-posts-its-captured-values-exactly-once',
      `saw ${outputsPosts.length} outputs callback(s); envelope outputs=${JSON.stringify(envelope?.outputs ?? null)}`
    );
    assert(
      outputsPosts[0]?.body?.outputs?.businessUnit === CAPTURED,
      'outputs/the-captured-value-arrives-by-name-not-buried-in-a-blob',
      JSON.stringify(outputsPosts[0]?.body ?? null)
    );

    // The body shape is the CONTRACT's, not ours. RunOutputsReport
    // (app/openapi/flowtrace-v1.yaml, flowtrace-app @ feat/WP0-contracts-and-schema)
    // is `additionalProperties: false` with `required: [outputs]`, so a bare
    // map — which is what SAAS-BUILD-PLAN.md:187 still shows — is a 422 and the
    // value is lost at the very boundary this callback closes. Asserted against
    // the spec's rule rather than against our own receiver, which was written in
    // the same commit as the sender and cannot disagree with it.
    assert(
      JSON.stringify(Object.keys(outputsPosts[0]?.body ?? {}).sort()) === '["outputs"]',
      'outputs/the-body-carries-exactly-the-contracted-outputs-property',
      JSON.stringify(outputsPosts[0]?.body ?? null)
    );
    assert(
      Object.values(outputsPosts[0]?.body?.outputs ?? { x: 0 }).every(
        (v) => v === null || typeof v === 'string'
      ),
      'outputs/every-value-is-string-or-null-as-contracted',
      JSON.stringify(outputsPosts[0]?.body?.outputs ?? null)
    );
    assert(
      outputsPosts[0]?.auth === 'Bearer callback-secret',
      'outputs/the-callback-is-authenticated-with-the-dispatched-token',
      String(outputsPosts[0]?.auth)
    );
    // The full path, with the id segment judged on PROVENANCE.
    //
    // flowtrace-v1.yaml:1883-1895 rules `runs.id` "the ONLY identifier on any
    // internal callback path… the worker MUST echo it back unchanged. There is
    // no second identifier." The sender has no `runId` field at all, so it
    // interpolates its own jobExecutionId and every callback lands on an id the
    // app has never heard of — a clean 404 the sender discards, because `_post`
    // resolves false and its callers drain with allSettled. Values lost, suite
    // green. This is the assertion that ends that.
    assert(
      outputsPosts[0]?.path === `/internal/runs/${runId}/outputs`,
      'outputs/it-posts-to-the-contracted-path-with-the-id-from-runId',
      `path was ${outputsPosts[0]?.path} — expected the id segment to be the ` +
        `dispatched runId ${runId}, not the jobExecutionId ${jobExecutionId}`
    );

    // AT-2. The envelope is the platform's "done" signal today, so it must
    // never be readable before the values it describes have landed. Compared on
    // ARRIVAL times, which is why the body is read line-by-line above.
    assert(
      envelope && outputsPosts[0] && outputsPosts[0].at <= envelope.at,
      'outputs/never-lands-after-the-terminal-envelope-it-describes',
      `outputs at ${outputsPosts[0]?.at}, envelope at ${envelope?.at}`
    );

    // The envelope keeps carrying them too. The callback is an addition, not a
    // migration — the live Java client still reads the envelope.
    assert(
      envelope?.outputs?.businessUnit === CAPTURED,
      'outputs/the-terminal-envelope-still-carries-them-for-the-live-client',
      JSON.stringify(envelope?.outputs ?? null)
    );

    // And the captured value itself is never written to this service's log.
    assert(
      !configured.output.join('').includes(CAPTURED),
      'secrets/a-captured-value-is-counted-in-the-log-never-printed'
    );
  }

  {
    // A finished run that captured nothing still posts — an empty map from a
    // run that reached a verdict is a real fact ("captured nothing"), and the
    // platform is entitled to record it.
    const runId = 'outputs-empty-1';
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: callbackAuth,
      body: JSON.stringify({
        jobExecutionId: runId,
        patchId: 'generic',
        schemaVersion: 1,
        captureScreenshots: false,
        callbackUrl: receiver.base,
        callbackToken: 'callback-secret',
        steps: [{ action: 'navigate', type: 'navigate', url: 'not-a-url' }],
      }),
    });

    const lines = await readNdjson(res);
    const envelope = lines.find((l) => l.type === 'result') || null;
    const outputsPosts = receiver.received.filter((r) => r.kind === 'outputs' && r.path.includes(runId));

    assert(
      Boolean(envelope) && outputsPosts.length === 1,
      'outputs/a-run-that-reached-a-verdict-posts-even-when-it-captured-nothing',
      `envelope=${Boolean(envelope)} posts=${outputsPosts.length}`
    );
    // "Captured nothing" is still the wrapped shape — an empty `outputs`
    // property, not an empty body. Required means required even when empty.
    assert(
      JSON.stringify(outputsPosts[0]?.body ?? null) === '{"outputs":{}}',
      'outputs/captured-nothing-is-an-empty-outputs-property-not-an-empty-body',
      JSON.stringify(outputsPosts[0]?.body ?? null)
    );
  }

  {
    // AT-5, and it is the check that matters most. A run that never produced a
    // results file must post NO outputs AT ALL. `{}` from a finished run means
    // "captured nothing"; `{}` from a dead one would mean "we never looked",
    // and nothing downstream could tell those apart afterwards — the same
    // conflation the CRASHED status exists to prevent.
    //
    // SpecRunner's no-results path hard-codes `outputs` to `{}`, so a naive
    // implementation posts that lie. The crash is MANUFACTURED rather than
    // hoped for: a 1ms engine deadline kills the child long before it can write
    // results, which is the real no-verdict path and not a simulation of one.
    const crashed = await startServer(
      {
        REPLAYER_SERVICE_TOKEN: 'a'.repeat(64),
        REPLAY_ALLOW_PRIVATE_HOSTS: 'true',
        REPLAY_RUN_TIMEOUT_MS: '1',
      },
      PORT_C
    );
    try {
      const runId = 'outputs-crash-1';
      const res = await fetch(`${crashed.base}/api/v1/replay`, {
        method: 'POST',
        headers: callbackAuth,
        body: JSON.stringify({
          jobExecutionId: runId,
          patchId: 'generic',
          schemaVersion: 1,
          captureScreenshots: false,
          callbackUrl: receiver.base,
          callbackToken: 'callback-secret',
          steps: [{ action: 'navigate', type: 'navigate', url: `${fixtures.origin}/adf.html` }],
        }),
      });

      const lines = await readNdjson(res);
      const envelope = lines.find((l) => l.type === 'result') || null;
      const outputsPosts = receiver.received.filter((r) => r.kind === 'outputs' && r.path.includes(runId));

      assert(
        envelope === null,
        'outputs/the-manufactured-crash-really-did-reach-no-verdict',
        'a terminal envelope arrived — this case is no longer testing what it claims'
      );
      assert(
        outputsPosts.length === 0,
        'outputs/a-run-with-no-verdict-posts-nothing-rather-than-an-empty-map',
        `saw ${outputsPosts.length}: ${JSON.stringify(outputsPosts.map((p) => p.body))}`
      );
    } finally {
      await stop(crashed);
    }
  }

  {
    // AT-3. A dispatch carrying no callbackUrl at all is still legal and the
    // response shape is unchanged — the callback must not have become required.
    const res = await fetch(`${configured.base}/api/v1/replay`, {
      method: 'POST',
      headers: callbackAuth,
      body: JSON.stringify({
        jobExecutionId: 'outputs-no-callback',
        patchId: 'generic',
        schemaVersion: 1,
        captureScreenshots: false,
        steps: [{ action: 'navigate', type: 'navigate', url: 'not-a-url' }],
      }),
    });
    assert(res.status === 200, 'outputs/a-dispatch-with-no-callbackUrl-still-runs', `got ${res.status}`);
    const lines = await readNdjson(res);
    const envelope = lines.find((l) => l.type === 'result');
    assert(
      !envelope || 'outputs' in envelope,
      'outputs/the-envelope-shape-is-unchanged-with-callbacks-off'
    );
  }
} catch (err) {
  console.error('FAIL  suite threw —', err.message);
  failed++;
} finally {
  await stop(unconfigured);
  await stop(configured);
  if (fixtures) fixtures.child.kill('SIGKILL');
  if (receiver) receiver.server.close();
}

/* ── 7. Skipped heals (C4) ──────────────────────────────────────────────────
 *
 * Design principle P3: report when healing was SKIPPED, not only when it fired.
 * `run_steps.heal_skipped_reason` has existed since the first migration — whose
 * own comment calls it "the trust artifact" — and nothing could write it,
 * because every declining path composed a precise reason and then dropped it
 * into a log line on a deployed worker nobody reads.
 *
 * WHY THESE DRIVE THE REPORTER DIRECTLY rather than a whole run: this harness
 * sets AI_RECOVERY_ENABLED=false (see startServer), so no decline path inside
 * the engine can fire here at all — reaching them needs a live model and real
 * spend. What IS under test is the contract at the boundary: the categories,
 * the field rules, the wire shape and the redaction. The transport underneath
 * is a real HTTP server and a real CallbackClient, not a mock.
 *
 * THREE OF THE SEVEN PATHS ARE NOT COVERED HERE AND MUST NOT BE CLAIMED AS
 * COVERED: paths 1, 2, 4, 5 and 7 live in engine/main.ts, which cannot emit
 * `heal-skipped` at all until that file changes (the sole `emit('heal',…)` is
 * gated on `recovery?.recovered`). Those checks are marked PENDING-ENGINE below
 * and are deliberately red.
 */
{
  const { CallbackClient } = await import('../src/platform/callbackClient.js').then(
    (m) => m.default ?? m
  );
  const { reportHealSkipped, SKIP_DECLINED, SKIP_REJECTED } = await import(
    '../src/run/healReporter.js'
  ).then((m) => m.default ?? m);

  const skipReceiver = await startCallbackReceiver();
  const client = new CallbackClient(
    {
      jobExecutionId: 'skip-1',
      callbackUrl: skipReceiver.base,
      callbackToken: 'callback-secret',
    },
    () => {}
  );

  const posts = () => skipReceiver.received.filter((r) => r.kind === 'heal-skipped');

  // A DECLINED skip: nothing was attempted, so there is no candidate to describe.
  await reportHealSkipped({
    index: 3,
    category: SKIP_DECLINED,
    reason: 'the element is not in the document, so there is nothing for a model to find',
    stepLabel: 'Click Submit',
    errorClass: 'TARGET_NOT_PRESENT',
    callbacks: client,
    jobExecutionId: 'skip-1',
  });

  const declined = posts()[0];
  assert(posts().length === 1, 'skip/a-declined-heal-is-reported-exactly-once', `saw ${posts().length}`);
  assert(
    declined?.body?.category === 'DECLINED',
    'skip/declined-is-labelled-declined-not-merely-skipped',
    JSON.stringify(declined?.body?.category)
  );
  // The four heal fields must be null, and this is the assertion that keeps the
  // two categories meaningfully different. A placeholder here would say "we
  // tried and got nothing" about a step nobody ever looked at.
  assert(
    declined?.body?.healMethod === null &&
      declined?.body?.healConfidence === null &&
      declined?.body?.healFrom === null &&
      declined?.body?.healTo === null,
    'skip/declined-carries-no-candidate-fields-because-nothing-was-attempted',
    JSON.stringify(declined?.body ?? null)
  );
  assert(
    typeof declined?.body?.reason === 'string' && declined.body.reason.length > 0,
    'skip/a-skip-always-carries-its-reason',
    JSON.stringify(declined?.body?.reason ?? null)
  );

  // A REJECTED skip: a candidate existed and failed an independent re-check.
  await reportHealSkipped({
    index: 4,
    category: SKIP_REJECTED,
    reason: 'recovery claimed success but the field was still empty — rejected on re-check',
    stepLabel: 'Fill Business Unit',
    errorClass: 'ASSERTION_FAILED',
    heal: { method: 'ai-recovery', confidence: 0.92, from: '#old', to: '#proposed' },
    callbacks: client,
    jobExecutionId: 'skip-1',
  });

  const rejected = posts()[1];
  assert(
    rejected?.body?.category === 'REJECTED',
    'skip/rejected-is-distinguishable-from-declined',
    JSON.stringify(rejected?.body?.category)
  );
  assert(
    rejected?.body?.healMethod === 'ai-recovery' &&
      rejected?.body?.healConfidence === 0.92 &&
      rejected?.body?.healTo === '#proposed',
    'skip/rejected-carries-the-candidate-that-failed-verification',
    JSON.stringify(rejected?.body ?? null)
  );

  // THE INVARIANT THAT MATTERS MOST. A skip is not a heal. They travel on
  // different callbacks so a receiver cannot render a refusal as a repair —
  // the conflation P2 exists to prevent.
  assert(
    skipReceiver.received.every((r) => r.kind !== 'heals' && r.kind !== 'heal'),
    'skip/a-skipped-heal-is-never-posted-as-an-applied-heal',
    skipReceiver.received.map((r) => r.kind).join(',')
  );
  assert(
    posts().every((r) => r.path.endsWith('/heal-skipped')),
    'skip/posts-to-its-own-endpoint-not-the-heal-endpoint',
    posts().map((r) => r.path).join(' ')
  );

  // A skip with no reason is a null column wearing a different hat: it reports
  // that we declined without saying why, which is what this ticket closes.
  const before = posts().length;
  const noReason = await reportHealSkipped({
    index: 5,
    category: SKIP_DECLINED,
    reason: '',
    callbacks: client,
    jobExecutionId: 'skip-1',
  });
  assert(
    posts().length === before && noReason.posted === false,
    'skip/a-skip-with-no-reason-is-refused-rather-than-posted-empty',
    noReason.log
  );

  // Never throws — a failed write-back must not be worse than not having the
  // feature. Driven with a client whose transport cannot succeed.
  const deadClient = new CallbackClient(
    { jobExecutionId: 'skip-1', callbackUrl: 'http://127.0.0.1:1', callbackToken: 't' },
    () => {}
  );
  const dead = await reportHealSkipped({
    index: 6,
    category: SKIP_DECLINED,
    reason: 'unreachable receiver',
    callbacks: deadClient,
    jobExecutionId: 'skip-1',
  });
  assert(
    dead.posted === false && typeof dead.log === 'string',
    'skip/an-unreportable-skip-degrades-to-a-log-line-and-never-throws',
    dead.log
  );

  skipReceiver.server.close();
}

/* ── 8. Callback boundary invariants (TRACE-18) ─────────────────────────────
 *
 * Run from here so there is ONE entry point for the suite. These need no server
 * — they check what the sender constructs, not what a socket carries — and they
 * run last so a boundary failure never masks a transport failure above it.
 */
console.log('');
const boundary = runBoundaryChecks();
passed += boundary.passed;
failed += boundary.failed;

console.log(`\n${passed}/${passed + failed} service checks passed\n`);
process.exitCode = failed > 0 ? 1 : 0;
