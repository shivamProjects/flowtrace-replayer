/**
 * Behaviour checks for the deterministic error classifier (engine/errors.ts).
 *
 *   node checks/errors.mjs             run everything
 *   node checks/errors.mjs duplicate   run cases whose name contains "duplicate"
 *
 * Pure logic: no browser, no network, no database. Every message asserted below
 * is VERBATIM from api_execution_history (191 failed executions), reproduced
 * here so the corpus is pinned in the repo and the checks stay offline. The two
 * cases whose input is NOT from that corpus say so in their name.
 *
 * What these pin down, in order of how much it would cost to get wrong:
 *
 *   1. A THROWN typed error is never routed to the model, and never has its
 *      category re-derived from text. TargetNotPresentError in particular must
 *      stay ENVIRONMENT_ERROR: the whole module exists because 7 scripts in one
 *      batch were blamed on selectors when the pod was missing a task link.
 *   2. Rule ORDER. Most rules here would still "match" if the table were
 *      shuffled, but they would match the WRONG thing — a logged-out session and
 *      a duplicate invoice both carry a trailing timeout. Order is asserted
 *      directly, by feeding messages that satisfy two rules at once.
 *   3. R900 never yields TARGET_NOT_PRESENT. That category is unreachable from
 *      text by construction, and this check is what keeps it that way.
 */

import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const req = createRequire(import.meta.url);

/**
 * The engine is TypeScript and the rest of the service is CommonJS JavaScript,
 * so there is nothing to require directly. Playwright transpiles the engine with
 * esbuild at run time; this does the same job with the `typescript` devDependency
 * that is already installed for `npm run typecheck`, writing plain CJS into a
 * work directory and requiring that.
 *
 * Deliberately not ts-node or a loader hook: this file must stay runnable with a
 * bare `node checks/errors.mjs`, exactly like the other checks.
 */
