/**
 * AI fix library + platform callback checks.
 *
 * What these pin down, and why each one is here:
 *
 *   1. The library key is stable under the things that change between runs and
 *      between customers — session ids, instance names, row indices. If it is
 *      not, the library fractures into one entry per run and is worthless.
 *   2. Literal customer data never reaches a library entry. This is the value
 *      leak trap, and it is the check that would matter most if it broke.
 *   3. Every callback is fire-and-forget. A dead platform, a 500, a hang, a
 *      dispatch with no callbackUrl at all — none of them may throw, because
 *      anything that only DESCRIBES a run must never be able to fail the run.
 *   4. The timeout invariant holds for every step count: the deadline this
 *      service enforces is always ABOVE the engine's own. Legacy had these
 *      inverted and reported real step failures as timeouts.
 *
 * There is no database here, and no schema check, because there is no table.
 * Deduplication on fixKeyHash is the platform's — the only side with a
 * transaction to dedupe inside. What this service owes it is a STABLE KEY, and
 * that is what section 1 verifies.
 */

import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);

const {
  classifyUiCode,
  inferStage,
  classifyWidgetKind,
  normaliseSignature,
  buildStepSignature,
  sha256,
  buildFixKey,
  sanitizeFixStepsForLibrary,
  buildFixRecord,
  reportAiFix,
} = req('../src/run/aiFixLibrary');
const { reportHeal, stabilizeSelector } = req('../src/run/healReporter');
const { CallbackClient } = req('../src/platform/callbackClient');
const { engineRunTimeoutMs, outerDeadlineMs } = req('../src/run/specRunner');

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

/** A throwaway server that records what it was sent, and answers how it is told. */
function stubPlatform(status = 200) {
  const received = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (c) => (body += c));
    request.on('end', () => {
      received.push({
        url: request.url,
        auth: request.headers.authorization || null,
        body: body ? JSON.parse(body) : null,
      });
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end('{}');
    });
  });
  return new Promise((ok) => {
    server.listen(0, '127.0.0.1', () =>
      ok({ received, port: server.address().port, close: () => new Promise((d) => server.close(d)) })
    );
  });
}

