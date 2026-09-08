/**
 * The replay runner.
 *
 * Deliberately thin. It owns job wiring only — reading the recording, streaming
 * events, taking screenshots, invoking AI recovery and writing results.json —
 * while the replay itself lives in `engine/` and everything application-specific
 * lives behind a patch in `patches/`.
 *
 * Contract with the queue worker is unchanged:
 *   JOB_ACTIONS_PATH    — actions JSON for THIS execution (required)
 *   JOB_SCREENSHOT_DIR  — where to write step_<N>.png (one per step, for the PDF)
 *   JOB_RESULTS_PATH    — where to write the per-step results the worker reads
 *   JOB_EXECUTION_ID    — id, only used to tag the streamed lines
 *   APP_PATCH           — optional, forces an application patch
 */

import { test, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// The dispatcher, not ./ai-recovery directly: it picks the transport (claude CLI
// on a subscription vs an HTTP API key), tries the cross-script fix library
// before spending anything on a model, and reuses one CLI session across runs.
// ./ai-recovery is still the anthropic API transport underneath it.
import { recoverWithClaude, isRecoveryEnabled, type RecoveryResult } from './ai-recovery-dispatch';
import {
  executeAction,
  verifyRecovered,
  sessionOriginOf,
  firstNavigateIndex,
  type ActionContext,
} from './actions';
import { assertReplayable, describeAction, normalizeAction, parseRecording } from './normalize';
import { resolveRelativeNav } from './relative-nav';
import { installSettleProbe, waitForPaint } from './settle';
import {
  RECOVERY_MAX_ATTEMPTS, RECOVERY_RUN_MS, RECOVERY_STEP_MS,
  LOGIN_SETTLE_MS, SLOW_STEP_MS, STEP_BUDGET_MS, describeTimeouts,
} from './timeouts';
import { Redactor } from './values';
import type { NormalizedAction, StepResult } from './types';
import { selectPatch } from './patches';
import { classifyCommitErrors } from './commit-error-type';
import {
  buildMessage, classify, isClassifiedError, SessionExpiredError,
  type Verdict,
} from './errors';
import { CredentialStore } from './credentials';
import {
  buildIdContext, isCommitTrigger, isDismissTrigger, inCaptureTail, clickTargetName,
  readDismissDialogText, captureTransactionInfo, bestCapture,
  type IdContext, type TransactionInfo,
} from './transaction-capture';
import { classifyUiCode, inferStage } from './aiFixClassifier';

const JOB_ACTIONS_PATH = process.env.JOB_ACTIONS_PATH || '';
const JOB_SCREENSHOT_DIR = process.env.JOB_SCREENSHOT_DIR || '';
const JOB_RESULTS_PATH = process.env.JOB_RESULTS_PATH || '';
const JOB_EXECUTION_ID = process.env.JOB_EXECUTION_ID || '';
const JOB_MODE = Boolean(JOB_ACTIONS_PATH);

/** Captured by `copy` steps, written to results.json for param_bindings. */
const capturedOutputs: Record<string, string> = {};

/**
 * Fixes this run proved, on their way to cus_script.script_json_parameterized.
 *
 * Only VERIFIED recoveries land here — verifyRecovered() re-checks the page
 * independently, because the model's own verdict is not evidence and a `warn`
 * counts as a pass all the way to the PDF. Writing an unverified fix back would
 * teach every later run to replay something that never worked.
 */
const heals: Array<{
  index: number;
  description: string;
  reason: string;
  steps: any[];
  failureStage?: string;
  uiCode?: string;
  url?: string;
  action?: string;
  rawDescription?: string;
  rawSelector?: string;
  model?: string;
}> = [];

/** Best transaction identifier seen so far — module scope so writeResults() can
 *  publish it after every step, not only at the end. */
let capturedTransaction: TransactionInfo | null = null;

const redactor = new Redactor();

/**
 * One machine-readable line per event on stdout. The worker greps for the
 * prefix and forwards the payload to the SSE stream, so the UI can follow a run
 * live instead of waiting for the PDF.
 */
function emit(type: string, payload: Record<string, any>): void {
  // Prefix must stay byte-identical to EVENT_PREFIX in src/queue/specRunner.js —
  // a mismatch is silent: every event is parsed as ordinary stdout and the live
  // view simply shows nothing while the run proceeds normally.
  console.log('@@EVENT ' + JSON.stringify({ type, executionId: JOB_EXECUTION_ID, ...payload }));
}

/** Every user-visible line goes through here — recordings carry passwords. */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const safe = redactor.redact(message);
  console.log(safe);
  emit('log', { message: safe, level });
}

// Screenshots are named by RECORDED step index (not array position), because
// the report matches step_<N>.png against each result's `index`.
async function captureStepScreenshot(page: Page, index: number): Promise<void> {
  if (!JOB_SCREENSHOT_DIR) return;
  try {
    // Never photograph a page that has not painted — a blank frame in the report
    // is worse than a late one, and it is indistinguishable from a real
    // screenshot once it is on disk. No-op when there is already content.
    if (!(await waitForPaint(page, 5000))) {
      console.log(`[Screenshot] step ${index}: page still blank — capturing anyway`);
    }

    if (!fs.existsSync(JOB_SCREENSHOT_DIR)) fs.mkdirSync(JOB_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(JOB_SCREENSHOT_DIR, `step_${index}.png`),
      // Full page: an ADF work area is taller than the window, so a viewport
      // shot crops away most of what the step is meant to evidence.
      fullPage: true,
      animations: 'disabled',
      timeout: 20_000,
    });
  } catch (err: any) {
    // A missing screenshot must never fail the step — the PDF just omits it.
    console.log(`[Screenshot] step ${index} failed: ${err.message}`);
  }
}

/**
 * Persist what we know so far.
 *
 * Called after EVERY step, not just at the end. results.json is the only
 * artefact the PDF, the defect record and captured_outputs are built from, and
 * writing it once at the end meant that ANY abnormal termination — the run
 * timeout firing, the worker's SIGKILL, a browser crash, an OOM — destroyed
 * every per-step detail and every identifier captured along the way. The
 * operator was left with "Spec produced no results (exit code 1)" for precisely
 * the runs that most needed explaining, and a retry would recreate a record the
 * lost run had already created.
 *
 * It is a few KB of synchronous write against steps that take seconds.
 */