// Inside checks/.work/, which .gitignore already excludes — a new sibling
// directory would otherwise show up as untracked in every status.
const WORK = join(HERE, '.work', 'errors-cjs');
mkdirSync(WORK, { recursive: true });
const ts = req('typescript');
function compile(name) {
  const src = readFileSync(join(ROOT, 'engine', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const out = join(WORK, `${name}.js`);
  writeFileSync(out, outputText);
  return out;
}
compile('aiFixClassifier');
const {
  classify,
  buildMessage,
  isClassifiedError,
  RULES,
  CODE_RULES,
  codesFromEnvelope,
  codesFromText,
  ClassifiedError,
  TargetNotPresentError,
  StateConflictError,
  DuplicateRecordError,
  SessionExpiredError,
  UnresolvedParameterError,
  FillNotCommittedError,
  AccessDeniedError,
} = req(compile('errors'));

// ═══════════════════════════════════════════════════════════════════════════════

const filter = process.argv[2] ? process.argv[2].toLowerCase() : null;
let passed = 0;
let failed = 0;
const seenRules = new Set();

function assert(condition, name, details = '') {
  if (filter && !name.toLowerCase().includes(filter)) return;
  if (condition) {
    console.log(`pass  ${name}`);
    passed++;
  } else {
    console.error(`FAIL  ${name} — ${details}`);
    failed++;
  }
}

/**
 * The workhorse: assert a real message reaches a specific rule with a specific
 * verdict on BOTH axes. Every field is asserted, not just the rule id — a rule
 * that fires with the wrong responsibility is worse than one that does not fire,
 * because it sends a human to the wrong team with confidence.
 */
function expectRule(name, message, want) {
  seenRules.add(want.ruleId);
  const v = classify({ message });
  const got = {
    ruleId: v.ruleId,
    source: v.source,
    category: v.category,
    responsibility: v.responsibility,
    kind: v.kind,
  };
  const wanted = { source: 'rule', ...want };
  const ok = Object.keys(wanted).every((k) => got[k] === wanted[k]);
  assert(ok, name, `wanted ${JSON.stringify(wanted)}, got ${JSON.stringify(got)}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. THROWN — the engine already knows, so nothing may be inferred
// ═══════════════════════════════════════════════════════════════════════════════

{
  const e = new TargetNotPresentError('Register Supplier', { instance: 'MGRC-DEV1', searched: 214 });
  const v = classify({ error: e, message: 'locator.waitFor: Timeout 80000ms exceeded' });
  assert(
    v.source === 'thrown' && v.category === 'TARGET_NOT_PRESENT',
    'thrown TargetNotPresent wins over the timeout text it is wrapped in',
    JSON.stringify(v),
  );
  assert(
    v.responsibility === 'ENVIRONMENT_ERROR' && v.kind === 'Setup Missing',
    'thrown TargetNotPresent is ENVIRONMENT_ERROR/Setup Missing, never AUTOMATION_ERROR',
    JSON.stringify(v),
  );
  assert(v.ruleId === 'TargetNotPresentError', 'thrown verdict names the error class', v.ruleId);
}

for (const [label, e, category, responsibility] of [
  ['TargetNotPresentError', new TargetNotPresentError('Register Supplier'), 'TARGET_NOT_PRESENT', 'ENVIRONMENT_ERROR'],
  ['StateConflictError', new StateConflictError('this action is not allowed'), 'STATE_CONFLICT', 'EXPECTED_VALIDATION'],
  ['DuplicateRecordError', new DuplicateRecordError('dupe'), 'DUPLICATE_RECORD', 'EXPECTED_VALIDATION'],
  ['SessionExpiredError', new SessionExpiredError(), 'SESSION_EXPIRED', 'ENVIRONMENT_ERROR'],
  ['UnresolvedParameterError', new UnresolvedParameterError('invoiceNumber'), 'UNRESOLVED_PARAMETER', 'AUTOMATION_ERROR'],
  ['FillNotCommittedError', new FillNotCommittedError('Amount', '100', ''), 'FILL_NOT_COMMITTED', 'AUTOMATION_ERROR'],
  ['AccessDeniedError', new AccessDeniedError(), 'ACCESS_DENIED', 'SECURITY_ERROR'],
]) {
  const v = classify({ error: e });
  assert(
    v.source === 'thrown' && v.category === category && v.responsibility === responsibility,
    `thrown ${label} is never routed to needs-model`,
    JSON.stringify(v),
  );
}

{
  // The cross-copy trap: esbuild can load two copies of the module, and then
  // instanceof is false. A duck-typed error must still be honoured.
  const plain = {
    category: 'TARGET_NOT_PRESENT',
    responsibility: 'ENVIRONMENT_ERROR',
    kind: 'Setup Missing',
    stage: 'LOCATE',
    name: 'TargetNotPresentError',
  };
  assert(isClassifiedError(plain), 'a duck-typed classified error from another module copy is honoured');
  assert(classify({ error: plain }).source === 'thrown', 'duck-typed error still classifies as thrown');
  assert(!isClassifiedError(new Error('boom')), 'a plain Error is not treated as classified');
  assert(!isClassifiedError(null) && !isClassifiedError('x'), 'null and strings are not classified errors');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. RULES — one case per rule, every input verbatim from the 191 rows
// ═══════════════════════════════════════════════════════════════════════════════

expectRule('R010 operator cancellation is not a defect', 'Execution stopped by user', {
  ruleId: 'R010',
  category: 'RUN_CANCELLED',
  responsibility: 'UNKNOWN',
  kind: 'System Error',
});

expectRule(
  'R020 runner death is environment, not automation',
  'Execution did not finish — the runner stopped while it was still running',
  { ruleId: 'R020', category: 'RUNNER_FAILED', responsibility: 'ENVIRONMENT_ERROR', kind: 'System Error' },
);

expectRule(
  'R030 spec produced no results',
  'Spec produced no results (exit code 1) — Error Context: test-results/action-replayer-Dynamic-Ac-7dcc1-yer-Replay-recorded-actions-chromium/error-context.md | 1 failed',
  { ruleId: 'R030', category: 'RUNNER_FAILED', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

expectRule(
  'R040 unresolved dependency parameter',
  'Dependency script failed — bound parameter could not be resolved',
  { ruleId: 'R040', category: 'UNRESOLVED_PARAMETER', responsibility: 'AUTOMATION_ERROR', kind: 'Missing Data' },
);

expectRule(
  'R050 browser lost mid-run',
  'Step 6 (Remove Record Filter) failed: locator.waitFor: Target page, context or browser has been closed',
  { ruleId: 'R050', category: 'BROWSER_LOST', responsibility: 'ENVIRONMENT_ERROR', kind: 'System Error' },
);

expectRule(
  'R110 access-denied page is a security issue',
  "Step 24 (Click Email Field) failed: locator.waitFor: Timeout 70000ms exceeded. (AI recovery also failed: The page is at an \"access-denied\" URL and contains no Email field or textbox.)",
  { ruleId: 'R110', category: 'ACCESS_DENIED', responsibility: 'SECURITY_ERROR', kind: 'Access Issue' },
);

expectRule(
  'R120 sign-in page beats the timeout it is wrapped in',
  "Step 9 (Open Home) failed: locator.waitFor: Timeout 70000ms exceeded. Call log: - waiting for getByRole('link', { name: 'Home', exact: true }) to be visible (AI recovery also failed: The current page is the Oracle Identity Cloud sign-in page, not the application. There is no \"Home\" link present to click; the user session appears logged out.)",
  { ruleId: 'R120', category: 'SESSION_EXPIRED', responsibility: 'ENVIRONMENT_ERROR', kind: 'Access Issue' },
);

expectRule(
  'R210 duplicate supplier number',
  'Step 29 (Click Create): Oracle rejected the data — A record with the value 234554673 already exists. Enter a unique value.',
  { ruleId: 'R210', category: 'DUPLICATE_RECORD', responsibility: 'EXPECTED_VALIDATION', kind: 'Duplicate Data' },
);

expectRule(
  // Same row with the "(AP-810245)" suffix stripped, so it exercises the TEXT
  // rule. With the code present it is claimed by the code layer instead — the
  // case immediately below pins that, and the two together pin the precedence.
  'R210 duplicate invoice number, a different phrasing of the same thing',
  "Step 22 (Click Save): Oracle rejected the data — You must enter a different number. There's already an invoice with that number.",
  { ruleId: 'R210', category: 'DUPLICATE_RECORD', responsibility: 'EXPECTED_VALIDATION', kind: 'Duplicate Data' },
);

expectRule(
  'R210 duplicate combination of values',
  'Step 82 (Click Save): Oracle rejected the data — A record with this combination of values already exists.',
  { ruleId: 'R210', category: 'DUPLICATE_RECORD', responsibility: 'EXPECTED_VALIDATION', kind: 'Duplicate Data' },
);

expectRule(
  // AUTOMATION_ERROR, not EXPECTED_VALIDATION: in a single-user replay there is
  // no other user, so this is a stale ETag of our own making.
  'R215 row changed by another user is self-inflicted in a single-user replay',
  'Step 28 (Click Save): Oracle rejected the data — Another user has changed the row with primary key oracle.jbo.Key[300000048914681 ].',
  { ruleId: 'R215', category: 'STATE_CONFLICT', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

expectRule(
  // NOT FROM THE CORPUS. The already-validated invoice is the reported
  // production case that motivated STATE_CONFLICT; no row in the 191 carries it.
  'R220 already-validated invoice (NOT-IN-CORPUS: reported case, phrasing assumed)',
  'Step 31 (Click Validate): Oracle rejected the data — this action is not allowed',
  { ruleId: 'R220', category: 'STATE_CONFLICT', responsibility: 'EXPECTED_VALIDATION', kind: 'Invalid Data' },
);

expectRule(
  'R230 value not in the list of values is a setup gap, not a validation',
  'Step 35 (Click Save): Oracle rejected the data — This combination is invalid: Cost Center 12 is not in the list of values.',
  { ruleId: 'R230', category: 'VALIDATION_REJECTED', responsibility: 'DATA_ERROR', kind: 'Setup Missing' },
);

expectRule(
  'R240 required fields missing',
  'Step 29 (Click Create): Oracle rejected the data — Address Name: You must enter a value. | Country: You must enter a value. | Address Purpose: You must make at least one selection.',
  { ruleId: 'R240', category: 'VALIDATION_REJECTED', responsibility: 'EXPECTED_VALIDATION', kind: 'Missing Data' },
);

expectRule(
  // Code suffix stripped so this exercises the text rule; the coded form is
  // pinned in the code-layer section below.
  'R240 missing line amount',
  'Step 31 (Open Invoice Actions): Oracle rejected the data — You must provide a value for the Amount attribute for line 1.',
  { ruleId: 'R240', category: 'VALIDATION_REJECTED', responsibility: 'EXPECTED_VALIDATION', kind: 'Missing Data' },
);

expectRule(
  // NOT FROM THE CORPUS: documented Oracle string. It must NOT be filed as
  // SECURITY_ERROR terminally — see the retry case below.
  'R100 unauthorized access (NOT-IN-CORPUS: documented, deliberately ambiguous)',
  'Unauthorized Access: Either you do not have the privilege, or you have not signed in.',
  { ruleId: 'R100', category: 'ACCESS_DENIED', responsibility: 'SECURITY_ERROR', kind: 'Access Issue' },
);

expectRule(
  'R310 strict mode violation is a script defect',
  "Step 47 (Select Address) failed: locator.waitFor: Error: strict mode violation: getByRole('gridcell', { name: /jabalpur/i }) resolved to 10 elements",
  { ruleId: 'R310', category: 'AMBIGUOUS_TARGET', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

expectRule(
  'R320 element not visible',
  "Step 35 (Click Validate) failed: locator.click: Element is not visible Call log: - waiting for getByText('Validate', { exact: true })",
  { ruleId: 'R320', category: 'ELEMENT_NOT_INTERACTABLE', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

expectRule(
  'R320 element outside of the viewport',
  "Step 11 (Open Payables) failed: locator.click: Element is outside of the viewport Call log: - waiting for getByRole('link', { name: /Payables/i })",
  { ruleId: 'R320', category: 'ELEMENT_NOT_INTERACTABLE', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

expectRule(
  'R330 option not offered is the run data, not the script',
  'Step 75 (Select Life in Years) failed: selectOption could not select "35" — tried label "35": locator.selectOption: Timeout 30000ms exceeded',
  { ruleId: 'R330', category: 'OPTION_NOT_AVAILABLE', responsibility: 'DATA_ERROR', kind: 'Invalid Data' },
);

expectRule(
  // NOT FROM THE CORPUS: the read-back verifier post-dates these 191 rows.
  'R340 fill not committed (NOT-IN-CORPUS: mirrors the thrown error)',
  'Step 12 (Fill Amount) failed: field "Amount" did not keep the value it was given',
  { ruleId: 'R340', category: 'FILL_NOT_COMMITTED', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

expectRule(
  // NOT FROM THE CORPUS: zero rows contain a literal ${...}. R040 is the same
  // bug caught one layer earlier, and that one has 5 real rows.
  'R350 literal ${param} reached a field (NOT-IN-CORPUS: invented, mirrors the thrown error)',
  'Step 12 (Fill Invoice Number) failed: field reads "${invoiceNumber}" after fill',
  { ruleId: 'R350', category: 'UNRESOLVED_PARAMETER', responsibility: 'AUTOMATION_ERROR', kind: 'Missing Data' },
);

expectRule(
  'R900 plain locator timeout is the honest floor',
  "Step 56 (Click Next Line) failed: locator.waitFor: Timeout 80000ms exceeded. Call log: - waiting for locator('.p_AFHome') to be visible",
  { ruleId: 'R900', category: 'LOCATOR_TIMEOUT', responsibility: 'AUTOMATION_ERROR', kind: 'System Error' },
);

assert(
  seenRules.size === RULES.length,
  'every rule in the table has at least one case',
  `table has ${RULES.length} rules, cases cover ${seenRules.size}: missing ${RULES.map((r) => r.id)
    .filter((id) => !seenRules.has(id))
    .join(',') || '(none)'}`,
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ORDER — the part that would silently rot
// ═══════════════════════════════════════════════════════════════════════════════

{
  // Every one of these satisfies R900 too. If R900 ever moves up, all of them
  // collapse into LOCATOR_TIMEOUT and the module is worth nothing.
  const ambiguous = [
    ['R120', 'Timeout 70000ms exceeded (AI recovery also failed: The current page is an Oracle IDCS sign-in page)'],
    ['R330', 'selectOption could not select "35" — tried label "35": locator.selectOption: Timeout 30000ms exceeded'],
    ['R110', 'locator.waitFor: Timeout 70000ms exceeded (the page navigated to an "access-denied" error page)'],
  ];
  for (const [want, message] of ambiguous) {
    assert(
      classify({ message }).ruleId === want,
      `order: ${want} beats R900 on a message that also carries a timeout`,
      classify({ message }).ruleId,
    );
  }

  // A single submit reports both. The duplicate is the one a human must act on,
  // so R210 must precede R240 in the text tier...
  const bothText =
    'Step 33: Oracle rejected the data — You must provide a value for the Amount attribute for line 1. | ' +
    "You must enter a different number. There's already an invoice with that number.";
  assert(
    classify({ message: bothText }).ruleId === 'R210',
    'order: a submit reporting BOTH a missing field and a duplicate is filed as the duplicate (text tier)',
    classify({ message: bothText }).ruleId,
  );
  // ...and CODE_RULES must be ordered the same way, because the real row carries
  // AP-810879 FIRST in the string and AP-810245 second. Message order must not
  // decide; table order must.
  const bothCoded =
    "Step 33 (Open Invoice Actions): Oracle rejected the data — You must provide a value for the Amount attribute for line 1. (AP-810879) | You must enter a different number. There's already an invoice with that number. (AP-810245)";
  assert(
    classify({ message: bothCoded }).ruleId === 'AP-810245',
    'order: with two codes present, CODE_RULES order wins over the order Oracle printed them',
    classify({ message: bothCoded }).ruleId,
  );

  // R010 must outrank everything: a cancelled run must never be filed as a defect.
  assert(
    classify({ message: 'Execution stopped by user — locator.waitFor: Timeout 80000ms exceeded' }).ruleId === 'R010',
    'order: operator cancellation outranks any step text attached to it',
  );

  // Table order is itself asserted, so an accidental reshuffle is loud.
  assert(
    RULES.map((r) => r.id).join(',') ===
      'R010,R020,R030,R040,R050,R100,R110,R120,R210,R215,R220,R230,R240,R310,R320,R330,R340,R350,R900',
    'the rule table is in its documented order',
    RULES.map((r) => r.id).join(','),
  );
  assert(
    RULES[RULES.length - 1].id === 'R900',
    'the general locator timeout is last in the table, always',
  );
  assert(
    new Set(RULES.map((r) => r.id)).size === RULES.length,
    'rule ids are unique',
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3b. THE CODE LAYER — locale-independent, and it outranks every text rule
// ═══════════════════════════════════════════════════════════════════════════════

{
  // MEASURED on dev79: the code lives NESTED in o:errorDetails[], as "29140"
  // with the JBO- prefix stripped, and the TOP LEVEL carried no o:errorCode at
  // all. A parser reading only the top level finds nothing — this is the case
  // that pins the walk.
  const envelope = {
    title: 'Bad Request',
    status: '400',
    'o:errorDetails': [
      { code: '29140', detail: 'Failed to build ViewCriteria from expression "NotAField=\'x\'"' },
    ],
  };
  assert(
    codesFromEnvelope(envelope).includes('JBO-29140'),
    'nested o:errorDetails[].code "29140" is read as JBO-29140',
    JSON.stringify(codesFromEnvelope(envelope)),
  );
  assert(
    codesFromEnvelope({ title: 'Bad Request', status: '400' }).length === 0,
    'an envelope with no code anywhere yields no codes rather than throwing',
  );
  const v = classify({ envelope, message: 'locator.waitFor: Timeout 80000ms exceeded' });
  assert(
    v.ruleId === 'JBO-29140' && v.code === 'JBO-29140' && v.responsibility === 'AUTOMATION_ERROR',
    'the nested envelope code beats the timeout text wrapped around it',
    JSON.stringify(v),
  );
  assert(
    codesFromEnvelope(null).length === 0 &&
      codesFromEnvelope('not an envelope').length === 0 &&
      codesFromEnvelope(undefined).length === 0,
    'codesFromEnvelope never throws on junk input',
  );
  // Top-level o:errorCode is read too, but is documented as often absent.
  assert(
    codesFromEnvelope({ 'o:errorCode': 'EGP-2776154' }).includes('EGP-2776154'),
    'top-level o:errorCode is read when it IS present',
  );
}

{
  // The plain (no version header) response, which is what UI-path failures carry.
  const plain =
    'You must enter at least 3 characters in one of these fields: ItemNumber,ItemDescription,Keyword. (EGP-2776154)';
  assert(
    codesFromText(plain).join(',') === 'EGP-2776154',
    'a parenthesised code is scraped from plain message text',
    codesFromText(plain).join(','),
  );
  const v = classify({ message: plain });
  assert(
    v.code === 'EGP-2776154' && v.responsibility === 'AUTOMATION_ERROR' && v.category === 'VALIDATION_REJECTED',
    'a too-short search term is our bug, not the data',
    JSON.stringify(v),
  );
}

{
  // JBO-25014 is the one place the code layer deliberately DISAGREES with a text
  // rule, and it must win.
  const v = classify({ message: 'Another user has changed the row with primary key oracle.jbo.Key[3] (JBO-25014)' });
  assert(
    v.ruleId === 'JBO-25014' && v.responsibility === 'AUTOMATION_ERROR' && v.category === 'STATE_CONFLICT',
    'JBO-25014 is AUTOMATION_ERROR in a single-user replay — a stale ETag of our own',
    JSON.stringify(v),
  );
  assert(
    new Set(CODE_RULES.map((c) => c.code)).size === CODE_RULES.length,
    'code rule codes are unique',
  );
  // The exact list, in order. Without this the reachability loop below is
  // self-referential — it probes with whatever code the table happens to hold,
  // so renaming a code would "pass". Mutation testing found exactly that.
  assert(
    CODE_RULES.map((c) => c.code).join(',') ===
      'AP-810245,POZ-2130479,JBO-25014,JBO-29140,EGP-2776154,AP-810879,AR-856687,AR-855322,AR-856520,AR-856522',
    'the code rule table holds exactly the documented codes, in the documented order',
    CODE_RULES.map((c) => c.code).join(','),
  );
  // Each code's verdict is pinned individually, so changing one cannot hide
  // behind the reachability loop either.
  for (const [code, category, responsibility, kind] of [
    ['POZ-2130479', 'DUPLICATE_RECORD', 'EXPECTED_VALIDATION', 'Duplicate Data'],
    ['AP-810879', 'VALIDATION_REJECTED', 'EXPECTED_VALIDATION', 'Missing Data'],
    ['AR-856687', 'VALIDATION_REJECTED', 'EXPECTED_VALIDATION', 'Missing Data'],
    ['AR-855322', 'VALIDATION_REJECTED', 'DATA_ERROR', 'Setup Missing'],
    ['AR-856520', 'VALIDATION_REJECTED', 'EXPECTED_VALIDATION', 'Missing Data'],
    ['AR-856522', 'VALIDATION_REJECTED', 'EXPECTED_VALIDATION', 'Missing Data'],
  ]) {
    const got = classify({ message: `Oracle rejected the data — something (${code})` });
    assert(
      got.code === code && got.category === category && got.responsibility === responsibility && got.kind === kind,
      `code ${code} yields its documented verdict`,
      JSON.stringify(got),
    );
  }
  assert(
    CODE_RULES.every((c) => /^[A-Z][A-Z0-9]{1,5}-\d{3,9}$/.test(c.code)),
    'every code rule is keyed on a well-formed Oracle message code',
    CODE_RULES.map((c) => c.code).filter((c) => !/^[A-Z][A-Z0-9]{1,5}-\d{3,9}$/.test(c)).join(','),
  );
  // Every code rule must be reachable from a message carrying only its own code.
  // A rule masked by an earlier entry would otherwise sit in the table looking
  // like coverage while never firing.
  const unreachable = CODE_RULES.filter((c) => {
    const v = classify({ message: `Oracle rejected the data — something (${c.code})` });
    return v.ruleId !== c.code || v.category !== c.category || v.kind !== c.kind;
  }).map((c) => c.code);
  assert(unreachable.length === 0, 'every code rule is reachable and yields its own verdict', unreachable.join(','));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3c. RESPONSIBILITY IS NOT TEXTUALLY DECIDABLE — only the scenario's intent is
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dupe = "Oracle rejected the data — You must enter a different number. There's already an invoice with that number.";
  const blind = classify({ message: dupe });
  assert(blind.kind === 'Duplicate Data', 'the KIND of a duplicate is decidable from the message', blind.kind);
  assert(
    blind.confidence === 'assumed' && blind.responsibilityDependsOnIntent === true,
    'without an intent the responsibility is flagged as assumed, not presented as fact',
    JSON.stringify(blind),
  );

  const negative = classify({ message: dupe, intent: 'expects-rejection' });
  assert(
    negative.responsibility === 'EXPECTED_VALIDATION' && negative.confidence === 'certain',
    'a scenario that MEANT to submit a duplicate makes the rejection EXPECTED_VALIDATION',
    JSON.stringify(negative),
  );

  const positive = classify({ message: dupe, intent: 'expects-success' });
  assert(
    positive.responsibility === 'DATA_ERROR' && positive.confidence === 'certain',
    'the SAME text with an expects-success intent is DATA_ERROR — the text alone cannot decide',
    JSON.stringify(positive),
  );
  assert(
    positive.kind === negative.kind && positive.kind === 'Duplicate Data',
    'intent changes the responsibility axis only; the kind is unmoved',
  );

  // Intent must NOT be allowed to move a verdict that has nothing to do with data.
  const timeout = classify({ message: 'locator.waitFor: Timeout 80000ms exceeded', intent: 'expects-success' });
  assert(
    timeout.responsibility === 'AUTOMATION_ERROR' && timeout.confidence === 'certain',
    'intent does not touch a rule whose responsibility does not depend on it',
    JSON.stringify(timeout),
  );
  assert(
    classify({ error: new DuplicateRecordError('x'), intent: 'expects-success' }).responsibility ===
      'EXPECTED_VALIDATION',
    'a THROWN verdict is never re-opened by intent — the throw site had the evidence',
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3d. AMBIGUOUS BY DESIGN — retry before committing
// ═══════════════════════════════════════════════════════════════════════════════

{
  const unauth = 'Unauthorized Access: Either you do not have the privilege, or you have not signed in.';
  const first = classify({ message: unauth });
  assert(
    first.retry === 'refresh-then-reclassify',
    'the unauthorized-access string is not terminal on first sight — a refresh may clear it',
    JSON.stringify(first),
  );
  const after = classify({ message: unauth, retried: true });
  assert(
    after.retry === null && after.responsibility === 'SECURITY_ERROR',
    'after a refresh has been tried, the SECURITY_ERROR reading stands',
    JSON.stringify(after),
  );
  assert(
    classify({ message: 'locator.waitFor: Timeout 80000ms exceeded' }).retry === null,
    'ordinary verdicts ask for no retry',
  );
  assert(
    RULES.filter((r) => r.retry).map((r) => r.id).join(',') === 'R100',
    'exactly one rule is non-terminal, and it is the documented ambiguous one',
    RULES.filter((r) => r.retry).map((r) => r.id).join(','),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TARGET_NOT_PRESENT is unreachable from text, and needs-model is real
// ═══════════════════════════════════════════════════════════════════════════════

assert(
  RULES.every((r) => r.category !== 'TARGET_NOT_PRESENT'),
  'no rule may assign TARGET_NOT_PRESENT — only a throw can assert it',
  RULES.filter((r) => r.category === 'TARGET_NOT_PRESENT').map((r) => r.id).join(','),
);

{
  // The message that motivated the whole module. From text alone it is only ever
  // a timeout; the engine must throw to say more.
  const v = classify({
    message:
      "Step 8 (Open Register Supplier) failed: locator.waitFor: Timeout 80000ms exceeded. Call log: - waiting for getByRole('link', { name: /Register Supplier/i })",
  });
  assert(
    v.category === 'LOCATOR_TIMEOUT',
    'the Register Supplier timeout is NOT inferred to be TARGET_NOT_PRESENT from text',
    v.category,
  );
}

{
  // Unrecognised Oracle text — the ONLY thing worth a model call. No row in the
  // 191 reaches this branch (all 28 Oracle rows match R210/R220/R230/R240), so
  // this input is synthetic on purpose: it proves the branch exists.
  const v = classify({
    message: 'Step 40 (Click Save): Oracle rejected the data — The ledger calendar is not open for this accounting date.',
  });
  assert(
    v.source === 'needs-model' && v.ruleId === null && v.category === 'UNCLASSIFIED',
    'unrecognised Oracle text falls through to needs-model rather than a wrong rule',
    JSON.stringify(v),
  );
  assert(v.responsibility === 'UNKNOWN', 'needs-model does not guess a responsibility', v.responsibility);
}

assert(
  classify({ message: '' }).source === 'needs-model' && classify({}).source === 'needs-model',
  'an empty or absent message is needs-model, not a crash',
);
assert(
  classify({ message: null, error: new Error('plain') }).source === 'needs-model',
  'a plain Error carries no category and does not short-circuit',
);

// ═══════════════════════════════════════════════════════════════════════════════
// 5. STAGE — reused from aiFixClassifier, never redefined
// ═══════════════════════════════════════════════════════════════════════════════

assert(
  classify({ message: 'Execution stopped by user' }).stage === 'OTHER',
  'a rule with a fixed stage uses it rather than inferring',
);
assert(
  ['LOCATE', 'OPEN', 'INPUT', 'COMMIT', 'VERIFY', 'OTHER'].includes(
    classify({ message: "locator.waitFor: Timeout 80000ms exceeded waiting for locator('#x')" }).stage,
  ),
  'R900 has no fixed stage and falls back to inferStage',
);
assert(
  classify({ message: 'Execution stopped by user', stage: 'COMMIT' }).stage === 'COMMIT',
  'a caller-supplied stage always wins',
);

// ═══════════════════════════════════════════════════════════════════════════════
// 6. THE MESSAGE a human reads
// ═══════════════════════════════════════════════════════════════════════════════

{
  const v = classify({ error: new TargetNotPresentError('Register Supplier', { instance: 'MGRC-DEV1', searched: 214 }) });
  const msg = buildMessage(v, {
    target: 'Register Supplier',
    instance: 'MGRC-DEV1',
    searched: 214,
    step: 'Step 8 (Open Register Supplier)',
  });
  assert(msg.includes('Register Supplier'), 'TARGET_NOT_PRESENT message names the thing', msg);
  assert(msg.includes('MGRC-DEV1'), 'TARGET_NOT_PRESENT message names the instance', msg);
  assert(msg.includes('provisioning'), 'TARGET_NOT_PRESENT message says it is a provisioning gap', msg);
  assert(
    /not a timeout/i.test(msg),
    'TARGET_NOT_PRESENT message explicitly denies being a timeout — the whole point',
    msg,
  );
  assert(!/Timeout \d+ms/.test(msg), 'TARGET_NOT_PRESENT message does not leak the raw Playwright timeout', msg);
}

{
  const msg = buildMessage(classify({ message: 'Step 31: Oracle rejected the data — this action is not allowed' }));
  assert(
    /behaved as designed/.test(msg),
    'STATE_CONFLICT message says the application was right to refuse',
    msg,
  );
  // Same category, opposite owner: the JBO-25014 reading must not tell the
  // reader "nothing is broken", because something is — ours.
  const ours = buildMessage(classify({ message: 'Another user has changed the row with primary key oracle.jbo.Key[3]' }));
  assert(
    /stale copy/.test(ours) && !/behaved as designed/.test(ours),
    'STATE_CONFLICT message follows the responsibility, not just the category',
    ours,
  );
}
{
  const msg = buildMessage(
    classify({ message: 'Oracle rejected the data — A record with the value 234554673 already exists. Enter a unique value.' }),
    { raw: 'A record with the value 234554673 already exists.' },
  );
  assert(/unique/.test(msg) && /234554673/.test(msg), 'DUPLICATE_RECORD message quotes what Oracle said', msg);
}
{
  const msg = buildMessage(classify({ message: 'The current page is an Oracle IDCS sign-in page' }), {
    instance: 'MGRC-DEV1',
  });
  assert(
    /consequence, not a cause/.test(msg),
    'SESSION_EXPIRED message warns that later timeouts are downstream',
    msg,
  );
}
{
  const msg = buildMessage(classify({ message: 'locator.waitFor: Timeout 80000ms exceeded' }));
  assert(
    /not determinable/.test(msg) && /before assuming a selector fault/.test(msg),
    'LOCATOR_TIMEOUT message refuses to pretend it is a diagnosis',
    msg,
  );
}
{
  // Every category must produce a non-empty sentence — a missing switch arm
  // would otherwise ship as an empty error message.
  const categories = [
    ...new Set([...RULES.map((r) => r.category), 'TARGET_NOT_PRESENT', 'UNCLASSIFIED']),
  ];
  const empty = categories.filter(
    (c) => !buildMessage({ category: c, responsibility: 'UNKNOWN', kind: 'Data Error', stage: 'OTHER', ruleId: null, source: 'rule' }, { raw: 'x' }),
  );
  assert(empty.length === 0, 'buildMessage produces a sentence for every category', empty.join(','));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. PURITY — the module must be safe to call anywhere
// ═══════════════════════════════════════════════════════════════════════════════

{
  const source = readFileSync(join(ROOT, 'engine', 'errors.ts'), 'utf8');
  const imports = [...source.matchAll(/^import[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]);
  assert(
    imports.every((i) => i === './aiFixClassifier'),
    'errors.ts imports nothing but the FailureStage vocabulary — no fs, no net, no SDK',
    imports.join(','),
  );
  assert(
    !/anthropic|openai|fetch\(|require\(/i.test(source.replace(/^\s*\*.*$/gm, '')),
    'errors.ts contains no model client and no dynamic require',
  );
  assert(
    !/export type FailureStage\s*=/.test(source),
    'FailureStage is imported from aiFixClassifier, not redefined',
  );
}

// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
