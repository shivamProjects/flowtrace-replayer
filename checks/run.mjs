/**
 * Behaviour checks for the replay engine.
 *
 *   node checks/run.mjs            run everything
 *   node checks/run.mjs amount     run cases whose name contains "amount"
 *
 * Why this exists, stated plainly: every defect found in the engine so far has
 * been in the VERIFICATION layer — the code whose entire job is to decide
 * whether a step really worked. A mistake there does not announce itself; it
 * silently converts a wrong outcome into a green one, which is the one failure
 * this product cannot tolerate. So the verifier gets checked like anything else.
 *
 * Each case pins the OUTCOME, not the implementation: which steps pass, which
 * fail, and — where it is the whole point — the message. A case that flips is
 * either a regression or a deliberate behaviour change; both should be noticed
 * before anything ships.
 *
 * Cases are named for the defect they pin down, so a failure says what broke
 * rather than "case 7 failed".
 */

import os from 'node:os';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the Playwright CLI and run it with THIS node binary, rather than
// going through `npx`. Spawning npx.cmd from Node on Windows fails EINVAL
// without shell:true, and a shell brings its own quoting problems.
// Resolve the Playwright CLI and run it with THIS node binary, rather than
// going through `npx`. Spawning npx.cmd from Node on Windows fails EINVAL
// without shell:true, and a shell brings its own quoting problems.
// src/queue/specRunner.js resolves it the same way and for the same reason.
const req = createRequire(import.meta.url);
const PW_CLI = (() => {
  try {
    return req.resolve('@playwright/test/cli');
  } catch (_) {
    const pkgPath = req.resolve('@playwright/test/package.json');
    return resolve(dirname(pkgPath), 'cli.js');
  }
})();

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const WORK = join(HERE, '.work');

/**
 * Fixtures are served over HTTP, not opened as file:// URLs.
 *
 * The engine refuses to navigate to anything but http/https, because a
 * recording is untrusted input and `file:///opt/replayer/.env` would be
 * rendered into a full-page screenshot and shipped to S3 in the report. Serving
 * the fixtures keeps that rule absolute — no test-only escape hatch in
 * production code — and has the side benefit that these cases now exercise the
 * same transport a real replay uses.
 *
 * 127.0.0.1 is itself a blocked host, so the child is given
 * REPLAY_ALLOW_PRIVATE_HOSTS=true — the flag an on-premise install needs anyway.
 */
const fixtures = spawn(process.execPath, [join(HERE, 'fixture-server.mjs')], { stdio: ['ignore', 'pipe', 'inherit'] });
const ORIGIN = await new Promise((ok, fail) => {
  let buf = '';
  fixtures.stdout.on('data', (d) => {
    buf += d;
    const m = buf.match(/PORT=(\d+)/);
    if (m) ok(`http://127.0.0.1:${m[1]}`);
  });
  fixtures.on('exit', (code) => fail(new Error(`fixture server exited (${code}) before it was listening`)));
  setTimeout(() => fail(new Error('fixture server did not report a port within 10s')), 10_000).unref();
});

const page = (name) => `${ORIGIN}/${name}`;

const PAGE_ADF = page('adf.html');
const nav = (name) => ({ action: 'navigate', type: 'navigate', url: page(name) });
// Same fixture, requested under a realistic Oracle PATHNAME. The fixture server
// resolves by basename, so the directories are ignored by it and are exactly
// what the engine reads when it decides landing page vs deeplink.
const navPath = (path) => ({ action: 'navigate', type: 'navigate', url: `${ORIGIN}/${path}` });
const assertMarker = (value) =>
  ({ action: 'assertText', type: 'assertText', locator: { id: 'marker' }, value, description: `Assert on ${value}` });
const fill = (id, label, value, extra = {}) =>
  ({ action: 'fill', type: 'fill', locator: { id, label }, value, description: `Fill ${label}`, ...extra });
// Verify a field using the ENGINE'S OWN assertion rather than a bespoke check in
// this file. If assertValue is broken, these cases must fail — a harness that
// checks the field by some other route would hide exactly that.
const assertValue = (id, label, value) =>
  ({ action: 'assertValue', type: 'assertValue', locator: { id, label }, value, description: `Assert ${label}` });

/**
 * expect:
 *   success  — the run's overall verdict
 *   statuses — per step, in order: s(uccess) f(ailed) k(skipped) w(arn)
 *   errorLike — regex the failing step's message must match (proves WHY it failed,
 *               not merely that it did; several fixes here are about the message)
 *   minStepMs — { stepIndex: ms } the step must have taken at least this long.
 *               The only way to prove a `wait` actually WAITED: every other
 *               observable is identical whether it slept 1s or the 2.5s the
 *               recording asked for, and "it passed" is exactly what a wait that
 *               silently fell back to the default also does.
 */