async function runTests() {
  console.log('\n=== AI fix library + platform callback checks ===\n');

  /* ── 1. UI code classification ──────────────────────────────────────── */

  assert(
    classifyUiCode('https://fa-instance.oraclecloud.com/fscmUI/redwood/procurement') === 'REDWOOD',
    'ui_code/redwood-url-classified'
  );
  assert(
    classifyUiCode('https://fa-instance.oraclecloud.com/fscmUI/faces/FscmTop') === 'ADF',
    'ui_code/faces-url-classified-as-adf'
  );
  assert(
    classifyUiCode('https://example.com/custom/app') === 'UNKNOWN',
    'ui_code/unknown-url-classified-as-unknown'
  );
  assert(classifyUiCode('') === 'UNKNOWN', 'ui_code/empty-url-classified-as-unknown');
  assert(classifyUiCode(null) === 'UNKNOWN', 'ui_code/null-url-classified-as-unknown');

  /* ── 2. Failure stage inference ─────────────────────────────────────── */

  assert(inferStage('waiting for locator `input[name="x"]` - timeout') === 'LOCATE', 'stage/locate-timeout');
  assert(inferStage('target not found: input.search') === 'LOCATE', 'stage/locate-not-found');
  assert(inferStage('could not open lov dialog launcher') === 'OPEN', 'stage/open-dialog');
  assert(inferStage('dropdown popup failed to appear') === 'OPEN', 'stage/open-popup');
  assert(inferStage('typing into input failed') === 'INPUT', 'stage/input-type');
  assert(inferStage('clear and pressSequentially rejected') === 'INPUT', 'stage/input-press');
  assert(inferStage('could not click pick list row') === 'COMMIT', 'stage/commit-pick');
  assert(inferStage('submit button click was not recorded') === 'COMMIT', 'stage/commit-click');
  assert(inferStage('disagreed: field reads "Other" after trying: McGrath') === 'VERIFY', 'stage/verify-disagreed');
  assert(inferStage('could not select "USD" - field reads ""') === 'VERIFY', 'stage/verify-could-not-select');
  assert(inferStage('network socket reset') === 'OTHER', 'stage/other-fallback');

  /* ── 3. Widget kind classification ──────────────────────────────────── */

  assert(
    classifyWidgetKind({ action: 'lovSelect', selector: 'input[id$="lovDialog"]' }) === 'LOV_MODAL',
    'widget/lovSelect-modal'
  );
  assert(
    classifyWidgetKind({ action: 'lovSelect', selector: 'input[id$="afrAutoSuggest"]' }) === 'LOV_SUGGEST',
    'widget/lovSelect-suggest'
  );
  assert(
    classifyWidgetKind({ action: 'selectOption', selector: 'select#currency' }) === 'NATIVE_SELECT',
    'widget/selectOption'
  );
  assert(
    classifyWidgetKind({ action: 'fill', selector: 'input[name="desc"]' }) === 'TEXTBOX',
    'widget/fill-textbox'
  );
  assert(
    classifyWidgetKind({ action: 'click', selector: 'button[name="save"]' }) === 'BUTTON',
    'widget/click-button'
  );

  /* ── 4. Signature masking and key stability ─────────────────────────── */

  const rawSel1 = 'input[name="req123"] >> internal:text="Supplier Corp" >> nth=2';
  const rawSel2 = 'input[name="req999"] >> internal:text="Acme LLC" >> nth=2';
  const norm1 = normaliseSignature(rawSel1);
  const norm2 = normaliseSignature(rawSel2);
  assert(norm1 === 'input[name=#] >> internal:text=# >> nth=#', 'signature/volatile-tokens-masked');
  assert(norm1 === norm2, 'signature/different-instances-produce-identical-signature');

  const keyOf = (sel) =>
    buildFixKey({
      uiCode: 'ADF',
      action: 'lovSelect',
      widgetKind: 'LOV_MODAL',
      failureStage: 'OPEN',
      stepSignature: buildStepSignature('Select Business Unit', sel),
    });
  assert(keyOf(rawSel1) === keyOf(rawSel2), 'key/keys-match-after-masking');
  assert(sha256(keyOf(rawSel1)) === sha256(keyOf(rawSel2)), 'key/hash-matches-after-masking');

  /* ── 5. Value leak trap ─────────────────────────────────────────────── */

  const dirtyAiSteps = [
    { action: 'fill', locator: { selector: 'input[name="supplier"]' }, value: 'Acme Confidential Corporation' },
    { action: 'fill', locator: { selector: 'input[name="bu"]' }, value: '${businessUnit}' },
    { action: 'click', locator: { selector: 'button[name="ok"]' } },
  ];

  const sanitized = sanitizeFixStepsForLibrary(dirtyAiSteps);
  assert(
    sanitized[0].value === '' && sanitized[0].has_unparameterized_value === true,
    'value-leak/literal-customer-value-scrubbed-from-library-steps'
  );
  assert(sanitized[1].value === '${businessUnit}', 'value-leak/parameter-placeholder-preserved');
  assert(sanitized[2].value === undefined, 'value-leak/click-step-untouched');

  /* ── 6. The record built for the platform ───────────────────────────── */

  const record = buildFixRecord({
    heal: {
      index: 4,
      action: 'lovSelect',
      description: 'Search and Select BU',
      rawDescription: 'Search and Select BU',
      rawSelector: 'input[name="testBu"]',
      uiCode: 'ADF',
      failureStage: 'OPEN',
      model: 'claude-sonnet-5',
      steps: dirtyAiSteps,
    },
    originalStep: null,
    aiSteps: dirtyAiSteps,
  });
  assert(record.fixKeyHash === sha256(record.fixKey), 'record/hash-is-the-hash-of-the-key');
  assert(record.hasUnparameterizedValue === true, 'record/unparameterized-value-is-flagged');
  assert(
    record.fixSteps.every((s) => s.value === undefined || s.value === '' || /^\$\{[^}]+\}$/.test(s.value)),
    'record/no-literal-value-survives-into-the-record'
  );
  assert(
    JSON.stringify(record).includes('Acme Confidential') === false,
    'record/customer-literal-appears-nowhere-in-the-posted-record'
  );

  /* ── 7. The callbacks reach the platform, correctly addressed ───────── */

  {
    const platform = await stubPlatform(200);
    const callbacks = new CallbackClient(
      {
        jobExecutionId: 'job-1',
        callbackUrl: `http://127.0.0.1:${platform.port}/api/internal/replay/`,
        callbackToken: 'tok-abc',
      },
      () => {}
    );

    assert(callbacks.enabled === true, 'callback/enabled-when-a-url-is-supplied');
    assert(await callbacks.postAiFix(record), 'callback/ai-fix-posted');
    assert(await callbacks.postStep({ index: 0, status: 'success' }), 'callback/step-posted');
    assert(await callbacks.postHeartbeat({ phase: 'running' }), 'callback/heartbeat-posted');

    assert(
      platform.received[0].url === '/api/internal/replay/job-1/ai-fixes',
      'callback/trailing-slash-on-the-base-url-does-not-double',
      platform.received[0].url
    );
    assert(platform.received[1].url === '/api/internal/replay/job-1/steps', 'callback/step-path');
    assert(platform.received[2].url === '/api/internal/replay/job-1/heartbeat', 'callback/heartbeat-path');
    assert(platform.received[0].auth === 'Bearer tok-abc', 'callback/token-sent-as-a-bearer');

    await platform.close();
  }

  /* ── 8. Fire and forget: nothing here may fail a run ────────────────── */

  {
    const broken = await stubPlatform(500);
    const callbacks = new CallbackClient(
      { jobExecutionId: 'job-2', callbackUrl: `http://127.0.0.1:${broken.port}/cb`, callbackToken: 't' },
      () => {}
    );
    let threw = false;
    let result;
    try {
      result = await callbacks.postStep({ index: 1, status: 'failed' });
    } catch (_) {
      threw = true;
    }
    assert(!threw, 'fire-and-forget/a-500-from-the-platform-does-not-throw');
    assert(result === false, 'fire-and-forget/a-500-is-reported-as-not-delivered');
    await broken.close();
  }

  {
    // Nothing listening at all — the hardest case, and the one a real outage
    // looks like.
    const callbacks = new CallbackClient(
      { jobExecutionId: 'job-3', callbackUrl: 'http://127.0.0.1:1/cb', callbackToken: 't' },
      () => {}
    );
    let threw = false;
    try {
      await callbacks.postHeal({ index: 0, fix: { steps: [] } });
    } catch (_) {
      threw = true;
    }
    assert(!threw, 'fire-and-forget/an-unreachable-platform-does-not-throw');
  }

  {
    // A dispatch with no callbackUrl is legal: the run still executes and still
    // streams, it simply has nowhere to write back to. That is what keeps a
    // replay reproducible by hand.
    const callbacks = new CallbackClient({ jobExecutionId: 'job-4' }, () => {});
    assert(callbacks.enabled === false, 'fire-and-forget/no-callback-url-means-callbacks-off');
    assert((await callbacks.postStep({ index: 0 })) === false, 'fire-and-forget/posting-without-a-url-is-a-no-op');
    const log = await reportAiFix(callbacks, record);
    assert(/no callback configured/.test(log), 'fire-and-forget/reportAiFix-says-so-rather-than-throwing');
  }

  /* ── 9. Heals: placement is the platform's, safety is ours ──────────── */

  {
    const platform = await stubPlatform(200);
    const callbacks = new CallbackClient(
      { jobExecutionId: 'job-5', callbackUrl: `http://127.0.0.1:${platform.port}/cb`, callbackToken: 't' },
      () => {}
    );

    const dispatchedSteps = [
      { action: 'fill', description: 'Business Unit', value: '${businessUnit}', locator: { selector: '[id="a-b-c"]' } },
    ];

    const { log } = await reportHeal({
      heal: {
        index: 0,
        description: 'Business Unit',
        reason: 'selector moved',
        failureStage: 'LOCATE',
        steps: [{ action: 'fill', locator: { selector: '[id="a-b-c"]' }, value: 'McGrath' }],
      },
      dispatchedSteps,
      parameters: { businessUnit: 'McGrath RentCorp' },
      callbacks,
      jobExecutionId: 'job-5',
    });

    const posted = platform.received.find((r) => r.url.endsWith('/heals'));
    assert(Boolean(posted), 'heal/posted-to-the-heals-endpoint', log);
    assert(
      posted && posted.body.fix.steps[0].value === '${businessUnit}',
      'heal/a-typed-prefix-goes-back-to-being-a-placeholder',
      posted && JSON.stringify(posted.body.fix.steps[0])
    );
    assert(
      posted && !JSON.stringify(posted.body).includes('McGrath'),
      'heal/the-customer-value-is-not-in-what-is-posted'
    );

    // A fix pinned to an id the application regenerates every session is dead
    // by the next run, and the replayer WAITS on it before falling back.
    // Storing it is worse than storing nothing.
    const volatileResult = await reportHeal({
      heal: {
        index: 0,
        description: 'Business Unit',
        steps: [{ action: 'fill', locator: { selector: '[id="zzz-qqq-www"]' }, value: '${businessUnit}' }],
      },
      dispatchedSteps,
      parameters: {},
      callbacks,
      jobExecutionId: 'job-5',
    });
    assert(
      volatileResult.record === null && /session-specific id/.test(volatileResult.log),
      'heal/a-fix-pinned-to-a-volatile-id-is-refused',
      volatileResult.log
    );

    await platform.close();
  }

  assert(
    stabilizeSelector('[id="frag-NEW-tableID:1_1"]', '[id="frag-OLD-tableID:1_1"]').selector ===
      '[id^="frag-"][id$="-tableID:1_1"]',
    'heal/one-volatile-segment-is-wildcarded-rather-than-refused'
  );

  /* ── 10. The timeout invariant ──────────────────────────────────────── */

  let inverted = null;
  for (const steps of [0, 1, 5, 21, 47, 90, 200, 1000, 10_000]) {
    if (!(outerDeadlineMs(steps) > engineRunTimeoutMs(steps))) inverted = steps;
  }
  assert(
    inverted === null,
    'timeout/the-outer-deadline-is-always-above-the-engine-deadline',
    inverted === null ? '' : `inverted at ${inverted} steps`
  );
  assert(
    engineRunTimeoutMs(21) === engineRunTimeoutMs(21),
    'timeout/the-derivation-is-deterministic'
  );
  assert(
    engineRunTimeoutMs(10_000) === engineRunTimeoutMs(100_000),
    'timeout/the-engine-deadline-is-clamped-at-the-ceiling'
  );

  console.log(`\n${passed}/${passed + failed} AI fix + callback checks passed\n`);
  // Set the code and let the loop drain rather than process.exit()ing on top
  // of sockets that are still closing — an abrupt exit there trips a libuv
  // assertion on Windows and turns a green suite into exit code 127.
  process.exitCode = failed > 0 ? 1 : 0;
}

runTests().catch((err) => {
  console.error('Check suite threw:', err);
  process.exitCode = 1;
});