function writeResults(results: StepResult[], success: boolean, error: string | null): void {
  if (!JOB_RESULTS_PATH) return;
  try {
    fs.mkdirSync(path.dirname(JOB_RESULTS_PATH), { recursive: true });
    fs.writeFileSync(
      JOB_RESULTS_PATH,
      JSON.stringify({ success, error, results, outputs: capturedOutputs, transactionInfo: capturedTransaction, heals }, null, 2),
      'utf-8',
    );
  } catch (err: any) {
    console.log(`[Results] write failed: ${err.message}`);
  }
}

/**
 * Warn about a click that appears twice in a row on the same control.
 *
 * A recorder occasionally captures one operator click twice — a double-fired
 * event, or a genuine impatient second click on a button that had already
 * responded. On replay the two are not equivalent: the first opens the dialog,
 * the second lands on whatever is now under that selector. The run then drifts
 * one state away from the recording, and the FIRST step that cannot cope is
 * usually far downstream. One such recording clicked "Create" twice on the
 * supplier address form and surfaced twenty steps later, at an unrelated
 * checkbox, which is where the investigation started.
 *
 * Diagnostic only. It never drops the step: a real double-click on a grid row
 * is recorded as two clicks by some recorders, and silently discarding one
 * would break those recordings to fix a different problem. Naming the suspect
 * up front is enough — the log then says where to look instead of blaming the
 * step that finally failed.
 */
function warnOnDuplicateClicks(actions: NormalizedAction[]): void {
  // The recorder's `locator.text` counts as identity too. A step recorded as
  // internal:text="Ordering" carries neither a selector nor an accessibleName
  // — and normalize does not lift `locator.text` onto `action.text`, which is
  // the fill VALUE field — so requiring either made this check silently skip
  // exactly the recordings it was written for. Read it off the raw locator.
  const locText = (a: NormalizedAction) => String((a.locator as any)?.text || '');
  const identity = (a: NormalizedAction) => a.selector || a.accessibleName || locText(a);
  const key = (a: NormalizedAction) =>
    `${a.selector || ''}|${a.accessibleName || ''}|${locText(a)}|${a.description || ''}`;

  for (let i = 1; i < actions.length; i++) {
    const prev = actions[i - 1];
    const cur = actions[i];
    if (String(cur.name).toLowerCase() !== 'click') continue;
    if (String(prev.name).toLowerCase() !== 'click') continue;
    // A step with no identity at all would make every pair look duplicated.
    if (!identity(cur)) continue;
    if (key(prev) !== key(cur)) continue;

    console.log(
      `[recording] steps ${i} and ${i + 1} are the same click ` +
      `("${cur.description || identity(cur)}"). If this run drifts, ` +
      `suspect a double-captured click — the second one lands on whatever the first revealed.`,
    );
  }
}