const CASES = [
  {
    name: 'baseline/happy-path',
    steps: [nav('adf.html'), fill('bu', 'Business Unit', 'McGrath RentCorp')],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'painted/picks-real-control-among-decoys',
    // adf.html carries three hidden "Business Unit" decoys (off-canvas, clipped,
    // opacity:0) before the real one, and the real controls sit below the fold.
    steps: [nav('adf.html'), fill('bu', 'Business Unit', 'McGrath RentCorp'),
            { action: 'click', type: 'click', locator: { role: 'button', name: 'Save' }, description: 'Click Save' }],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/numeric-superset-must-not-skip-fill',
    // "1000.00".includes("100") once caused the fill to be SKIPPED, creating an
    // invoice for ten times the amount and reporting green.
    steps: [nav('audit.html'), fill('amt', 'Amount', '100'), assertValue('amt', 'Amount', '100')],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/assertValue-must-be-strict',
    steps: [nav('audit.html'),
            { action: 'assertValue', type: 'assertValue', locator: { id: 'amt', label: 'Amount' },
              value: '100', description: 'Assert Amount' }],
    expect: { success: false, statuses: 'sf', errorLike: /expected value "100", field holds "1000\.00"/ },
  },
  {
    name: 'REGRESSION/absent-committedValue-must-not-skip-fill',
    // valueMatchesStrict(field, undefined) returned true for any empty field,
    // so a step with no committedValue skipped the fill and left it blank.
    steps: [nav('audit.html'), fill('cmt', 'Comments', 'typed text'), assertValue('cmt', 'Comments', 'typed text')],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/jet-two-digit-year-readback-is-the-same-date',
    // Redwood repaints a committed date with a two-digit year ("9/18/2026" ->
    // "9/18/26"). dateParts required four digits, so the read-back parsed to
    // nothing and a correct fill was failed outright. Found by replaying a real
    // script, not by a check — every unit case here passed while it was broken.
    steps: [nav('jet-date.html'), fill('hire', 'Hire Date', '9/18/2026')],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'REGRESSION/stale-committedValue-must-not-skip-a-reparameterized-fill',
    // The field still holds "1/1/21" from the previous execution, and the step's
    // committedValue still says "1/1/21" — but `value` has been re-bound to a new
    // date. Trusting committedValue matched the field, SKIPPED the fill, and
    // reported success having written the old value.
    steps: [
      nav('jet-date.html'),
      fill('rehire', 'Rehire Date', '4/2/2027', { originalValue: '1/1/2021', committedValue: '1/1/21' }),
      assertValue('rehire', 'Rehire Date', '4/2/27'),
    ],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/recorded-clear-must-succeed',
    steps: [nav('audit.html'), fill('cmt', 'Comments', ''), assertValue('cmt', 'Comments', '')],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/painted-check-survives-a-page-that-forbids-eval',
    // The painted-element predicate used to be handed to the page as a STRING
    // and run through eval() there. Playwright's evaluate goes over CDP and
    // ignores CSP; that nested eval does not. On any page with a `script-src`
    // lacking 'unsafe-eval' — i.e. a hardened ERP — the predicate threw for
    // every candidate, firstPaintedIndex() returned -1, and EVERY step failed
    // to resolve with a message blaming the locators.
    //
    // Deliberately located by LABEL only, so four nodes match and the painted
    // pick is what decides which one gets typed into. The assertion is on #bu,
    // so filling a decoy fails here rather than passing quietly.
    steps: [nav('csp.html'),
            { action: 'fill', type: 'fill', locator: { label: 'Business Unit' }, value: 'McGrath RentCorp',
              description: 'Fill Business Unit' },
            assertValue('bu', 'Business Unit', 'McGrath RentCorp')],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/a-one-character-secret-must-not-garble-every-message',
    // A PIN field holding "1" put "1" on the blind split/join redaction list, so
    // every "1" anywhere in every log line, error message and PDF entry became
    // «redacted:1» — step numbers, timings and amounts included. The error below
    // has to arrive intact: it is what tells the operator the field held ten
    // times the expected amount.
    steps: [nav('audit.html'),
            fill('pin', 'PIN', '1'),
            { action: 'assertValue', type: 'assertValue', locator: { id: 'amt', label: 'Amount' },
              value: '100', description: 'Assert Amount' }],
    expect: { success: false, statuses: 'ssf', errorLike: /expected value "100", field holds "1000\.00"/ },
  },
  {
    name: 'value/currency-reformat-accepted',
    steps: [nav('fields.html'), fill('bu', 'Business Unit', 'McGrath RentCorp')],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'value/date-reformat-accepted',
    // field already holds 1-Jan-2026; recording says 01/01/2026
    steps: [nav('fields.html'), fill('dt', 'Transaction Date', '01/01/2026')],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'value/select-reads-label-not-value',
    steps: [nav('fields.html'),
            { action: 'assertValue', type: 'assertValue', locator: { id: 'rel', label: 'Relationship' },
              value: 'Debit memo', description: 'Assert Relationship' }],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'guard/blank-field-stops-before-next-step-commits',
    // typing into a readonly field must fail HERE, not let the next step press
    // Enter on a blank required field
    steps: [nav('fields.html'), fill('ro', 'Transaction Type', 'Invoice'),
            { action: 'press', type: 'press', key: 'Enter', description: 'Commit' }],
    expect: { success: false, statuses: 'sfk' },
  },
  {
    name: 'guard/unresolved-parameter-refused',
    steps: [nav('adf.html'), fill('bu', 'Business Unit', '${billToName}')],
    expect: { success: false, statuses: 'sf', errorLike: /never resolved/ },
  },
  {
    name: 'guard/unsupported-action-fails-loudly',
    steps: [nav('adf.html'), { action: 'frobnicate', type: 'frobnicate', description: 'Bogus' }],
    expect: { success: false, statuses: 'sf', errorLike: /Unsupported action/ },
  },
  {
    name: 'guard/corrupt-recording-refused',
    raw: JSON.stringify('[{"action":"click"}]').split(''),
    expect: { throws: /Recording is corrupt/ },
  },
  {
    name: 'oracle/commit-refusal-detected',
    steps: [nav('reject.html'), fill('src', 'Transaction Source', 'Manual'),
            { action: 'click', type: 'click', locator: { role: 'button', name: 'Save' }, description: 'Click Save' }],
    patch: 'oracle-fusion',
    expect: { success: false, statuses: 'ssf', errorLike: /Save rejected/ },
  },
  {
    name: 'REGRESSION/lov-retention-is-not-selection',
    // The field keeps the typed term because nothing matched. That used to be
    // read as proof of selection and reported green.
    steps: [nav('lov.html'),
            { action: 'lovSelect', type: 'lovSelect', locator: { id: 'src', label: 'Transaction Source' },
              value: 'MANUAL OTHER Manual Order', description: 'Pick Transaction Source' }],
    patch: 'oracle-fusion',
    expect: { success: false, statuses: 'sf', errorLike: /could not select/ },
  },
  {
    name: 'oracle/lov-real-pick-succeeds',
    steps: [nav('lov.html'),
            { action: 'lovSelect', type: 'lovSelect', locator: { id: 'good', label: 'Currency' },
              value: 'USD', description: 'Pick Currency' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'checkbox/text-recorded-purpose-ticks-its-own-box',
    // The recorder captures an Address Purpose as a bare text click:
    //   {"locator":{"text":"Ordering","selector":"internal:text=\"Ordering\"i"}}
    // which resolves the sibling <label>, not the <input>. Oracle's label
    // carries `for`, so the browser forwards the click — this pins that the
    // whole chain still lands on the right control and leaves its neighbours
    // alone. "Ordering" is also a substring of nothing else here on purpose:
    // if a future ladder change starts matching the wrapper, the assert on
    // _0 fails rather than silently ticking whatever painted first.
    steps: [nav('checkbox.html'),
            { action: 'click', type: 'click', locator: { text: 'Ordering' },
              description: 'Select Ordering Purpose' },
            { action: 'assertChecked', type: 'assertChecked',
              locator: { id: 'pt1:_FOr1:1:_FONSr2:0:MAt2:1:AP1:smc2:_0' }, checked: true,
              description: 'Assert Ordering ticked' },
            { action: 'assertChecked', type: 'assertChecked',
              locator: { id: 'pt1:_FOr1:1:_FONSr2:0:MAt2:1:AP1:smc2:_2' }, checked: false,
              description: 'Assert RFQ untouched' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'ssss' },
  },
  {
    name: 'REGRESSION/replaying-a-ticked-checkbox-must-not-clear-it',
    // A click is a TOGGLE, so a duplicated step — or a re-run against a box
    // Oracle defaults on — used to UNTICK it and still report green. That is
    // the silent-wrong-outcome this suite exists to catch: the run says the
    // purpose was selected while it was actually turned off.
    //
    // "Email Invoices" ships checked in the fixture, exactly as Oracle ships
    // it, so this case needs no setup step to arrange the hazard.
    steps: [nav('checkbox.html'),
            { action: 'click', type: 'click', locator: { text: 'Email Invoices' },
              description: 'Select Email Invoices' },
            { action: 'assertChecked', type: 'assertChecked',
              locator: { id: 'comm:_0' }, checked: true,
              description: 'Assert still ticked' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'recording/duplicate-click-is-named-up-front',
    // A real recording clicked "Create" twice on the supplier address form —
    // one operator click captured twice. The replay drifted a state and the
    // first step that could not cope was twenty steps later, at an unrelated
    // checkbox, so the investigation started in the wrong place entirely.
    //
    // The warning is diagnostic ONLY: both clicks still run, and the run still
    // succeeds here. That is the point — dropping a step would break genuine
    // double-clicks, while naming the suspect costs nothing.
    steps: [nav('checkbox.html'),
            { action: 'click', type: 'click', locator: { text: 'Ordering' },
              description: 'Select Ordering Purpose' },
            { action: 'click', type: 'click', locator: { text: 'Ordering' },
              description: 'Select Ordering Purpose' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'sss', logLike: /steps 2 and 3 are the same click/ },
  },
  {
    name: 'REGRESSION/selectOption-recorded-as-a-value-attribute',
    // Oracle's Regional Information select stores "1" for the option whose text
    // is "Depreciation Method for Poland". The recorder captured the VALUE
    // attribute, not the label. Selecting by value is correct and must be
    // accepted — the sibling engine failed the step by comparing that "1"
    // against the label it produced ("asked for 1 but the field reads
    // Depreciation Method for Poland") and took 8 later steps down with it.
    steps: [nav('oracle-test.html'),
            { action: 'selectOption', type: 'selectOption',
              locator: { id: 'B:df3_FLEX_Context::content', label: 'Regional Information' },
              value: '1', description: 'Select Regional Information' },
            { action: 'assertValue', type: 'assertValue',
              locator: { id: 'B:df3_FLEX_Context::content' },
              value: 'Depreciation Method for Poland', description: 'Assert Regional Information' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'redwood/stable-id-tail-survives-a-new-session',
    // Redwood ids are only partly volatile. The same Business Unit row recorded
    // twice ~90 minutes apart gave _oj1147_table:1250645336_0 and
    // _oj687_table:1250645336_0 — the _ojNNN counter changed, the tail did not.
    //
    // So a recording that stored the whole id is dead on the next run, while one
    // anchored on the tail still resolves. The fixture carries a decoy whose id
    // hashes to the same digits under a different widget kind, so this also pins
    // that keeping "table:" in the suffix is what keeps the match unique.
    steps: [nav('redwood-ids.html'),
            { action: 'click', type: 'click',
              locator: { selector: '[id$="table:1250645336_0"]' },
              description: 'Select Business Unit' },
            { action: 'assertText', type: 'assertText',
              locator: { selector: '[id$="table:1250645336_0"]' },
              value: 'McGrath RentCorp',
              description: 'Assert the right row was addressed' }],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/a-recorded-whole-redwood-id-is-already-dead',
    // The other half of the same fact: the id recording 1629 stored does not
    // exist in a later session. This is what the tail rewrite exists to avoid,
    // and it must keep failing — if it ever passes, the premise is wrong.
    steps: [nav('redwood-ids.html'),
            { action: 'click', type: 'click',
              locator: { selector: '[id="_oj1147_table:1250645336_0"]' },
              description: 'Select Business Unit (stale id)' }],
    expect: { success: false, statuses: 'sf' },
  },
  {
    name: 'redwood/row-resolves-by-gridcell-name-not-generated-id',
    // Recording 1629 (script 2326) recorded three Redwood picks as generated
    // ids — css=#ui-id-194, #_oj1147_table:1250645336_0 — and each was saved
    // with originalValue:null, so the parameter map showed those fields empty.
    //
    // Probing the live page showed the row always offers a stable address too:
    //   <li id="ui-id-64" role="row">        <- generated, what was recorded
    //     <div role="gridcell">"Direct"      <- stable
    // This pins that the stable one resolves and acts on the right row, so a
    // recorder change to emit it is provably enough.
    steps: [nav('redwood-picker.html'),
            { action: 'click', type: 'click',
              locator: { role: 'gridcell', name: 'Inside sales' },
              description: 'Select Sales Channel' }],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'oracle/lov-dropdown-row-is-picked-by-its-code',
    // The real dropdown is a two-column grid: code, then display text. Picking
    // "Disposable." must land on ORA_J — and must not be satisfied by the
    // SELECTED row that ADF repeats at the top of the list (ORA_K appears at
    // both _afrrk=0 and _afrrk=4, so "first text match" is not "the right row").
    steps: [nav('oracle-test.html'),
            { action: 'click', type: 'click',
              locator: { id: 'B:DeprFreq::lovIconId', title: 'Search: Depreciation Frequency for Poland' },
              description: 'Open Depreciation Frequency' },
            { action: 'click', type: 'click', locator: { text: 'Disposable.' },
              description: 'Select Depreciation Frequency' },
            { action: 'assertValue', type: 'assertValue',
              locator: { id: 'B:DeprFreq::content' },
              value: 'ORA_J', description: 'Assert the code that was stored' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'ssss' },
  },
  {
    name: 'guard/fill-on-a-disabled-field-must-not-report-green',
    // "Life in Periods" is disabled — Oracle derives it. A recording that tries
    // to fill it must fail rather than pass having typed nothing.
    steps: [nav('oracle-test.html'),
            fill('B:it1::content', 'Life in Periods', '12')],
    patch: 'oracle-fusion',
    expect: { success: false, statuses: 'sf' },
  },
  {
    name: 'patch/generic-lov-uses-the-plain-listbox-contract',
    // The widget mechanics (which probes, which row roles, what commits a typed
    // value) moved out of the engine onto AppPatch. GenericPatch has to carry a
    // working default, or "add one patch file for a new ERP" is not true —
    // a new vendor would start from a base class that cannot select anything.
    // Same page, no Oracle patch: role="option" and a click is all it may use.
    steps: [nav('lov.html'),
            { action: 'lovSelect', type: 'lovSelect', locator: { id: 'good', label: 'Currency' },
              value: 'USD', description: 'Pick Currency' }],
    patch: 'generic',
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'REGRESSION/generic-lov-retention-is-not-selection',
    // The evidence rules stayed in the ENGINE precisely so they hold for every
    // patch. If they had moved onto the patch alongside the mechanics, the
    // generic path would report this green — nothing matched, and the field
    // holds only what we typed.
    steps: [nav('lov.html'),
            { action: 'lovSelect', type: 'lovSelect', locator: { id: 'src', label: 'Transaction Source' },
              value: 'MANUAL OTHER Manual Order', description: 'Pick Transaction Source' }],
    patch: 'generic',
    expect: { success: false, statuses: 'sf', errorLike: /could not select/ },
  },
  {
    name: 'REGRESSION/commit-refusal-outside-the-phrase-list',
    // "Duplicate invoice number" matched none of the seven original phrasings,
    // so the Save was reported accepted.
    steps: [nav('reject2.html'), fill('src', 'Transaction Source', 'Manual'),
            { action: 'click', type: 'click', locator: { role: 'button', name: 'Save' }, description: 'Click Save' }],
    patch: 'oracle-fusion',
    expect: { success: false, statuses: 'ssf', errorLike: /Save rejected/ },
  },
  {
    name: 'oracle/confirmation-is-not-a-refusal',
    // the inversion must not turn every success dialog into a false red
    steps: [nav('accept.html'), fill('src', 'Transaction Source', 'Manual'),
            { action: 'click', type: 'click', locator: { role: 'button', name: 'Save' }, description: 'Click Save' }],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'guard/iframe-recording-refused',
    // The recorder writes framePath; the engine routes every locator to the top
    // page. Replaying such a step acts on the wrong document and blames the
    // locator, so it is refused with the real reason instead.
    raw: [
      { frame: { pageAlias: 'page', framePath: [] }, action: { name: 'openPage', url: 'about:blank' } },
      { frame: { pageAlias: 'page', framePath: ['#contentFrame'] }, action: { name: 'click', selector: '#x' } },
    ],
    expect: { throws: /recorded inside an iframe/ },
  },
  {
    name: 'guard/second-page-recording-refused',
    raw: [
      { frame: { pageAlias: 'page', framePath: [] }, action: { name: 'openPage', url: 'about:blank' } },
      { frame: { pageAlias: 'page1', framePath: [] }, action: { name: 'click', selector: '#x' } },
    ],
    expect: { throws: /recorded on a second page/ },
  },
  {
    name: 'compat/ordinary-codegen-recording-still-accepted',
    // frame present but empty — the shape EVERY normal recording has. The guard
    // above must not reject these.
    raw: [
      { frame: { pageAlias: 'page', framePath: [] }, action: { name: 'openPage', url: PAGE_ADF } },
      { frame: { pageAlias: 'page', framePath: [] },
        action: { name: 'fill', selector: 'internal:role=textbox[name="Business Unit"i]', text: 'McGrath RentCorp' } },
    ],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'oracle/output-captured-from-plain-dialog',
    // the ADF Information dialog carries no role and no AF class - the shape
    // that silently captured nothing on a real live run
    steps: [nav('confirm.html')],
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 's', outputs: { 'Transaction Number': 'CT21987' } },
  },

  // ── schema v1: the envelope ──────────────────────────────────────────────
  {
    name: 'v1/envelope-is-unwrapped',
    // The engine used to require a top-level array, so a v1 recording failed
    // before step 1 with "Recording is not an array of steps".
    raw: {
      schemaVersion: 1,
      name: 'Create Transaction',
      description: 'a v1 recording',
      recordedAt: '2026-01-01T00:00:00.000Z',
      sourceUrl: PAGE_ADF,
      patchId: 'generic',
      actions: [nav('adf.html'), fill('bu', 'Business Unit', 'McGrath RentCorp')],
    },
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'v1/bare-array-still-means-legacy',
    // The version is READ, not inferred. An array declares nothing, so it is
    // legacy — and must stay replayable, which is 779 recordings' worth of why.
    steps: [nav('adf.html'), fill('bu', 'Business Unit', 'McGrath RentCorp')],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'guard/object-recording-without-actions-refused',
    raw: { schemaVersion: 1, name: 'typo', steps: [] },
    expect: { throws: /has no "actions" array/ },
  },
  {
    name: 'guard/future-schema-version-refused',
    // Replaying an unknown numeric v3 raw recording file would apply
    // the wrong meaning to verbs this engine has never heard of.
    raw: { schemaVersion: 3, actions: [nav('adf.html')] },
    expect: { throws: /understands up to 2/ },
  },
  {
    name: 'v2/protocol-2.0-schemaVersion-accepted',
    raw: { schemaVersion: 2, actions: [nav('adf.html')] },
    expect: { success: true, statuses: 's' },
  },

  // ── schema v1: wait durations ────────────────────────────────────────────
  {
    name: 'v1/wait-honours-durationMs',
    raw: { schemaVersion: 1, actions: [nav('adf.html'), { action: 'wait', durationMs: 2500, description: 'Settle' }] },
    expect: { success: true, statuses: 'ss', minStepMs: { 1: 2400 } },
  },
  {
    name: 'v1/durationMs-beats-the-retired-text-overload',
    // `text` is the field a fill's VALUE lives in; v1 states the duration in a
    // field of its own and it must win outright.
    raw: {
      schemaVersion: 1,
      actions: [nav('adf.html'), { action: 'wait', durationMs: 2500, text: '50', description: 'Settle' }],
    },
    expect: { success: true, statuses: 'ss', minStepMs: { 1: 2400 } },
  },
  {
    name: 'compat/legacy-wait-still-reads-text',
    steps: [nav('adf.html'), { action: 'wait', type: 'wait', text: '2500', description: 'Settle' }],
    expect: { success: true, statuses: 'ss', minStepMs: { 1: 2400 } },
  },
  {
    name: 'guard/non-numeric-durationMs-fails-loudly',
    // The legacy `text` overload degrades a non-number to 1s in silence. A typed
    // field that exists only to hold a duration must not inherit that.
    raw: { schemaVersion: 1, actions: [nav('adf.html'), { action: 'wait', durationMs: 'soon' }] },
    expect: { success: false, statuses: 'sf', errorLike: /durationMs that is not a duration/ },
  },
  {
    name: 'compat/non-numeric-legacy-wait-text-still-degrades',
    // Deliberately NOT made loud: these recordings have run for years, and
    // failing them now would be a regression dressed up as a fix.
    steps: [nav('adf.html'), { action: 'wait', type: 'wait', text: 'a moment' }],
    expect: { success: true, statuses: 'ss' },
  },

  // ── schema v1: the select / lovSelect split ──────────────────────────────
  {
    name: 'compat/legacy-select-is-still-a-row-pick',
    // THE subtle one. In a legacy locator-shape recording `select` means "click
    // this row in the open list", and ~366 stored recordings mean it that way.
    // Routing it to <select> handling instead would touch nothing and leave
    // Picked empty while reporting green.
    steps: [nav('rows.html'),
            { action: 'select', type: 'select',
              locator: { id: 'optManual', role: 'option', name: 'MANUAL OTHER' },
              description: 'Pick Transaction Source' },
            assertValue('picked', 'Picked', 'MANUAL OTHER')],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'compat/legacy-codegen-select-is-still-a-real-select',
    // The OTHER legacy meaning of the same word: in codegen shape it is a real
    // <select>, and normalize has always rewritten it to selectOption. That
    // inconsistency is why v1 retires the verb — but it stays true for legacy.
    raw: [
      { frame: { pageAlias: 'page', framePath: [] }, action: { name: 'openPage', url: page('rows.html') } },
      { frame: { pageAlias: 'page', framePath: [] },
        action: { name: 'select', selector: '#rel', text: 'Alpha' } },
      assertValue('rel', 'Relationship', 'Alpha'),
    ],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'v1/bare-select-verb-is-refused',
    // v1 has selectOption for a <select> and lovSelect for a row pick, so there
    // is nothing left for `select` to mean. Guessing between two behaviours that
    // act on different widgets is the ambiguity v1 exists to remove.
    raw: {
      schemaVersion: 1,
      actions: [nav('rows.html'),
                { action: 'select', locator: { id: 'optManual', role: 'option', name: 'MANUAL OTHER' } }],
    },
    expect: { success: false, statuses: 'sf', errorLike: /not a schema v1 action/ },
  },
  {
    name: 'v1/selectOption-is-a-real-select',
    raw: {
      schemaVersion: 1,
      actions: [nav('rows.html'),
                { action: 'selectOption', locator: { id: 'rel', label: 'Relationship' }, value: 'Alpha' },
                assertValue('rel', 'Relationship', 'Alpha')],
    },
    expect: { success: true, statuses: 'sss' },
  },
  {
    // A credentialRef is DECRYPTED and typed — the recorded mask never is.
    //
    // The blob below was produced by the platform's own Java EncryptionService
    // (AES-256-GCM, 12-byte IV prepended, 128-bit tag, base64), so this pins
    // the cross-runtime format as well as the wiring. login.html only reports
    // "Signed in" for the real password, so typing '********' fails the assert.
    name: 'v1/credentialRef-is-decrypted-not-typed-as-the-mask',
    env: {
      CREDENTIAL_KEY: 'TCS0R+p+gZa375VU5Fpuqm0N23tZUZ6hDpbjsfaQVWA=',
      CREDENTIAL_PASSWORD: 'FSUsk9gmp5UBUYsTw2Fp9e6dZaP8a4GjZF4qlW6nPTar7mdn1hcylHqDwxAiFQusimoM',
    },
    raw: {
      schemaVersion: 1,
      actions: [nav('login.html'),
                { action: 'fill', locator: { id: 'u', label: 'User Name' },
                  value: 'test.user@example.com' },
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' },
                { action: 'click', locator: { id: 'go', label: 'Next' } },
                { action: 'assertText', type: 'assertText', locator: { id: 'out', label: 'Result' },
                  value: 'Signed in', description: 'Assert signed in' }],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    // A step that names a credential nobody supplied FAILS, and fails at the
    // step that needs it.
    //
    // Typing the mask instead would "pass" here and strand the run on the login
    // page — every later step then failing against the wrong page, with the
    // report blaming the locators. That is precisely how execution 8336 spent
    // 17 steps failing for a reason nobody could see.
    name: 'guard/missing-credential-fails-at-the-step-that-needs-it',
    raw: {
      schemaVersion: 1,
      actions: [nav('login.html'),
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' }],
    },
    expect: { success: false, statuses: 'sf' },
  },
  {
    // Ambiguity is broken by the RECORDED PATH, not by document order.
    //
    // ambiguous.html has two painted inputs sharing the label "Depreciation
    // Method for Poland" — the real Oracle case. The step carries the
    // componentId of the SECOND one, so taking the first (which is what
    // first-painted order does) fills the wrong field. The assert names the
    // second field's id, so only a path-driven pick passes.
    name: 'v1/ambiguous-label-is-resolved-by-recorded-component-path',
    raw: {
      schemaVersion: 1,
      actions: [nav('ambiguous.html'),
                { action: 'fill', value: 'Straight Line',
                  locator: { label: 'Depreciation Method for Poland',
                             componentId: 'pt1:_FOr1:1:r9:0:it1' } },
                assertValue('pt1:_FOr1:1:r9:0:it1::content', 'Asset Details field', 'Straight Line')],
    },
    expect: { success: true, statuses: 'sss' },
  },
  {
    // The first field must be left ALONE. Without this, a bug that filled both
    // (or filled the first as well) would still satisfy the check above.
    name: 'guard/path-pick-does-not-touch-the-other-match',
    raw: {
      schemaVersion: 1,
      actions: [nav('ambiguous.html'),
                { action: 'fill', value: 'Straight Line',
                  locator: { label: 'Depreciation Method for Poland',
                             componentId: 'pt1:_FOr1:1:r9:0:it1' } },
                assertValue('pt1:_FOr1:0:r1:0:it1::content', 'Regional field', '')],
    },
    expect: { success: true, statuses: 'sss' },
  },
  {
    // A stale optionIndex must not silently pick the wrong option.
    //
    // `rows.html` has <option value="1">Alpha</option> and
    // <option value="2" selected>Debit memo</option>. Parameterization rewrote
    // this step's value to "Credit memo" — a label that does not exist — while
    // preserving optionIndex from the ORIGINAL recording of "Alpha". Taking the
    // index would select whatever sits at that position now, succeed, and
    // report green on an option nobody asked for.
    //
    // Refusing is the safe direction: the step fails naming "Credit memo",
    // which is what was actually requested.
    name: 'guard/stale-optionIndex-is-refused-not-guessed',
    raw: {
      schemaVersion: 1,
      actions: [nav('rows.html'),
                { action: 'selectOption', locator: { id: 'rel', label: 'Relationship' },
                  value: 'Credit memo', optionIndex: 2, originalValue: 'Alpha' }],
    },
    expect: { success: false, statuses: 'sf' },
  },
  {
    // The same fallback must still WORK when the value was not edited — an
    // option that was merely RENAMED is exactly what the index is for. Here
    // originalValue matches the requested value, so the guard stays out of the
    // way and index 1 selects Alpha.
    name: 'v1/optionIndex-still-rescues-an-unedited-step',
    raw: {
      schemaVersion: 1,
      actions: [nav('rows.html'),
                { action: 'selectOption', locator: { id: 'rel', label: 'Relationship' },
                  value: 'Renamed Alpha', optionIndex: 0, originalValue: 'Renamed Alpha' },
                assertValue('rel', 'Relationship', 'Alpha')],
    },
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'v1/lovSelect-is-the-row-pick',
    raw: {
      schemaVersion: 1,
      actions: [nav('lov.html'),
                { action: 'lovSelect', locator: { id: 'good', label: 'Currency' }, value: 'USD',
                  description: 'Pick Currency' }],
    },
    patch: 'oracle-fusion',
    expect: { success: true, statuses: 'ss' },
  },

  // ── schema v1: frames ────────────────────────────────────────────────────
  {
    name: 'v1/frame-by-name-resolves-inside-the-iframe',
    // The top document carries its OWN "Business Unit" holding TOP FRAME DECOY.
    // The last step asserts it is untouched, so a silent fallback to the top
    // frame — which would find that field, fill it and report success — fails
    // here instead of quietly editing the wrong record in Oracle.
    raw: {
      schemaVersion: 1,
      actions: [
        nav('frame.html'),
        { action: 'fill', locator: { id: 'bu', label: 'Business Unit' }, value: 'McGrath RentCorp',
          frame: { name: 'adfDialog', url: page('frame-inner.html') }, description: 'Fill Business Unit' },
        { action: 'assertValue', locator: { id: 'bu', label: 'Business Unit' }, value: 'McGrath RentCorp',
          frame: { name: 'adfDialog', url: page('frame-inner.html') }, description: 'Assert in-frame' },
        assertValue('bu', 'Business Unit', 'TOP FRAME DECOY'),
        // …and the OTHER iframe is untouched, so "any frame will do" fails too.
        { action: 'assertValue', locator: { id: 'bu', label: 'Business Unit' }, value: 'SIDE REGION DECOY',
          frame: { name: 'sideRegion' }, description: 'Assert side region untouched' },
      ],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    name: 'v1/frame-by-url-picks-the-right-one-of-two',
    // No name, and the recorded URL is from ANOTHER environment (port 1) — which
    // every replay is. Matching on the path is what makes a recording portable.
    // It also addresses the SECOND iframe, so "take the first one" fails.
    raw: {
      schemaVersion: 1,
      actions: [
        nav('frame.html'),
        { action: 'fill', locator: { id: 'bu', label: 'Business Unit' }, value: 'McGrath RentCorp',
          frame: { url: 'http://127.0.0.1:1/frame-other.html' }, description: 'Fill in side region' },
        { action: 'assertValue', locator: { id: 'bu', label: 'Business Unit' }, value: 'McGrath RentCorp',
          frame: { url: 'http://127.0.0.1:1/frame-other.html' }, description: 'Assert in side region' },
        assertValue('bu', 'Business Unit', 'TOP FRAME DECOY'),
        // The FIRST iframe must still be empty. Without this the case would pass
        // for an engine that just took iframe #1 — both steps above would then
        // agree with each other about the wrong document.
        { action: 'assertValue', locator: { id: 'bu', label: 'Business Unit' }, value: '',
          frame: { name: 'adfDialog' }, description: 'Assert first frame untouched' },
      ],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    name: 'guard/missing-frame-fails-loudly-instead-of-using-the-top-frame',
    // The failure mode that matters, and the reason FAILING is the assertion.
    // The top frame HAS a "Business Unit" field, so an engine that fell back to
    // it would fill that field, pass, and report green having edited the wrong
    // document — this case would then read `success: true`. Red, naming the
    // frame, is the only honest outcome.
    raw: {
      schemaVersion: 1,
      actions: [
        nav('frame.html'),
        { action: 'fill', locator: { id: 'bu', label: 'Business Unit' }, value: 'McGrath RentCorp',
          frame: { name: 'noSuchDialog' }, description: 'Fill Business Unit' },
      ],
    },
    expect: { success: false, statuses: 'sf', errorLike: /Frame not found.*noSuchDialog/ },
  },
  {
    name: 'compat/top-frame-block-is-not-treated-as-an-iframe',
    // A frame block naming the page's own URL is the top document. Routing it
    // through frameLocator would fail a step that is perfectly fine.
    raw: {
      schemaVersion: 1,
      actions: [
        nav('adf.html'),
        { action: 'fill', locator: { id: 'bu', label: 'Business Unit' }, value: 'McGrath RentCorp',
          frame: { url: PAGE_ADF }, description: 'Fill Business Unit' },
      ],
    },
    expect: { success: true, statuses: 'ss' },
  },
  {
    // A RAW (plaintext) credential works, with no key and no vault.
    //
    // Not every caller has the vault — an on-premise install, a developer
    // replaying by hand, the recorder's own capture. Refusing plaintext would
    // not remove it, it would push it back into the recording.
    name: 'v1/raw-credential-is-used-as-is',
    env: { CREDENTIAL_RAW_PASSWORD: 'S3cr3t-P@ssw0rd-unicode' },
    raw: {
      schemaVersion: 1,
      actions: [nav('login.html'),
                { action: 'fill', locator: { id: 'u', label: 'User Name' },
                  value: 'test.user@example.com' },
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' },
                { action: 'click', locator: { id: 'go', label: 'Next' } },
                { action: 'assertText', type: 'assertText', locator: { id: 'out', label: 'Result' },
                  value: 'Signed in', description: 'Assert signed in' }],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    // A step that opens a NEW TAB is followed, not ignored.
    //
    // The supplier-registration replay stalled here on Testing Vision: Oracle's
    // "Register Supplier" is an <a target="_blank"> into the Redwood
    // registration app. The click succeeded, the form loaded in a second tab,
    // and the run kept driving the dashboard — where Company does not exist.
    // Every later step failed and the report blamed the locators for a page the
    // run had simply never moved to.
    //
    // The pre-existing recovery only fired when the old page CLOSED. Verified
    // live: after that click the original reports isClosed() === false, so it
    // never fired at all.
    //
    // Company exists only on the second tab, so a run that does not follow
    // cannot pass this by accident.
    name: 'guard/a-step-that-opens-a-new-tab-is-followed',
    raw: {
      schemaVersion: 1,
      actions: [nav('opens-tab.html'),
                { action: 'click', locator: { id: 'register', label: 'Register Supplier' },
                  description: 'Open Register Supplier' },
                { action: 'fill', locator: { id: 'company', label: 'Company' },
                  value: 'Acme Ltd', description: 'Enter Company' },
                { action: 'assertText', type: 'assertText', locator: { id: 'out', label: 'Result' },
                  value: 'Company: Acme Ltd', description: 'Assert the value landed' }],
    },
    expect: { success: true, statuses: 'ssss' },
  },
  {
    // A tab that opens and then CLOSES itself must not strand the run.
    //
    // Oracle opens a transient tab for a print preview or a download shim. If
    // the run followed it and stayed, every later step would act on a dead
    // handle. Picking the newest LIVE tab handles both directions with one
    // rule: follow a tab that opens, fall back when it goes away.
    //
    // The field the last step needs exists only on the ORIGINAL page, so a run
    // stranded on the transient tab cannot pass this by accident.
    name: 'guard/a-tab-that-closes-itself-does-not-strand-the-run',
    raw: {
      schemaVersion: 1,
      actions: [nav('tab-closes.html'),
                { action: 'click', locator: { id: 'open', label: 'Open transient tab' },
                  description: 'Open a tab that closes itself' },
                { action: 'wait', ms: 3000, description: 'Let it close' },
                { action: 'fill', locator: { id: 'after', label: 'After' },
                  value: 'back home', description: 'Type on the original page' },
                { action: 'assertText', type: 'assertText', locator: { id: 'out', label: 'Result' },
                  value: 'After: back home', description: 'Assert we are on the original page' }],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    // A LOGIN THAT NEVER AUTHENTICATED FAILS AT THE LOGIN, not 17 steps later.
    //
    // Execution 8336 reported six green steps on a run that never signed in:
    // the credential had expired, every sign-in step dispatched cleanly, and
    // the run then spent 17 more steps failing against a login page while the
    // report blamed the locators. Same silent-green class as the checkbox that
    // dispatched without ticking — an action that succeeds while achieving
    // nothing.
    //
    // The wrong password leaves signin.html on screen. Step 4 (the submit) must
    // therefore FAIL, and step 5 must never run: on the old behaviour both were
    // green and the failure surfaced somewhere downstream.
    //
    // oracle-fusion is forced because sessionExpired() is a patch method and
    // the generic patch has no opinion — this guard only exists for
    // applications that can say what a sign-in page looks like.
    name: 'guard/a-login-that-did-not-authenticate-fails-at-the-login-step',
    patch: 'oracle-fusion',
    env: { CREDENTIAL_RAW_PASSWORD: 'wrong-password', REPLAY_LOGIN_SETTLE_MS: '3000' },
    raw: {
      schemaVersion: 1,
      actions: [nav('signin.html'),
                { action: 'fill', locator: { id: 'u', label: 'User Name' },
                  value: 'test.user@example.com' },
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' },
                { action: 'click', locator: { id: 'go', label: 'Next' } },
                { action: 'click', locator: { id: 'home', label: 'Home' } }],
    },
    expect: { success: false, statuses: 'sssfk', errorLike: /login did not complete/i },
  },
  {
    // ...and the guard stays out of the way of a login that DID work.
    //
    // The counterpart matters as much as the case above: a guard that fires on
    // a successful sign-in would fail every login flow in the product. The
    // fixture redirects 700ms after the click, so this also pins that the guard
    // WAITS for the redirect instead of sampling once and calling it a failure.
    name: 'guard/a-successful-login-is-not-flagged-as-unauthenticated',
    patch: 'oracle-fusion',
    env: { CREDENTIAL_RAW_PASSWORD: 'S3cr3t-P@ssw0rd-unicode' },
    raw: {
      schemaVersion: 1,
      actions: [nav('signin.html'),
                { action: 'fill', locator: { id: 'u', label: 'User Name' },
                  value: 'test.user@example.com' },
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' },
                { action: 'click', locator: { id: 'go', label: 'Next' } },
                { action: 'assertText', type: 'assertText', locator: { id: 'out', label: 'Result' },
                  value: 'Signed in', description: 'Assert signed in' }],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    // CREDENTIALS_RAW=true switches the ordinary names to plaintext, for a
    // caller that has no vault at all.
    name: 'v1/CREDENTIALS_RAW-treats-ordinary-names-as-plaintext',
    env: { CREDENTIALS_RAW: 'true', CREDENTIAL_PASSWORD: 'S3cr3t-P@ssw0rd-unicode' },
    raw: {
      schemaVersion: 1,
      actions: [nav('login.html'),
                { action: 'fill', locator: { id: 'u', label: 'User Name' },
                  value: 'test.user@example.com' },
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' },
                { action: 'click', locator: { id: 'go', label: 'Next' } },
                { action: 'assertText', type: 'assertText', locator: { id: 'out', label: 'Result' },
                  value: 'Signed in', description: 'Assert signed in' }],
    },
    expect: { success: true, statuses: 'sssss' },
  },
  {
    // An ENCRYPTED value with no key must FAIL, not be typed as if plaintext.
    //
    // This is the case that keeps raw support honest. If decryption silently
    // degraded to "maybe it was already plaintext", a wrong or missing key
    // would send a base64 blob to the login form and the run would fail looking
    // like a bad password — sending the reader after the wrong problem.
    name: 'guard/encrypted-credential-without-a-key-is-not-typed-raw',
    env: {
      CREDENTIAL_PASSWORD: 'FSUsk9gmp5UBUYsTw2Fp9e6dZaP8a4GjZF4qlW6nPTar7mdn1hcylHqDwxAiFQusimoM',
    },
    raw: {
      schemaVersion: 1,
      actions: [nav('login.html'),
                { action: 'fill', locator: { id: 'p', label: 'Password' },
                  value: '********', sensitive: true, credentialRef: 'password' }],
    },
    expect: { success: false, statuses: 'sf', errorLike: /no decryption key is set/ },
  },
  {
    name: 'guard/a-truncated-lov-title-must-not-open-the-wrong-field',
    // RECONSTRUCTED — this case and its fixture were lost from the working tree
    // and rewritten from the original.
    //
    // A recording of Create Depreciation Method captured the icon as
    // title="Search: Depreciation Method" when the real attribute is
    // "Search: Depreciation Method for Poland". Both launchers on that form
    // begin "Search: Depreciation ", so a loose match would open the FREQUENCY
    // field and every later step would act on the wrong control while reporting
    // green.
    //
    // Failing to resolve is the RIGHT answer here: the recording is wrong and
    // should say so, rather than being guessed into acting on a neighbour.
    steps: [nav('lov-title.html'),
            { action: 'click', type: 'click',
              locator: { title: 'Search: Depreciation Method' },
              description: 'Click Search: Depreciation Method' }],
    patch: 'oracle-fusion',
    // "List did not open" rather than "not found": the launcher check is what
    // catches it, and either message is honest — what matters is that the run
    // stops instead of acting on the neighbouring field.
    expect: { success: false, statuses: 'sf', errorLike: /did not open|not found/i },
  },

  // ── navigation: landing pages and origin alignment ────────────────────────
  //
  // Measured over 652 stored scripts: 96.5% open with a navigate; ~85% of those
  // first navigates go to an Oracle LANDING page, ~13% are genuine deeplinks
  // straight into a task, and 67.6% of scripts carry TWO consecutive landing
  // navigates — the login redirect chain, captured as steps.
  //
  // `navPath` requests a fixture under a REALISTIC Oracle pathname. The fixture
  // server resolves by basename, so the leading directories are decoration for
  // the server and the whole point for the engine, which decides landing-vs-
  // deeplink from the pathname.
  {
    name: 'REGRESSION/redundant-landing-navigate-after-login-is-skipped',
    // Oracle redirects to the welcome page ITSELF after a successful sign-in, so
    // replaying the recorded second landing navigate re-enters a page the run is
    // already on, using a URL that carries state from the original recording
    // session. The skip must leave the run on the page it is already on: this
    // asserts the FuseWelcome marker AFTER the AtkHomePageWelcome step, so a
    // navigate that actually happened fails the case instead of passing quietly.
    patch: 'oracle-fusion',
    steps: [
      navPath('fscmUI/faces/FuseWelcome.html'),
      navPath('fscmUI/faces/AtkHomePageWelcome.html'),
      assertMarker('FUSE-LANDING'),
    ],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'guard/the-first-navigate-is-never-skipped',
    // The first navigate is how the run reaches the sign-in page at all. Skipping
    // it — it is a landing page, so the skip rule would otherwise reach it —
    // would strand the run on about:blank and fail every later step "not found".
    patch: 'oracle-fusion',
    steps: [navPath('fscmUI/faces/FuseWelcome.html'), assertMarker('FUSE-LANDING')],
    expect: { success: true, statuses: 'ss' },
  },
  {
    name: 'guard/a-redwood-deeplink-navigate-is-never-skipped',
    // ~80 stored scripts start straight inside a task rather than at a landing
    // page. A skip rule that matched loosely — on "welcome", or on any
    // post-login navigate — would strand every one of them on the previous page.
    // The path is a real one from the corpus.
    patch: 'oracle-fusion',
    steps: [
      nav('adf.html'),
      navPath('fscmUI/redwood/order-management-orders/manage.html'),
      assertMarker('DEEPLINK-MANAGE'),
    ],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/stale-origin-is-retargeted-to-the-login-origin-not-the-current-page',
    // Origin alignment used to anchor on page.url() — whatever page the browser
    // happened to be sitting on. That is a weak anchor: it is about:blank before
    // the first navigate and mid-flow it can be an origin the flow was merely
    // passed through. The authority is the LOGIN step, whose URL the queue worker
    // re-reads from the instance record every run, so it is current even when the
    // instance has been repointed at a new pod and every business step still
    // carries an origin months out of date.
    //
    // The click hops the browser to the localhost origin WITHOUT a navigate step
    // (a navigate would itself be realigned, proving nothing). The third step's
    // recorded origin is a stale foreign host; it must come out as 127.0.0.1 —
    // the first navigate's origin — and not as localhost.
    patch: 'oracle-fusion',
    steps: [
      nav('origin-hop.html'),
      { action: 'click', type: 'click', locator: { id: 'go', text: 'Hop origin' }, description: 'Hop origin' },
      { action: 'navigate', type: 'navigate', url: 'http://stale-pod.example.com/fscmUI/redwood/order-management-orders/manage.html' },
      assertMarker('DEEPLINK-MANAGE'),
    ],
    expect: {
      success: true,
      statuses: 'ssss',
      logLike: /origin aligned \(http:\/\/127\.0\.0\.1:\d+\/fscmUI\/redwood\/order-management-orders\/manage\.html/,
    },
  },

  // ── ambiguity: a recorded name that is a prefix of another one ────────────
  //
  // Found by replaying two real scripts against a live pod, both dying on
  // "Select Tax Country":
  //
  //   strict mode violation: getByRole('option', { name: /United States/i })
  //     resolved to 2 elements
  //
  // A recorded name is replayed as a case-insensitive SUBSTRING match, so a
  // name that is a strict prefix of another names both. Both fixtures put the
  // WRONG (longer) row FIRST, so the pre-fix behaviour — take the first painted
  // match — picks it, and picks it QUIETLY: the recorded name is a substring of
  // what got chosen, so every read-back check downstream agrees with the wrong
  // value. A green run carrying the wrong country is worse than a failed one,
  // which is why both cases assert WHICH row was clicked and not merely that
  // the step passed.
  {
    name: 'REGRESSION/prefix-name-picks-the-exactly-named-option-not-the-first',
    // The generic half, and it runs under the GENERIC patch on a page with no
    // vendor attributes at all: the row text IS the name, so comparing the name
    // exactly is enough and every web app gets this for free. Located by TEXT
    // with no role, so the ladder's existing role+name-exact candidate cannot
    // quietly do the work — the tie-break in resolve() has to.
    steps: [
      nav('prefix-options.html'),
      { action: 'click', type: 'click', locator: { text: 'United States' }, description: 'Select Tax Country' },
      assertMarker('PLAIN-US'),
    ],
    expect: { success: true, statuses: 'sss' },
  },
  {
    name: 'REGRESSION/adf-prefix-option-is-disambiguated-by-the-oracle-exact-key',
    // The Oracle half. ADF paints the country CODE onto the label ("United
    // States US"), so NO row's text equals the recorded name and the generic
    // exact-name retry above decides nothing. The only exact key on the page is
    // data-afr-value — Oracle knowledge, so it reaches the resolver solely
    // through AppPatch.exactMatch, implemented in patches/oracle.ts and null in
    // patches/generic.ts. Recorded with role+name exactly as the failing script
    // carried it.
    patch: 'oracle-fusion',
    steps: [
      nav('adf-prefix-options.html'),
      {
        action: 'click', type: 'click',
        selector: 'internal:role=option[name="United States"i]',
        description: 'Select Tax Country',
      },
      assertMarker('ADF-US'),
    ],
    expect: { success: true, statuses: 'sss' },
  },

  // ── viewport: a control the browser cannot scroll to ──────────────────────
  // ── The cluster rail: paging clicks that cannot be replayed by count ──────
  //
  // `#clusters-right-nav` / `#clusters-left-nav` are RELATIVE moves. A recording
  // stores N clicks on one of them; N is only true for the window the recording
  // was made in, and it is wrong in BOTH directions — a wider replay viewport
  // needs fewer (the surplus ones scroll PAST the target and the destination
  // click lands on whatever took its place), a narrower one needs more.
  //
  // These four cases replaced ONE case that pinned the old corrective
  // mechanism, `revealTarget`, which only ran after a click had already failed
  // with "outside of the viewport" and so could only ever ADD paging. It is
  // deleted, along with the caret-skipping mechanism that could only ever
  // REMOVE paging. The single loop in engine/relative-nav.ts does both, so both
  // directions of the defect are now pinned rather than one.
  //
  // The fixture pages a fixed window of two clusters, so "reachable" does not
  // depend on the window these checks happen to run in — see springboard.html.
  {
    name: 'REGRESSION/rail-overshoot-clicks-the-wrong-cluster',
    // Payables comes into the window after TWO carets. The recording holds
    // five, because it was made where more clusters fitted. Replaying the count
    // pages past Payables and the destination click then lands on Projects or
    // My Enterprise — a green step that opened the wrong work area, which is
    // the worst outcome available. The surplus carets must be dropped.
    patch: 'oracle-fusion',
    steps: [
      nav('springboard.html'),
      ...Array.from({ length: 5 }, () => ({
        action: 'click', type: 'click',
        locator: { id: 'clusters-right-nav' },
        description: 'Scroll the cluster rail right',
      })),
      { action: 'click', type: 'click', locator: { id: 'groupNode_Payables' }, description: 'Open Payables' },
      assertMarker('OPENED-PAYABLES'),
    ],
    // Both halves, in order: the first caret PAGES until Payables is reachable,
    // and each of the four after it is then recognised as surplus WITHOUT
    // paging again. Asserting only the first half left the surplus-detection
    // short-circuit uncovered — a mutation that deleted it still passed,
    // because the paging loop's own reachability check happened to recover.
    expect: {
      success: true,
      statuses: 'skkkkkss',
      logLike: /paged the strip until "Open Payables"[\s\S]*"Open Payables" is already reachable — this paging click is surplus/,
    },
  },
  {
    name: 'REGRESSION/rail-undershoot-leaves-cluster-off-screen',
    // The mirror defect, and the one the old revealTarget existed for: the
    // recording was made on a screen where MORE clusters fitted, so FEWER
    // carets were captured than replay needs. My Enterprise needs five; the
    // recording has one. Obeying the count leaves it paged off and the
    // destination click fails on an element that is present and fine.
    patch: 'oracle-fusion',
    steps: [
      nav('springboard.html'),
      { action: 'click', type: 'click', locator: { id: 'clusters-right-nav' }, description: 'Scroll the cluster rail right' },
      { action: 'click', type: 'click', locator: { id: 'groupNode_MyEnterprise' }, description: 'Open My Enterprise' },
      assertMarker('OPENED-MY-ENTERPRISE'),
    ],
    expect: { success: true, statuses: 'skss', logLike: /paged the strip until "Open My Enterprise"/ },
  },
  {
    name: 'REGRESSION/absent-cluster-is-reported-as-a-timeout',
    // Seven of nineteen scripts in one batch failed on a "Register Supplier"
    // task that was not provisioned on the pod. Every one was reported as an
    // 80s locator.waitFor timeout, which reads as a selector bug — days were
    // spent hunting for one. After the whole rail has been paged end to end in
    // both directions and the selector still matches NOTHING in the document,
    // the honest verdict is that the feature is not on this instance, and the
    // message has to say so in those words.
    patch: 'oracle-fusion',
    steps: [
      nav('springboard.html'),
      { action: 'click', type: 'click', locator: { id: 'clusters-right-nav' }, description: 'Scroll the cluster rail right' },
      { action: 'click', type: 'click', locator: { id: 'groupNode_RegisterSupplier' }, description: 'Open Register Supplier' },
      assertMarker('NEVER-REACHED'),
    ],
    expect: {
      success: false,
      statuses: 'sfkk',
      errorLike: /NOT PRESENT ON THIS INSTANCE[\s\S]*not a timeout/,
      // The message alone was never enough. It is prose, and a report that has
      // to regex prose to learn WHO must act is one reword away from being
      // wrong. The verdict is the machine-readable half of the same finding.
      verdict: {
        category: 'TARGET_NOT_PRESENT',
        responsibility: 'ENVIRONMENT_ERROR',
        source: 'thrown',
        ruleId: 'TargetNotPresentError',
        confidence: 'certain',
      },
    },
  },
  {
    name: 'WIRING/a-thrown-verdict-is-taken-verbatim-and-never-re-derived-from-text',
    // The engine PROVED this absence — it counted every candidate locator
    // against the live document. That is strictly better evidence than any
    // reading of the message, so the verdict must come off the thrown error
    // (source 'thrown', ruleId naming the class) and not from the rule table.
    // If this ever reports source 'rule', a throw site has gone back to
    // throwing a plain Error and the category is being reverse-engineered from
    // prose again — which is the exact failure mode errors.ts exists to end.
    patch: 'oracle-fusion',
    steps: [
      nav('springboard.html'),
      {
        action: 'click', type: 'click',
        locator: { role: 'link', name: 'Register Supplier', selector: 'internal:role=link[name="Register Supplier"i]' },
        description: 'Open Register Supplier',
      },
      assertMarker('NEVER-REACHED'),
    ],
    // Small, so a genuine absence is not paid for at Oracle's worst case.
    env: { REPLAY_VISIBLE_MS: '2000', REPLAY_ACTION_MS: '2000' },
    expect: {
      success: false,
      statuses: 'sfk',
      errorLike: /NOT PRESENT ON THIS INSTANCE[\s\S]*not a timeout and not a stale selector/,
      logLike: /\[verdict\] TARGET_NOT_PRESENT \/ ENVIRONMENT_ERROR \(thrown TargetNotPresentError, certain\)/,
      verdict: {
        category: 'TARGET_NOT_PRESENT',
        responsibility: 'ENVIRONMENT_ERROR',
        kind: 'Setup Missing',
        source: 'thrown',
        ruleId: 'TargetNotPresentError',
      },
    },
  },
  {
    name: 'WIRING/TARGET_NOT_PRESENT-never-pays-for-an-AI-heal',
    // The single largest waste this work exists to remove. A task link the pod
    // never had is not on the page, so a model looking at that page cannot find
    // it — yet every one of those failures used to buy a heal attempt, at money
    // and, worse, at wall-clock charged to the rest of the run.
    //
    // Recovery is ENABLED here, deliberately. With the gate in place nothing is
    // dispatched and no transport is ever contacted; with the gate removed the
    // engine really does try to recover, 'recovery-start' is emitted, and this
    // case fails. Asserting only the skip line would pass with recovery
    // disabled, which is why the negative assertion is on 'recovery-start'.
    patch: 'oracle-fusion',
    env: {
      AI_RECOVERY_ENABLED: 'true',
      // cli, not api: isRecoveryEnabled() returns true for it without an API
      // key, so the gate is what stops the dispatch rather than a missing
      // credential. Nothing is spawned as long as the gate holds.
      AI_RECOVERY_METHOD: 'cli',
      REPLAY_VISIBLE_MS: '2000',
      REPLAY_ACTION_MS: '2000',
    },
    steps: [
      nav('springboard.html'),
      {
        action: 'click', type: 'click',
        locator: { role: 'link', name: 'Register Supplier', selector: 'internal:role=link[name="Register Supplier"i]' },
        description: 'Open Register Supplier',
      },
      assertMarker('NEVER-REACHED'),
    ],
    expect: {
      success: false,
      statuses: 'sfk',
      logLike: /\[ai\] skipped — TARGET_NOT_PRESENT: the element is not in the document/,
      logUnlike: /"type":"recovery-start"/,
      verdict: { category: 'TARGET_NOT_PRESENT', recoverySkipped: true },
    },
  },
  {
    name: 'REGRESSION/rail-already-past-the-target-is-never-scanned-back',
    // The rail starts already scrolled to the far end — which is where a
    // recording that overshot and was corrected with a left caret leaves it,
    // and where an earlier step in the same script can leave it. The recorded
    // caret points RIGHT, and right is exhausted from the first moment, so a
    // search that only ever pages in the recorded direction gives up
    // immediately on a cluster that is sitting two pages to the left.
    patch: 'oracle-fusion',
    env: { REPLAY_ACTION_MS: '4000' },
    steps: [
      nav('springboard.html?page=5'),
      { action: 'click', type: 'click', locator: { id: 'clusters-right-nav' }, description: 'Scroll the cluster rail right' },
      { action: 'click', type: 'click', locator: { id: 'groupNode_Payables' }, description: 'Open Payables' },
      assertMarker('OPENED-PAYABLES'),
    ],
    expect: { success: true, statuses: 'skss', logLike: /found "Open Payables" by paging back/ },
  },
  {
    name: 'REGRESSION/no-op-caret-must-not-page-forever',
    // A caret that stays ENABLED but scrolls nothing. Termination cannot rest
    // on the control disabling itself, so the search compares the strip's
    // painted contents before and after each click and stops when a click
    // achieved nothing. The destination is present in the DOM, merely paged
    // away, so this is NOT the "not present on this instance" verdict — the
    // step goes back on the recorded path and is allowed to fail on its own
    // terms, which is the safety rule this whole mechanism is bound by.
    patch: 'oracle-fusion',
    env: { REPLAY_ACTION_MS: '4000' },
    steps: [
      nav('springboard.html?stuck=1'),
      { action: 'click', type: 'click', locator: { id: 'clusters-right-nav' }, description: 'Scroll the cluster rail right' },
      { action: 'click', type: 'click', locator: { id: 'groupNode_MyEnterprise' }, description: 'Open My Enterprise' },
      assertMarker('OPENED-MY-ENTERPRISE'),
    ],
    expect: { success: false, statuses: 'ssfk', logLike: /is a no-op here/ },
  },
];

// ── runner ─────────────────────────────────────────────────────────────────

const only = process.argv[2];
const cases = only ? CASES.filter((c) => c.name.includes(only)) : CASES;

mkdirSync(WORK, { recursive: true });

/** Run one case to completion, returning everything it wrote to stdout+stderr. */
function runCase(env) {
  return new Promise((done) => {
    const child = spawn(
      process.execPath,
      [PW_CLI, 'test', '--reporter=line', '--workers=1', '--retries=0'],
      { cwd: ROOT, env: { ...process.env, ...env } },
    );
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', () => done(out));
    child.on('error', (e) => done(`${out}\nspawn failed: ${e.message}`));
  });
}

const concurrency = Math.max(
  1,
  Number(process.env.CONCURRENCY) || Math.min(os.cpus()?.length || 4, 6)
);

let passed = 0;
const failures = [];

async function executeCase(c, caseIndex) {
  // Every case gets its OWN directory.
  //
  // These were shared files under .work/, and that made the whole suite
  // non-deterministic: a Playwright worker left over from an earlier or killed
  // run would write into the same results.json the current case was about to
  // read, so a 2-step case reported 3 steps, filtering to one case executed
  // another's steps, and back-to-back runs of identical code gave 28/59 then
  // 53/59. A count from that suite was not evidence either way — which is
  // worse than a failing suite, because it looks like one.
  //
  // Indexed as well as named so two cases cannot collide on a sanitised name,
  // and so the directory order matches the run order when reading them back.
  const slug = String(c.name).replace(/[^a-z0-9]+/gi, '-').slice(0, 60);
  const caseDir = join(WORK, `${String(caseIndex).padStart(3, '0')}-${slug}`);
  // Removed first, not just overwritten: a stale results.json from a previous
  // run of THIS case would otherwise be read as this run's result if the engine
  // died before writing one.
  if (existsSync(caseDir)) rmSync(caseDir, { recursive: true, force: true });
  mkdirSync(caseDir, { recursive: true });

  const actionsPath = join(caseDir, 'actions.json');
  const resultsPath = join(caseDir, 'results.json');
  writeFileSync(actionsPath, JSON.stringify(c.raw ?? c.steps, null, 1));

  // Async, NOT spawnSync: the fixture server lives in this process, and
  // spawnSync blocks the event loop — so the very page the child is trying to
  // load could never be served, and every case failed on a navigation timeout.
  const stdout = await runCase({
    JOB_ACTIONS_PATH: actionsPath,
    JOB_RESULTS_PATH: resultsPath,
    PLAYWRIGHT_HEADLESS: 'true',
    // The fixture server is on loopback, which the engine blocks by default.
    REPLAY_ALLOW_PRIVATE_HOSTS: 'true',
    AI_RECOVERY_ENABLED: 'false',
    ...(c.patch ? { APP_PATCH: c.patch } : {}),
    // Case-supplied environment, last so a case can override any of the above.
    ...(c.env || {}),
  });
  const problems = [];

  // A case that names a patch must have RUN under it. selectPatch() falls back
  // to auto-detection when APP_PATCH is not a registered name, so a typo turns
  // an Oracle case into a generic one that still passes — the check would then
  // be pinning behaviour it never exercised.
  if (c.patch) {
    const used = stdout.match(/\[patch\] forced by APP_PATCH: (\S+)/)?.[1];
    if (used !== c.patch) {
      problems.push(`case asks for patch "${c.patch}" but the engine used ${used ? `"${used}"` : 'auto-detection'}`);
    }
  }

  // Unlike `throws`, this composes with the results checks below: a diagnostic
  // the engine prints about a recording says nothing about whether the run
  // succeeded, so both have to be asserted together.
  if (c.expect.logLike && !c.expect.logLike.test(stdout)) {
    problems.push(`expected output matching ${c.expect.logLike}`);
  }

  // The negative half of logLike. A case that asserts "recovery was NOT
  // attempted" cannot be written any other way: the absence of an event is the
  // whole claim, and asserting only what DID appear would pass just as happily
  // with the gate deleted.
  if (c.expect.logUnlike && c.expect.logUnlike.test(stdout)) {
    problems.push(`output matched ${c.expect.logUnlike}, which it must not`);
  }

  if (c.expect.throws) {
    if (!c.expect.throws.test(stdout)) problems.push(`expected output matching ${c.expect.throws}`);
  } else {
    let r = null;
    try { r = JSON.parse(readFileSync(resultsPath, 'utf-8')); } catch { /* handled below */ }
    if (!r) {
      problems.push('no results.json was written');
    } else {
      const statuses = r.results.map((x) => (x.status === 'skipped' ? 'k' : x.status[0])).join('');
      if (r.success !== c.expect.success) problems.push(`success ${r.success}, expected ${c.expect.success}`);
      if (c.expect.statuses && statuses !== c.expect.statuses) {
        problems.push(`statuses "${statuses}", expected "${c.expect.statuses}"`);
      }
      if (c.expect.errorLike) {
        const failed = r.results.find((x) => x.status === 'failed');
        if (!failed || !c.expect.errorLike.test(String(failed.error))) {
          problems.push(`error ${JSON.stringify(failed?.error ?? null)} did not match ${c.expect.errorLike}`);
        }
      }
      // The deterministic verdict recorded on the failed step (engine/errors.ts).
      // Field-by-field rather than a regex over the message, because the message
      // is prose that may legitimately be reworded and the CATEGORY may not.
      if (c.expect.verdict) {
        const failed = r.results.find((x) => x.status === 'failed');
        const got = failed?.verdict;
        if (!got) {
          problems.push(`no verdict was recorded on the failed step (got ${JSON.stringify(failed?.verdict ?? null)})`);
        } else {
          for (const [k, want] of Object.entries(c.expect.verdict)) {
            if (got[k] !== want) problems.push(`verdict.${k} = ${JSON.stringify(got[k])}, expected ${JSON.stringify(want)}`);
          }
        }
      }
      for (const [k, v] of Object.entries(c.expect.outputs || {})) {
        if (r.outputs?.[k] !== v) problems.push(`output ${k}=${JSON.stringify(r.outputs?.[k])}, expected ${JSON.stringify(v)}`);
      }
      for (const [k, ms] of Object.entries(c.expect.minStepMs || {})) {
        const step = r.results[Number(k)];
        if (!step) problems.push(`no step ${k} to time`);
        else if (step.duration < ms) problems.push(`step ${k} took ${step.duration}ms, expected at least ${ms}ms`);
      }
    }
  }

  const KNOWN = new Set([
    'success', 'statuses', 'errorLike', 'outputs', 'throws', 'minStepMs', 'logLike',
    'logUnlike', 'verdict',
  ]);
  for (const k of Object.keys(c.expect)) {
    if (!KNOWN.has(k)) problems.push(`case declares "${k}", which this runner does not check — remove it or implement it`);
  }

  if (problems.length) {
    failures.push({ name: c.name, problems, stdout });
    console.log(`FAIL  ${c.name}`);
    for (const p of problems) console.log(`        ${p}`);
    // The engine's own output is the evidence for WHY it failed, and it was
    // being captured for regex matching and then discarded — leaving
    // `statuses "fk", expected "ss"` as the entire diagnostic.
    const tail = stdout.trimEnd().split('\n').slice(-25);
    if (tail.length) {
      console.log('        ── engine output (last 25 lines) ──');
      for (const line of tail) console.log(`        | ${line}`);
    }
  } else {
    passed++;
    console.log(`pass  ${c.name}`);
  }
}

// Execute cases concurrently
let cursor = 0;
const workers = Array.from({ length: Math.min(concurrency, cases.length) }, async () => {
  while (cursor < cases.length) {
    const idx = cursor++;
    await executeCase(cases[idx], idx);
  }
});

await Promise.all(workers);

fixtures.kill();

console.log(`\n${passed}/${cases.length} passed`);
if (failures.length) {
  console.log('\nA failure here is one of two things, and it is worth deciding which BEFORE');
  console.log('changing any code:');
  console.log('  1. a regression  — the behaviour was right and a change broke it');
  console.log('  2. a moved goalpost — the behaviour changed deliberately, so the case is stale');
  console.log('Patching the engine to satisfy a stale case is how fixes pile up on fixes.');
  process.exit(1);
}