test.describe('Dynamic Action Replayer', () => {
  test('Replay recorded actions', async ({ page: initialPage }) => {
    let page = initialPage;
    if (!JOB_ACTIONS_PATH) {
      throw new Error(
        'JOB_ACTIONS_PATH is not set. This spec replays a recording supplied by the queue ' +
        'worker; to run it directly, point JOB_ACTIONS_PATH at an actions JSON file.',
      );
    }
    const file = path.resolve(JOB_ACTIONS_PATH);
    if (!fs.existsSync(file)) throw new Error(`Actions file not found: ${file}`);

    // Two envelopes are accepted: a schema v1 object, and a bare array, which
    // still means legacy. The version is read from the file, never guessed from
    // the shape of the steps — see normalize.ts for why that matters.
    const { schemaVersion, entries, meta } = parseRecording(JSON.parse(fs.readFileSync(file, 'utf-8')));
    assertReplayable(entries);

    // Replace recorded login values with the ones in the environment, so one
    // recording can run against several instances without re-recording.
    //
    // ORACLE_USERNAME/ORACLE_PASSWORD are the older names, still honoured: these
    // are set by an operator in a .env file, and silently ignoring them would
    // fail the login with no indication of why.
    if (process.env.USE_ENV_CREDENTIALS === 'true') {
      const envUsername = process.env.REPLAY_USERNAME || process.env.ORACLE_USERNAME;
      const envPassword = process.env.REPLAY_PASSWORD || process.env.ORACLE_PASSWORD;
      if (!process.env.REPLAY_USERNAME && process.env.ORACLE_USERNAME) {
        console.log('[credentials] ORACLE_USERNAME/ORACLE_PASSWORD are deprecated — use REPLAY_USERNAME/REPLAY_PASSWORD.');
      }
      for (const entry of entries) {
        if (entry.action === 'fill' || entry.action === 'type') {
          const name = (entry.locator?.name || '').toLowerCase();
          const label = (entry.locator?.label || '').toLowerCase();
          if ((name === 'username' || label === 'username') && envUsername) {
            entry.value = envUsername;
            if (entry.verification) entry.verification.expectedValue = envUsername;
          } else if ((name === 'password' || label === 'password') && envPassword) {
            entry.value = envPassword;
            if (entry.verification) entry.verification.expectedValue = envPassword;
          }
        }
      }
    }

    // Normalise once. All three recorder dialects land in the same shape here,
    // and the lookahead a fill needs is just the next element of this array.
    // The version is carried onto every step, because dispatch has to branch on
    // it — `select` means different things in v1 and legacy.
    const normalize = (e: any) => normalizeAction(e, schemaVersion);
    const actions: NormalizedAction[] = entries.map(normalize);

    redactor.collect(entries, normalize);
    if (redactor.count) console.log(`[redact] ${redactor.count} secret value(s) will be masked in logs`);

    warnOnDuplicateClicks(actions);

    // Built once for the run, and only when something asks for a credential —
    // constructing it eagerly would fail a perfectly good recording that has no
    // login steps just because no key was configured.
    const needsCredentials = actions.some((a) => !!a.credentialRef);
    const credentials = needsCredentials ? new CredentialStore() : undefined;

    // Where the login is considered finished, for the "did it actually
    // authenticate?" guard in the step loop below.
    //
    // NOT the credential step itself: a recording types the password and THEN
    // clicks Sign In, so the page is still legitimately a sign-in screen when
    // the last `fill` completes. Checking there would fail every login.
    //
    // The submit is the first step after the last credential that acts on the
    // page (a click or a press) — that is the step whose success is supposed to
    // mean "signed in". A recording that ends on the credential itself gets -1,
    // which never matches a step index, so the guard is inert rather than
    // needing a second flag.
    const lastCredentialStep = actions.reduce(
      (last, a, idx) => (a.credentialRef ? idx : last),
      -1,
    );
    const loginSubmitStep = lastCredentialStep < 0
      ? -1
      : actions.findIndex(
          (a, idx) => idx > lastCredentialStep && (a.name === 'click' || a.name === 'press'),
        );
    if (needsCredentials) {
      const refs = [...new Set(actions.map((a) => a.credentialRef).filter(Boolean))];
      const raw = credentials!.rawCount;
      console.log(
        `[credentials] ${refs.length} reference(s) in this recording: ${refs.join(', ')}` +
        (credentials!.isConfigured ? '' : ' — NONE supplied, those steps will fail') +
        // Never silent about plaintext: someone who believes the vault is in
        // play should be able to see from the log that it is not.
        (raw ? ` — ${raw} supplied as PLAINTEXT (not encrypted)` : ''),
      );
    }

    const patch = selectPatch(actions);

    // Decided ONCE, from the recording, before anything navigates. The origin of
    // the first navigate is the live one — see sessionOriginOf() — and it is the
    // anchor every later navigate is aligned to, rather than whatever page the
    // browser happens to be on when that step comes round.
    const sessionOrigin = sessionOriginOf(actions);
    const firstNavIndex = firstNavigateIndex(actions);
    if (sessionOrigin) console.log(`[navigate] session origin: ${sessionOrigin}`);

    // What the AI features call this application.
    //
    // The patch wins whenever one actually matched: it identified the product
    // from the recording's own URLs, which beats anything the caller asserted.
    // JOB_PRODUCT_NAME only fills the gap left by the generic fallback, whose
    // productName is the placeholder 'this application' — that is the case where
    // the run knows the product but the engine could not detect it.
    const productName =
      patch.productName !== 'this application'
        ? patch.productName
        : (process.env.JOB_PRODUCT_NAME || '').trim() || patch.productName;
    if (productName !== patch.productName) {
      console.log(`[patch] product named by the caller: "${productName}"`);
    }

    // Must be installed before the first navigation so it survives every one
    // that follows — the engine settles on its signals instead of on sleeps.
    await installSettleProbe(page);

    console.log(
      `Loaded ${actions.length} actions from: ${file} ` +
      `[schema ${schemaVersion === null ? 'legacy (bare array)' : `v${schemaVersion}`}` +
      `${meta.name ? `, "${meta.name}"` : ''}]`,
    );
    console.log(`[timeouts] ${describeTimeouts()}`);
    emit('start', { totalSteps: actions.length, patch: patch.name });

    const results: StepResult[] = [];
    let fatalError: string | null = null;

    // Run-wide recovery budget. A recovered step does NOT set fatalError, so
    // without these the loop can re-enter recovery on every later failure —
    // each with its own per-step ceiling — and spend longer in recovery than
    // the whole run is allowed to take. The constants existed; nothing read
    // them, which is the same as not having them.
    let recoveryMsUsed = 0;
    let recoveryAttempts = 0;

    // Scrape the application's identifiers off the page after a step.
    //
    // A function rather than a line at the end of the loop body, because the
    // loop has an early `continue` on the AI-recovery path. That `continue`
    // used to skip the scrape entirely: if the step that surfaced the new
    // record identifier was the one that got recovered, its identifier was
    // never captured, and every dependent script bound to that output typed an
    // empty value.
    //
    // Later wins: the application's identifier appears in the FINAL
    // confirmation, so letting the first scrape win let a stale dialog shadow it.
    const captureOutputs = async () => {
      Object.assign(capturedOutputs, await patch.scanForOutputs(page).catch(() => ({})));
    };

    // ── Transaction number ────────────────────────────────────────────────
    // Built from the WHOLE recording up front, not step by step: an operator-
    // supplied identifier (an AP invoice number typed at step 3) is still the
    // answer when the probe runs at step 40.
    const idContext: IdContext = buildIdContext(
      actions.map((a, i) => ({ name: a.name, label: a.accessibleName, text: a.text, raw: entries[i] })),
    );

    // A recording that captures the number explicitly beats any heuristic, so
    // the automatic probe stays out of the way entirely when one exists.
    const hasRecordedTransactionStep = actions.some(
      (a) => (a.name === 'copy' || a.name === 'capture') &&
             (a.isTransactionNumber === true || a.outputName === 'transactionNumber'),
    );
    if (hasRecordedTransactionStep) {
      log('[transaction] recording captures the number explicitly — automatic probe disabled');
    }

    /**
     * Keep the better of two captures and publish it alongside `copy` outputs so
     * a child script can bind a parameter to it. An explicit `copy` step named
     * transactionNumber always wins — that was asked for, this was inferred.
     */
    const recordTransaction = (info: TransactionInfo | null): void => {
      capturedTransaction = bestCapture(capturedTransaction, info);
      const num = capturedTransaction?.transactionNumber;
      if (!num || capturedOutputs.transactionNumber === num) return;
      capturedOutputs.transactionNumber = num;
      emit('output', { name: 'transactionNumber', value: num });
    };

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const label = describeAction(action, i);
      const code = action.selector || action.url || '';

      // Once a step has failed the page is off its expected path, so the rest
      // cannot be trusted — record them as skipped rather than running them.
      if (fatalError !== null) {
        results.push({
          index: i, action: action.name, description: redactor.redact(label), status: 'skipped',
          duration: 0, timestamp: Date.now(),
          error: 'Skipped — an earlier step failed', code,
          skipInReport: action.skipInReport,
        });
        continue;
      }

      const startedAt = Date.now();
      emit('step-start', { index: i, action: action.name, description: redactor.redact(label) });
      // Checkpoint BEFORE the step, so a step that never returns still leaves a
      // record of everything up to it.
      writeResults(results, false, `in progress at step ${i + 1} (${redactor.redact(label)})`);
      console.log(`\n[${i + 1}/${actions.length}] ${action.name} — ${redactor.redact(label)}`);

      // Re-acquire the page if a step closed or replaced it.
      //
      // Oracle IDCS sign-in, and any flow that opens a new window, can close
      // the tab this run was bound to. The fixture hands `page` over once and
      // never revisits it, so without this every remaining step fails against a
      // dead handle and the report blames the locators for a lost page.
      if (page.isClosed()) {
        const live = page.context().pages().filter((p) => !p.isClosed());
        if (live.length) {
          page = live[live.length - 1];
          await installSettleProbe(page);
          log('  [page] the previous page closed — continuing on the replacement', 'warn');
        }
      } else {
        // A step opened a NEW TAB and the old one stayed open.
        //
        // Oracle does this for whole sub-applications: on the Suppliers work
        // area, "Register Supplier" is an ordinary <a href> with target=_blank
        // pointing at the Redwood registration app. The click succeeds, the
        // form loads — in a tab this run is not driving. The old page is still
        // open, so the isClosed() branch above never fires, and every later
        // step then hunts for Company on the dashboard it never left. The
        // report blames the locators for a page the run simply was not on.
        //
        // Verified on Testing Vision: after that click,
        // context().pages() holds "Overview - Suppliers" AND "Registration
        // Internal - Start", the original reports isClosed() === false, and
        // Company resolves 0 times on it and once on the new tab.
        //
        // Follow the newest tab. A tab the application opened deliberately is
        // where the flow continues — that is what target=_blank means, and it
        // is what the operator saw when they recorded the step.
        const live = page.context().pages().filter((p) => !p.isClosed());
        const newest = live[live.length - 1];
        if (newest && newest !== page) {
          page = newest;
          await installSettleProbe(page);
          await page.bringToFront().catch(() => {});
          log(`  [page] a step opened a new tab — following it ("${(await page.title().catch(() => '')).slice(0, 60)}")`, 'warn');
        }
      }

      // A step whose click only PAGES a strip sideways cannot be replayed by
      // count — the count is a property of the recorder's window, not of the
      // destination. Ask instead whether the destination is reachable, paging
      // as many times as it actually takes. See engine/relative-nav.ts; this is
      // a no-op for every application whose patch does not claim such controls.
      if (patch.isRelativeNavStep(action)) {
        // Errors here are the deliberate "not present on this instance"
        // verdict; everything else has already been converted to 'recorded'
        // inside. Routed through the same failure path as any other step so it
        // reaches the report as this step's error.
        let verdict: 'skip' | 'recorded';
        try {
          verdict = await resolveRelativeNav(page, actions, i, patch, log);
        } catch (err: any) {
          const message = redactor.redact(err?.message || String(err));
          // Classified on the same terms as any other failure. This path never
          // reaches AI recovery at all, so there is no gate to apply — but the
          // report must still carry the verdict, or the one failure the engine
          // is MOST certain about would be the one it says least about.
          const railVerdict = classify({ error: err, message });
          const railSummary = redactor.redact(buildMessage(railVerdict, {
            step: `Step ${i + 1} (${label})`,
            target: action.accessibleName || action.description || undefined,
            raw: message,
          }));
          log(
            `  [verdict] ${railVerdict.category} / ${railVerdict.responsibility} ` +
            `(${railVerdict.source}${railVerdict.ruleId ? ` ${railVerdict.ruleId}` : ''}) — ${railSummary}`,
            'error',
          );
          emit('verdict', {
            index: i,
            category: railVerdict.category,
            responsibility: railVerdict.responsibility,
            kind: railVerdict.kind,
            ruleId: railVerdict.ruleId,
            source: railVerdict.source,
            confidence: railVerdict.confidence,
            summary: railSummary,
          });
          results.push({
            index: i, action: action.name, description: redactor.redact(label), status: 'failed',
            duration: Date.now() - startedAt, timestamp: Date.now(), error: message, code,
            skipInReport: action.skipInReport,
            verdict: {
              category: railVerdict.category,
              responsibility: railVerdict.responsibility,
              kind: railVerdict.kind,
              ruleId: railVerdict.ruleId,
              source: railVerdict.source,
              confidence: railVerdict.confidence,
              summary: railSummary,
              recoverySkipped: true,
            },
          });
          emit('step-end', { index: i, status: 'failed', duration: Date.now() - startedAt, error: message });
          fatalError = `Step ${i + 1} (${label}) failed: ${message}`;
          writeResults(results, false, fatalError);
          if (!JOB_MODE) throw err;
          continue;
        }
        if (verdict === 'skip') {
          results.push({
            index: i, action: action.name, description: redactor.redact(label), status: 'skipped',
            duration: Date.now() - startedAt, timestamp: Date.now(),
            error: 'Surplus paging click — the destination was already reachable', code,
            skipInReport: action.skipInReport,
          });
          emit('step-end', { index: i, status: 'skipped', duration: Date.now() - startedAt });
          writeResults(results, false, `in progress after step ${i + 1}`);
          continue;
        }
      }

      const ctx: ActionContext = {
        page,
        patch,
        log,
        next: actions[i + 1] ?? null,
        outputs: capturedOutputs,
        sessionOrigin,
        isFirstNavigate: i === firstNavIndex,
        credentials,
        redact: (secret: string) => redactor.addSecret(secret),
      };

      // The application reports a generated number in a confirmation dialog and the next
      // recorded step is the OK that closes it. Read it NOW — after the click
      // the dialog is gone and the number with it. Restricted to the tail of the
      // script because every OK before the commit belongs to something else: a
      // validation warning, a picker, a confirm-to-continue.
      if (!hasRecordedTransactionStep && inCaptureTail(i, actions.length) && isDismissTrigger(action)) {
        const dialogText = await readDismissDialogText(
          page, clickTargetName(action), patch.transactionSurfaces().dismissDialog);
        if (dialogText) {
          recordTransaction(
            await captureTransactionInfo(page, `before ${label}`.slice(0, 80), idContext, {
              skipSettle: true,
              presetText: dialogText,
              surfaces: patch.transactionSurfaces(),
            }),
          );
        }
      }

      try {
        // Ceiling on ONE step. With the patience caps raised for Oracle, a step
        // that hit several of them in sequence could otherwise run for minutes;
        // this bounds it so the run — and AI recovery — still make progress.
        let budgetTimer: NodeJS.Timeout | undefined;
        const outcome = await Promise.race([
          executeAction(action, ctx, i),
          new Promise<never>((_, reject) => {
            budgetTimer = setTimeout(
              () => reject(new Error(
                `Step exceeded its ${Math.round(STEP_BUDGET_MS / 1000)}s budget — ` +
                `the page never reached a state this step could act on.`,
              )),
              STEP_BUDGET_MS,
            );
          }),
        ]).finally(() => { if (budgetTimer) clearTimeout(budgetTimer); });
        await captureStepScreenshot(page, i);

        const elapsed = Date.now() - startedAt;
        // Surface the outliers. A cap that is never hit tells you nothing; a
        // slow-step line turns "the run was slow" into "step 23 took 22s".
        if (elapsed > SLOW_STEP_MS) {
          log(`  [slow] step ${i + 1} took ${(elapsed / 1000).toFixed(1)}s — ${redactor.redact(label)}`, 'warn');
        }

        // Did the login actually WORK?
        //
        // Execution 8336 reported six green steps on a run that never
        // authenticated: the credential had expired, every sign-in step
        // dispatched cleanly, and the run then spent 17 more steps failing
        // against a login page while the report blamed locators. `click Next`
        // succeeded *as a click* — nobody asked whether it logged anybody in.
        //
        // This is the same silent-green class as the checkbox that dispatched
        // without ticking and the LOV that typed without committing: an action
        // that achieves nothing while reporting success. The cure is the same —
        // read the outcome back rather than trusting the action.
        //
        // Checked once, after the step that SUBMITS the credentials, because
        // that is the first moment being on a sign-in page is unambiguously
        // wrong. On any earlier step — including the password fill — the
        // sign-in page is exactly where the run should be.
        if (i === loginSubmitStep) {
          // Wait for the redirect the submit is supposed to cause before
          // reading the page. Without this the check races the navigation and
          // reports "login failed" on a login that was merely still in flight —
          // and it cannot lean on captureStepScreenshot's paint wait, which is
          // skipped entirely when screenshots are off.
          //
          // IDCS bounces through several redirects, so poll rather than sample
          // once: leaving the sign-in page at any point within the budget is the
          // answer, and a run that has genuinely signed in exits immediately.
          const deadline = Date.now() + LOGIN_SETTLE_MS;
          let stillOnSignIn = true;
          while (Date.now() < deadline) {
            stillOnSignIn = await patch.sessionExpired(page).catch(() => false);
            if (!stillOnSignIn) break;
            await page.waitForTimeout(1000);
          }
          if (stillOnSignIn) {
            throw new Error(
              'Login did not complete — the page is still a sign-in screen after the ' +
              'credentials were submitted. The account is most likely expired, locked, ' +
              'or the password supplied for this run is wrong. Nothing after this step ' +
              'could have run against a signed-in session.',
            );
          }
        }

        const status = outcome === 'skipped' ? 'skipped' : 'success';
        results.push({
          index: i, action: action.name, description: redactor.redact(label), status,
          duration: Date.now() - startedAt, timestamp: Date.now(), error: null, code,
          skipInReport: action.skipInReport,
        });
        emit('step-end', { index: i, status, duration: Date.now() - startedAt });
        writeResults(results, false, `in progress after step ${i + 1}`);

      } catch (err: any) {
        const message = redactor.redact(err?.message || String(err));
        const livePageUrl = page.url();
        const uiCode = classifyUiCode(livePageUrl);
        const failureStage = err?.failureStage || inferStage(message);

        // The tab died UNDER the step.
        //
        // Following the newest tab is right for a sub-application that opens in
        // one (Oracle's Register Supplier), but wrong for a transient tab — a
        // print preview or a download shim that opens and closes itself. The
        // run follows it, the tab goes away mid-step, and Playwright reports
        // "Target page, context or browser has been closed" for something that
        // is not a locator problem at all.
        //
        // Fall back to a live page and retry the step ONCE. Retrying is safe
        // here specifically because the step never ran: the action threw on a
        // dead handle before it could touch anything, so there is no half-
        // applied change to repeat.
        if (/Target page, context or browser has been closed|Target closed/i.test(message)) {
          const live = page.context().pages().filter((p) => !p.isClosed());
          const fallback = live[live.length - 1];
          if (fallback && fallback !== page) {
            page = fallback;
            await installSettleProbe(page);
            await page.bringToFront().catch(() => {});
            log(`  [page] the tab this step was on closed — retrying on "${(await page.title().catch(() => '')).slice(0, 60)}"`, 'warn');
            try {
              const retryCtx: ActionContext = { ...ctx, page };
              await executeAction(action, retryCtx, i);
              await captureStepScreenshot(page, i);
              results.push({
                index: i, action: action.name, description: redactor.redact(label), status: 'success',
                duration: Date.now() - startedAt, timestamp: Date.now(), error: null, code,
                skipInReport: action.skipInReport,
              });
              emit('step-end', { index: i, status: 'success', duration: Date.now() - startedAt });
              writeResults(results, false, `in progress after step ${i + 1}`);
              continue;
            } catch (_) {
              // The retry failed too — fall through and report the ORIGINAL
              // error, which describes the actual problem better than "the
              // retry also failed".
            }
          }
        }

        // Hand the live page to Claude and let it try to complete the step.
        // Only runs on failure, so a clean replay never calls the API.
        // A failure on a sign-in screen is a session problem, not a locator
        // problem. Classify it BEFORE recovery, so the report says what is
        // actually wrong and no model call is spent hunting a Save button on a
        // login page.
        // The sign-in screen is expected during the initial login sequence (first 4 steps).
        // Only classify as expired if we are past the login sequence (step 5 / index 4 onwards).
        let expired = i >= 4 && await patch.sessionExpired(page).catch(() => false);
        if (expired) {
          log('  [session] the page is showing a sign-in screen — the session expired', 'error');
        }

        // ── THE VERDICT ────────────────────────────────────────────────────
        //
        // Decided here, once, before anything spends money or time on this
        // failure. Two sources and no third:
        //
        //   thrown — the step threw a ClassifiedError, so the code that threw
        //            it had evidence no message text can carry (it enumerated
        //            the DOM and the target was not in it). Taken verbatim.
        //   rule   — an ordered table over the message. Deterministic, offline.
        //
        // classify() NEVER calls a model, so this costs microseconds even on the
        // failure path.
        //
        // A sign-in page outranks both: the engine looked at the live page and
        // saw the login screen, which is better evidence than the exception the
        // step happened to throw against it.
        const thrown = isClassifiedError(err);
        let verdict: Verdict = expired && !thrown
          ? classify({ error: new SessionExpiredError(), stage: 'OTHER' })
          : classify({ error: err, message, stage: thrown ? undefined : (failureStage as any) });

        // Task 5 — retry: 'refresh-then-reclassify'.
        //
        // NOT IMPLEMENTED, deliberately, and said out loud rather than faked.
        // The rule that asks for it is the "Unauthorized Access: either you do
        // not have the privilege, or you have not signed in" string, which is
        // documented as covering BOTH a privilege gap and an expired session.
        // Resolving it needs the run to sign in again and repeat the step — and
        // this engine has no re-login path at all: the login steps live at the
        // FRONT of the recording (see types.ts on `[...loginSteps, ...business]`)
        // and are not addressable from mid-run, there is no stored credential
        // handle past the step that used it, and no patch exposes a sign-in.
        // Inventing one here would be a large, untested change on the failure
        // path. So the verdict is reported as provisional and the reason named.
        if (verdict.retry === 'refresh-then-reclassify') {
          log(
            `  [verdict] this failure is ambiguous between a privilege gap and an expired session, ` +
            `and can only be settled by signing in again and retrying. This engine has no re-login ` +
            `path, so the verdict below is PROVISIONAL — check the session before acting on it.`,
            'warn',
          );
        }

        // A sign-in page is the whole story regardless of what threw.
        if (verdict.category === 'SESSION_EXPIRED') expired = true;

        const verdictSummary = redactor.redact(
          buildMessage(verdict, {
            step: `Step ${i + 1} (${label})`,
            target: action.accessibleName || action.description || undefined,
            searched: typeof (err as any)?.context?.searched === 'number'
              ? (err as any).context.searched
              : undefined,
            raw: message,
          }),
        );
        log(
          `  [verdict] ${verdict.category} / ${verdict.responsibility} ` +
          `(${verdict.source}${verdict.ruleId ? ` ${verdict.ruleId}` : ''}, ${verdict.confidence}) — ${verdictSummary}`,
          verdict.responsibility === 'EXPECTED_VALIDATION' ? 'warn' : 'error',
        );
        emit('verdict', {
          index: i,
          category: verdict.category,
          responsibility: verdict.responsibility,
          kind: verdict.kind,
          ruleId: verdict.ruleId,
          source: verdict.source,
          confidence: verdict.confidence,
          summary: verdictSummary,
        });

        // ── RECOVERY GATE ──────────────────────────────────────────────────
        //
        // Categories where a model looking at the live page CANNOT succeed, so
        // paying for one is pure loss — both the API cost and, worse, the
        // wall-clock, which lands on every remaining step of the run.
        //
        //   TARGET_NOT_PRESENT — the engine counted every candidate locator and
        //     the element is not in the document. There is nothing on the page
        //     for a model to find. This is the case that motivated the module:
        //     7 of 19 scripts in one batch, each paying a full locate budget and
        //     then a heal that could not possibly work.
        //   SESSION_EXPIRED — a login page. Already gated below by `expired`;
        //     named here so the reason is the verdict rather than a side effect.
        //   RUN_CANCELLED — an operator stopped the run. Nothing failed, so
        //     there is nothing to heal, and healing it would fight the operator.
        //   BROWSER_LOST / RUNNER_FAILED — there is no live page left to send.
        //     recoverWithClaude would throw on a dead handle and be charged for
        //     the attempt.
        //
        // Deliberately NOT gated: LOCATOR_TIMEOUT and UNCLASSIFIED. Those are
        // exactly the "the element is there but we could not address it" cases
        // that recovery exists for, and gating them would remove the feature.
        // ELEMENT_NOT_INTERACTABLE and AMBIGUOUS_TARGET are likewise left open —
        // a scroll or a narrower pick is squarely what a model can do.
        const UNRECOVERABLE = new Set([
          'TARGET_NOT_PRESENT', 'SESSION_EXPIRED', 'RUN_CANCELLED', 'BROWSER_LOST', 'RUNNER_FAILED',
        ]);
        const unrecoverable = UNRECOVERABLE.has(verdict.category);
        if (unrecoverable && isRecoveryEnabled()) {
          log(
            `  [ai] skipped — ${verdict.category}: ${verdict.category === 'TARGET_NOT_PRESENT'
              ? 'the element is not in the document, so there is nothing on this page for a model to find'
              : 'no model can act on this class of failure'}. ` +
            `Recovery would cost time and money and could not succeed.`,
            'warn',
          );
        }

        // The application REFUSED the data (duplicate key, failed validation).
        // That is not a selector problem, so recovery is skipped: no model can
        // fix data the application rejected, and letting it try spends money to
        // report the wrong cause. Name the KIND of rejection so the report leads
        // with "Duplicate Data" rather than a sentence — best-effort, a null just
        // means the messages stand on their own.
        //
        // AND ONLY WHEN THE RULES COULD NOT DECIDE. `verdict.source` is the
        // gate: a THROWN or RULE verdict is already certain, and consulting a
        // model about it would spend an API call to second-guess evidence that
        // is strictly better than anything the model can see. Only
        // 'needs-model' — genuinely unrecognised message text — is worth an
        // API call, which is the entire contract errors.ts was written to.
        const commitRejected = Boolean(err?.commitRejected);
        let errorType: string | null = null;
        if (commitRejected && verdict.source !== 'needs-model') {
          log(
            `  [commit] step ${i + 1} was rejected by the application — skipping recovery. ` +
            `Not asking the model to name the kind either: ${verdict.ruleId || verdict.category} ` +
            `already decided it deterministically ("${verdict.kind}").`,
            'warn',
          );
          errorType = verdict.kind;
        } else if (commitRejected) {
          log(`  [commit] step ${i + 1} was rejected by the application — skipping recovery`, 'warn');
          // productName, not name: this reaches the model as prose, and the slug
          // "oracle-fusion" reads as a typo.
          const classified = await classifyCommitErrors(err.commitErrors || [], productName).catch(() => null);
          if (classified) {
            errorType = classified.label;
            log(
              `  [commit type] "${classified.label}"${classified.mixed ? ' (mixed kinds)' : ''}` +
              ` via ${classified.source} — ${classified.durationMs}ms`,
            );
            // Only when the API was actually called: a label served from the
            // cache cost nothing, and logging it as spend would make the usage
            // table say the opposite of what the cache is for.
            if (classified.usage) {
              emit('ai-usage', { index: i, model: classified.model, usage: classified.usage });
            }
            // Labels this run had to work out are announced, not stored. The
            // engine keeps no durable state of its own — when the service hands
            // it a cache file it owns persistence, and this event is how what
            // was learned gets back out. Still just a line on stdout: the
            // engine makes no network call and knows nothing about a platform.
            for (const entry of classified.learned || []) {
              emit('error-type-learned', { ...entry, model: classified.model });
            }
          }
        }

        let recovery: Awaited<ReturnType<typeof recoverWithClaude>> | null = null;
        // A credential-bearing step is never sent to the model. Recovery
        // transmits the target value, the element's outerHTML and a dump of the
        // page to a third-party API — for a login step that is the customer's
        // ERP password leaving their environment, which no amount of log
        // redaction undoes. A failed login is also the one failure a model
        // cannot legitimately "recover" from.
        const secretStep = redactor.isSecretStep(i);
        if (secretStep && isRecoveryEnabled()) {
          log('  [ai] skipped — this step carries a credential', 'warn');
        }

        // Both caps are checked here rather than inside recoverWithClaude,
        // because they are properties of the RUN, and the recovery module only
        // ever sees one step.
        const runBudgetLeft = RECOVERY_RUN_MS - recoveryMsUsed;
        const outOfAttempts = recoveryAttempts >= RECOVERY_MAX_ATTEMPTS;
        const outOfBudget = runBudgetLeft <= 5_000;
        if (isRecoveryEnabled() && !secretStep && !expired && !unrecoverable && (outOfAttempts || outOfBudget)) {
          log(
            `  [ai] skipped — this run has already used ${recoveryAttempts} recovery attempt(s) ` +
            `and ${(recoveryMsUsed / 1000).toFixed(0)}s of its ${(RECOVERY_RUN_MS / 1000).toFixed(0)}s budget`,
            'warn',
          );
        }

        if (!unrecoverable && !expired && !commitRejected && !secretStep && !outOfAttempts && !outOfBudget && isRecoveryEnabled()) {
          emit('recovery-start', { index: i, description: redactor.redact(label) });
          const recoveryStartedAt = Date.now();
          recoveryAttempts++;
          recovery = await recoverWithClaude(page, {
            index: i,
            action: action.name,
            description: redactor.redact(label),
            label: redactor.redact(action.accessibleName || ''),
            // NOT redacted, deliberately: the model has to echo this value back
            // through type_into to complete the step, so masking it here would
            // break recovery for every legitimate field.
            //
            // What protects a credential is isSecretStep() above, which refuses
            // recovery outright. That check recognises a secret by the FIELD'S
            // NAME, so widen SECRET_FIELD_RE or set `sensitive: true` in the
            // recording for anything it would not recognise — a security answer,
            // a PIN in a field called "q2", a token typed into a Comments box.
            // This is an egress that redaction cannot undo after the fact.
            value: action.text || '',
            selector: action.selector || '',
            error: message,
          }, {
            // Never more than what the RUN has left, so the last recovery of a
            // run cannot overrun the whole budget on its own.
            budgetMs: Math.min(RECOVERY_STEP_MS, runBudgetLeft),
            // Without this the module's redact() defaults to identity, and it
            // logs the value it types — the whole reason the hook exists.
            redact: (s: string) => redactor.redact(s),
            // What the active patch knows about this application. Supplied here
            // because only main.ts knows which patch is in play; the transports
            // stay vendor-agnostic.
            recoveryHints: patch.recoveryHints(),
            // Which product the model is looking at. Separate from the hints so
            // it can reason about a widget nobody wrote a hint for.
            productName,
          }).catch((e: any): RecoveryResult => ({
            attempted: true,
            recovered: false,
            summary: `recovery threw: ${e?.message || e}`,
            actions: [],
            // The dispatcher's result shape, so a thrown recovery reads the same
            // downstream as one that ran and failed. Zeros, not undefined: the
            // usage log adds these up and NaN there poisons the whole total.
            healSteps: [],
            model: process.env.AI_RECOVERY_MODEL || 'claude-sonnet-5',
            usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
            durationMs: Date.now() - recoveryStartedAt,
            apiError: `recovery threw: ${e?.message || e}`,
          }));
          // Charged whether or not it worked — a failed recovery costs the same
          // wall-clock as a successful one.
          recoveryMsUsed += Date.now() - recoveryStartedAt;
          emit('recovery-end', {
            index: i, recovered: recovery?.recovered ?? false,
            summary: redactor.redact(recovery?.summary ?? 'recovery produced no result'),
          });
        }

        // Capture AFTER any recovery, so the report shows how the page really
        // ended up rather than the moment it broke.
        await captureStepScreenshot(page, i);

        // The model's own verdict is not evidence. A `warn` row counts as a pass
        // all the way through to the PDF, so without an independent re-check one
        // confident tool call turns a red run green with nothing having looked
        // at the page.
        if (recovery?.recovered) {
          const unproven = await verifyRecovered(action, ctx);
          if (unproven) {
            log(`  [verify] recovery claimed success but ${unproven}`, 'error');
            recovery = { ...recovery, recovered: false, summary: `${recovery.summary} — rejected on re-check: ${unproven}` };
          }
        }

        if (recovery?.recovered) {
          // Write the fix back only now — past verifyRecovered() above, so what
          // reaches cus_script is a fix something other than the model confirmed.
          // The worker picks these up from results.json (see healWriter.saveHeal)
          // and the NEXT run replays them instead of paying for recovery again.
          if (recovery.healSteps?.length) {
            // Announced live as well as written to results.json. The service
            // reports a proven fix the MOMENT it exists rather than at the end,
            // because a stopped or killed run must not lose a fix that has
            // already been verified to work.
            emit('heal', {
              index: i,
              description: redactor.redact(label),
              reason: redactor.redact(recovery.summary),
              failureStage,
              // Already a classification (ADF | REDWOOD | UNKNOWN), not a URL —
              // the live page address never goes on the wire.
              uiCode,
              action: action.name,
              model: recovery.model || null,
              steps: recovery.healSteps,
            });
            heals.push({
              index: i,
              description: redactor.redact(label),
              reason: redactor.redact(recovery.summary),
              steps: recovery.healSteps,
              failureStage,
              uiCode,
              url: livePageUrl,
              action: action.name,
              rawDescription: label,
              rawSelector: action.selector || (action.locator && action.locator.selector) || '',
              model: recovery.model || process.env.AI_RECOVERY_MODEL || 'claude-sonnet-5',
            });
          }

          // 'warn' — counted as a pass by the worker and rendered amber in the
          // PDF, so a self-heal is visible rather than hidden.
          results.push({
            index: i, action: action.name, description: redactor.redact(label), status: 'warn',
            duration: Date.now() - startedAt, timestamp: Date.now(),
            error: `Recovered by AI after: ${message}`, code,
            skipInReport: action.skipInReport,
            recovery: {
              summary: redactor.redact(recovery.summary),
              actions: recovery.actions.map((a) => redactor.redact(a)),
            },
          });
          emit('step-end', {
            index: i, status: 'warn', duration: Date.now() - startedAt,
            recovered: true, summary: redactor.redact(recovery.summary),
          });
          await captureOutputs();
          continue;
        }

        results.push({
          index: i, action: action.name, description: redactor.redact(label), status: 'failed',
          duration: Date.now() - startedAt, timestamp: Date.now(), error: message, code,
          skipInReport: action.skipInReport,
          // Read by the PDF to lead with the KIND of failure — see
          // reportGenerator's `result.errorType` handling.
          ...(errorType ? { errorType } : {}),
          // Additive. Nothing existing was renamed or removed.
          verdict: {
            category: verdict.category,
            responsibility: verdict.responsibility,
            kind: verdict.kind,
            ruleId: verdict.ruleId,
            source: verdict.source,
            confidence: verdict.confidence,
            summary: verdictSummary,
            ...(unrecoverable ? { recoverySkipped: true } : {}),
          },
          ...(recovery
            ? {
                recovery: {
                  summary: redactor.redact(recovery.summary),
                  actions: recovery.actions.map((a) => redactor.redact(a)),
                },
              }
            : {}),
        });
        emit('step-end', { index: i, status: 'failed', duration: Date.now() - startedAt, error: message });
        writeResults(results, false, `failed at step ${i + 1}`);

        fatalError = expired
          ? `Session expired at step ${i + 1} (${label}) — the page is showing the ${productName} ` +
            `sign-in screen (${page.url().slice(0, 90)}). Later steps were not attempted.`
          : `Step ${i + 1} (${label}) failed: ${message}`
            + (recovery?.attempted ? ` (AI recovery also failed: ${redactor.redact(recovery.summary)})` : '');

        if (!JOB_MODE) {
          writeResults(results, false, fatalError);
          throw err;
        }
      }

      await captureOutputs();

      // A commit may have just created the record. An operator-supplied number
      // does not stop this: the form may still be about to show an
      // application-assigned one, which outranks it.
      const alreadyGenerated = capturedTransaction?.numberSource === 'generated';
      if (
        !hasRecordedTransactionStep && !alreadyGenerated &&
        inCaptureTail(i, actions.length) && isCommitTrigger(action)
      ) {
        recordTransaction(await captureTransactionInfo(page, label.slice(0, 80), idContext, {
          surfaces: patch.transactionSurfaces(),
        }));
      }
    }

    // Timing summary. The caps above were sized from runs made by the OLD
    // engine; this is the evidence needed to size them from THIS one instead,
    // printed every run so nobody has to instrument anything to find out.
    const ran = results.filter((r) => r.status !== 'skipped');
    const totalMs = ran.reduce((a, r) => a + r.duration, 0);
    const slowest = [...ran].sort((a, b) => b.duration - a.duration).slice(0, 3);
    console.log(
      `[timing] ${ran.length} step(s) in ${(totalMs / 1000).toFixed(1)}s ` +
      `(avg ${ran.length ? Math.round(totalMs / ran.length) : 0}ms/step)` +
      (slowest.length
        ? ` | slowest: ${slowest.map((r) => `#${r.index + 1} ${(r.duration / 1000).toFixed(1)}s`).join(', ')}`
        : ''),
    );

    const success = fatalError === null;
    writeResults(results, success, fatalError);
    emit('done', { success, error: fatalError });

    if (success) {
      console.log('All actions replayed successfully!');
    } else {
      console.log(`Replay finished with failures: ${fatalError}`);
      // In job mode the worker owns pass/fail (it reads results.json), but the
      // test must still report red so Playwright's own exit code is honest.
      throw new Error(fatalError as string);
    }
  });
});
