/**
 * Action dispatch.
 *
 * The rule every handler follows: verify what the step was FOR. A launcher must
 * leave a list open, a fill must leave the committed value in the field, a Save
 * must leave no validation dialog. A click that dispatched cleanly proves
 * nothing on its own — that is how a run reports all-green while the record it
 * was meant to create never existed.
 */

import { expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { AppPatch, LogFn, NormalizedAction } from './types';
import { mustResolve, proveAbsent, resolve } from './locators';
import { norm, readValue, unresolvedParameters, valueAccepted, valueMatchesStrict } from './values';
import { waitUntil, waitForPaint } from './settle';
import { ABSENCE, PATIENCE } from './timeouts';
import { inViewport } from './patches/generic';
import type { CredentialStore } from './credentials';
import { FillNotCommittedError, TargetNotPresentError, UnresolvedParameterError } from './errors';

const T = {
  action: ABSENCE.action,
  navigate: PATIENCE.navigate,
  visibleShort: ABSENCE.visibleShort,
};

/** Roles that mean "a row in an open list", not "a control on the form". */
const SELECTION_ROLES = ['option', 'cell', 'gridcell', 'row', 'treeitem', 'listitem'];
const SELECTION_ACTIONS = ['click', 'dblclick', 'lovselect', 'selectlov', 'select'];

const nameOf = (a?: NormalizedAction | null) => String(a?.name || '').toLowerCase();

/**
 * Does this step PICK from an already-open list?
 *
 * Role-only, deliberately. Accepting a text match made every "Save and Close"
 * count as a pick, so the preceding fill skipped both its commit and its
 * verification — the exact green-but-empty failure this engine exists to stop.
 */
const isOptionPick = (a?: NormalizedAction | null) =>
  !!a &&
  SELECTION_ACTIONS.includes(nameOf(a)) &&
  SELECTION_ROLES.includes(String(a.role || '').toLowerCase());

/** The operator's own commit keystroke, recorded as its own step. */
const isCommitKeyStep = (a?: NormalizedAction | null) =>
  !!a &&
  ['press', 'keypress'].includes(nameOf(a)) &&
  /^(enter|numpadenter|tab)$/i.test(String(a.key || ''));

/** Looser than isOptionPick — only decides whether recovery is worth trying. */
const isSelectionStep = (a: NormalizedAction) =>
  SELECTION_ACTIONS.includes(nameOf(a)) &&
  (SELECTION_ROLES.includes(String(a.role || '').toLowerCase()) || !!a.accessibleName || !!a.text);

export interface ActionContext {
  page: Page;
  patch: AppPatch;
  log: LogFn;
  /** The step after this one, for the fill lookahead. */
  next: NormalizedAction | null;
  outputs: Record<string, string>;
  /**
   * Turns a step's `credentialRef` into the real value, at the moment it is
   * typed. Absent when the run supplied no credentials — a recording with no
   * login steps needs none, so this must not be required to replay one.
   */
  credentials?: CredentialStore;
  /**
   * Registers a run-time secret with the redactor. Separate from `credentials`
   * because the store's job is to produce a value and the redactor's is to hide
   * it — and a decrypted credential needs both.
   */
  redact?: (secret: string) => void;

  /**
   * Origin established by the recording's FIRST navigate step — the login
   * navigate, whose URL the queue worker re-reads from the instance record on
   * every run. See AppPatch.rewriteNavigation for why this beats `page.url()` as
   * the alignment anchor. Absent when the recording has no usable first
   * navigate, in which case the patch falls back to `currentUrl`.
   */
  sessionOrigin?: string;

  /** True only while executing the recording's first navigate step. */
  isFirstNavigate?: boolean;
}

/**
 * The origin every navigate in this run should be aligned to.
 *
 * The first navigate of the executed recording is the LOGIN navigate, and login
 * steps come from `cus_instance_login_steps` for the instance being run — they
 * are updated when an instance is repointed at a new pod. Business steps carry
 * the origin the flow was recorded against, which may be stale by months.
 *
 * An identity-provider origin is refused: IDCS is where the sign-in happens, not
 * where the application lives, so retargeting business steps into it would send
 * every later step to the login host.
 */
export const IDENTITY_HOST = /idcs-|identity\.oraclecloud\.com/i;

export function sessionOriginOf(actions: NormalizedAction[]): string | undefined {
  const first = actions.find((a) => nameOf(a) === 'navigate' && !!a.url);
  if (!first?.url) return undefined;
  try {
    const u = new URL(first.url);
    if (!/^https?:$/i.test(u.protocol)) return undefined;
    if (IDENTITY_HOST.test(u.hostname)) return undefined;
    return u.origin;
  } catch {
    return undefined;
  }
}

/** Index of the recording's first navigate step, or -1. */
export function firstNavigateIndex(actions: NormalizedAction[]): number {
  return actions.findIndex((a) => nameOf(a) === 'navigate' && !!a.url);
}

// ── wait ───────────────────────────────────────────────────────────────────

/** Nobody's recording legitimately asks the run to sit still for longer. */
const MAX_WAIT_MS = 30_000;
/** What a legacy `wait` with nothing usable in `text` has always slept for. */
const DEFAULT_WAIT_MS = 1_000;

/**
 * How long a `wait` step sleeps.
 *
 * `durationMs` is the schema v1 field and wins. `text` is the legacy overload —
 * the same field a fill's typed value lives in — and is read only as a fallback,
 * because ~779 stored recordings put the duration there and none of them are
 * being migrated.
 *
 * The two are NOT treated alike on bad input, deliberately:
 *
 *   durationMs: "soon"  → THROWS. It is a typed field whose only purpose is to
 *                         hold a number, so a non-number is a recorder defect,
 *                         and sleeping 1s instead would hide it forever.
 *   text: "soon"        → 1s, with a warning. `text` is a general-purpose field
 *                         that a legacy recording may hold anything in, and
 *                         failing runs that have worked for years over it would
 *                         be a regression, not a fix.
 */
export function waitDurationMs(a: NormalizedAction, log: LogFn = () => {}): number {
  const raw = a.durationMs;
  if (raw != null && String(raw).trim() !== '') {
    const ms = Number(raw);
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error(
        `wait step has a durationMs that is not a duration: ${JSON.stringify(raw)}. ` +
        `Refusing to guess — a wait of the wrong length is how a step runs before the ` +
        `page is ready and fails somewhere else.`,
      );
    }
    return Math.min(ms, MAX_WAIT_MS);
  }

  // Legacy path, behaviour preserved.
  if (a.text == null || String(a.text).trim() === '') return DEFAULT_WAIT_MS;
  const legacy = Number(a.text);
  if (!Number.isFinite(legacy) || legacy < 0) {
    log(`  [wait] "${String(a.text).slice(0, 40)}" is not a duration — sleeping ${DEFAULT_WAIT_MS}ms`, 'warn');
    return DEFAULT_WAIT_MS;
  }
  return Math.min(legacy, MAX_WAIT_MS);
}

/**
 * Re-run a handler from scratch when the element went out from under it.
 *
 * ADF replaces whole regions during a partial refresh. A single Playwright
 * action survives that on its own — locators re-query per call — but a HANDLER
 * spans many calls on one resolved element (doFill: click, clear, type, settle,
 * read, blur, settle, read again, across two full round trips). Worse, resolve()
 * returns `nth(idx)` from a pre-action snapshot, so after a re-render that index
 * addresses a DIFFERENT node and nothing throws at all.
 *
 * Retrying the whole handler re-resolves, which is the only thing that repairs
 * a stale index.
 */
const STALE_RE = /detached|not attached|stale element|has been removed|execution context was destroyed/i;

async function withStaleRetry<T>(
  label: string,
  ctx: ActionContext,
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (attempt >= retries || !STALE_RE.test(msg)) throw e;
      ctx.log(`  [${label}] element went stale mid-step — re-resolving (attempt ${attempt + 2})`, 'warn');
      await ctx.page.waitForTimeout(150);
    }
  }
}

// ── Recording-supplied input is untrusted ──────────────────────────────────
//
// A recording is JSON from the database. Whoever can create an execution
// controls every field in it, and the engine acts on those fields inside a
// browser that runs on the replay host, inside the customer's network. Two of
// them reach outside the page and are checked here.

/** Hosts that must never be reachable from a replayed navigation. */
const BLOCKED_HOST_RE =
  /^(?:localhost|127\.|0\.0\.0\.0|\[?::1\]?|169\.254\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|.*\.internal$|.*\.local$|metadata\.google\.internal$)/i;

/**
 * Refuse a navigation that is not to a real external web page.
 *
 * `page.goto` accepted whatever the recording said. `file:///opt/app/.env`
 * renders the file as text, and the engine screenshots every step full-page
 * into a PDF that is uploaded to S3 and downloadable — so a recording could
 * exfiltrate this service's own secrets as an image. `http://169.254.169.254/`
 * does the same for cloud instance credentials, from inside the VPC.
 *
 * Allowing only http/https and refusing loopback, link-local and RFC1918 hosts
 * removes both. Set REPLAY_ALLOW_PRIVATE_HOSTS=true for an on-premise instance
 * whose ERP genuinely lives on a private address.
 */
export function assertNavigable(rawUrl: string): void {
  let u: URL;
  try {
    u = new URL(String(rawUrl));
  } catch {
    throw new Error(`navigate has an unparseable URL: ${String(rawUrl).slice(0, 120)}`);
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(
      `navigate refused: "${u.protocol}" is not a web scheme. Only http and https are replayable — ` +
      `a file:// or data: target would render local content into the report screenshots.`,
    );
  }

  if (process.env.REPLAY_ALLOW_PRIVATE_HOSTS === 'true') return;
  if (BLOCKED_HOST_RE.test(u.hostname)) {
    throw new Error(
      `navigate refused: "${u.hostname}" is a loopback, link-local or private address. ` +
      `Set REPLAY_ALLOW_PRIVATE_HOSTS=true if this instance really is on an internal network.`,
    );
  }
}

/**
 * Confine uploads to a staging directory under the package.
 *
 * `setInputFiles` took an absolute path from the recording and checked only
 * that the file EXISTS — which is a presence test, not a permission one. A
 * recording could name this service's own .env and post it to a page it had
 * just navigated to, handing over JWT_SECRET, the database password and the AWS
 * keys in one step.
 */
const UPLOAD_ROOT = path.resolve(__dirname, '..', 'uploads', 'replay-inputs');

export function resolveUploadPath(candidate: string): string {
  const safeName = path.basename(candidate || 'upload.dat');
  const abs = path.resolve(UPLOAD_ROOT, safeName);
  if (abs !== UPLOAD_ROOT && !abs.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error(
      `upload refused: "${candidate}" resolves outside the upload staging directory. ` +
      `Stage files under uploads/replay-inputs/ and reference them by name.`,
    );
  }
  return abs;
}

// ── Handlers ───────────────────────────────────────────────────────────────

async function doNavigate(a: NormalizedAction, ctx: ActionContext) {
  if (!a.url) return;
  assertNavigable(a.url);

  // Some applications embed per-session state in the URL. The patch owns that
  // judgement — see AppPatch.rewriteNavigation — and may strip the volatile
  // parts or, for an app that cannot be entered directly, skip the step.
  const currentUrl = ctx.page.url();
  const target = ctx.patch.rewriteNavigation(a.url, currentUrl, ctx.sessionOrigin, ctx.isFirstNavigate);
  if (target === null) {
    ctx.log('  [navigate] skipped to preserve the session — waiting for the app to settle instead');
    await ctx.patch.waitForIdle(ctx.page);
    return;
  }
  if (target !== a.url) {
    ctx.log(`  [navigate] replaying URL with tokens stripped and origin aligned (${target.slice(0, 80)})`);
  }

  // Not swallowed: a green navigate makes every later step fail "not found"
  // against the wrong page, and the report then blames the locators.
  await ctx.page.goto(target, { waitUntil: 'domcontentloaded', timeout: T.navigate });
  await ctx.patch.waitForIdle(ctx.page);
}

/**
 * Refuse to type a value that still contains an unresolved `${param}`.
 *
 * Checked before the field is even touched, so the run fails naming the
 * parameter rather than the symptom. Without it the literal placeholder is
 * typed into Oracle — which the old engine did 243 times, and called 39 of
 * those runs successful.
 */
function assertResolved(a: NormalizedAction, value: string): void {
  const missing = unresolvedParameters(value);
  if (!missing.length) return;
  const field = a.accessibleName || a.description || a.selector || '(unnamed field)';
  // Typed, with the original sentence preserved verbatim.
  throw new UnresolvedParameterError(missing.join(', '), {
    field,
    count: missing.length,
    message:
      `Parameter${missing.length > 1 ? 's' : ''} ${missing.map((m) => `\${${m}}`).join(', ')} ` +
      `${missing.length > 1 ? 'were' : 'was'} never resolved for ` +
      `"${field}". ` +
      `Refusing to type the placeholder into the application.`,
  });
}

/**
 * The value this step should type, with a credential swapped in if it names one.
 *
 * The recorder masks a password at capture time, so what arrives is
 * `'********'` plus `credentialRef: 'password'` — a NAME, not a secret. Typing
 * the mask would fail at the login page and leave every later step failing
 * against the wrong page, with the report blaming the locators; that is exactly
 * the failure this engine has already been bitten by twice. So a step that
 * declares a ref either gets the real value or fails HERE, naming the reason.
 */
function valueFor(a: NormalizedAction, ctx: ActionContext): string {
  const recorded = a.text == null ? '' : String(a.text);
  if (!a.credentialRef) return recorded;

  if (!ctx.credentials) {
    throw new Error(
      `"${a.accessibleName || a.description || a.selector}" needs credential ` +
      `"${a.credentialRef}", but this run was given none. Supply CREDENTIALS_JSON ` +
      `(or CREDENTIAL_${String(a.credentialRef).toUpperCase()}) and CREDENTIAL_KEY.`,
    );
  }
  // CredentialError already reads as an explanation; let it through as-is.
  const secret = ctx.credentials.resolve(a.credentialRef);
  // Tell the redactor BEFORE the value can reach a log line. It scans the
  // recording, where this value never appears, so without this the one string
  // most worth masking is the one it does not know about.
  ctx.redact?.(secret);
  return secret;
}

/**
 * The recorded post-commit value, or undefined when it can no longer be trusted.
 *
 * `committedValue` is what the field read after the OPERATOR committed it during
 * recording. It is the best expectation available — a widget reformats on
 * commit, and this is the only record of what that reformat looks like — but it
 * describes the value that was recorded, not the value this run is asked to
 * enter.
 *
 * When a parameter is re-bound for a new execution (`value` edited away from
 * `originalValue`), `committedValue` still holds the OLD commit and becomes
 * actively harmful in two ways:
 *
 *   - the "already correct" pre-check matches a field still holding the old
 *     value, so the fill is SKIPPED and the new value is never typed;
 *   - the post-fill check accepts the old value as a pass.
 *
 * Both report success while writing the wrong data, which is worse than failing.
 * So a re-parameterized step is verified against what it was told to type, and
 * nothing else.
 */
function trustedCommittedValue(a: NormalizedAction): string | undefined {
  const original = a.originalValue;
  if (typeof original !== 'string') return a.committedValue;
  const reparameterized = original.trim() !== String(a.text ?? '').trim();
  return reparameterized ? undefined : a.committedValue;
}

async function doFill(a: NormalizedAction, ctx: ActionContext) {
  const { page, patch, log } = ctx;
  const committed = trustedCommittedValue(a);
  const value = valueFor(a, ctx);
  assertResolved(a, value);
  const el = await mustResolve(page, a, patch, 'fill', log);

  const isFileInput = await el.evaluate((n: any) => {
    return n instanceof HTMLInputElement && (n.type || '').toLowerCase() === 'file';
  }).catch(() => false);

  if (isFileInput) {
    log('  [fill] target is <input type="file"> — delegating to setInputFiles');
    const safeName = path.basename(value || 'upload.dat');
    return await doSetInputFiles({ ...a, files: [safeName] }, ctx);
  }

  // Already correct — leave it alone.
  //
  // Oracle defaults Business Unit, Legal Entity, Currency and Transaction Date
  // from the user's profile or from a preceding LOV pick, so the recorded fill
  // frequently arrives at a field that already holds the right value. Retyping
  // is not neutral: it reopens a resolved LOV's list, and on a date field it
  // re-converts an already-converted value.
  if (value) {
    const existing = await readValue(el);
    // STRICT here. valueAccepted tolerates a value the widget RESOLVED from
    // what we typed — but nothing has been typed yet, so that tolerance only
    // serves to accept a wrong default: a line Amount defaulted to 1000.00
    // "contains" a recorded 100, so the fill would be skipped and the invoice
    // created for ten times the amount, reporting green.
    // Only compare against expectations that actually exist; an absent
    // committedValue must not be read as "expects empty".
    const expectations = [value, committed].filter((v): v is string => !!v);
    if (expectations.some((e) => valueMatchesStrict(existing, e))) {
      log(`  [fill] already "${String(existing).slice(0, 60)}" — leaving it`);
      return;
    }
  }

  // ADF soft-disables a dependent field until the field it depends on commits
  // (Tax Registration Number stays disabled until Tax Country lands). That is
  // invisible to Playwright, so without this the keystrokes are swallowed and
  // the blank-field guard fails the step a second or two before the partial
  // refresh would have enabled it.
  if (await patch.fieldDisabled(el)) {
    log('  [fill] field is disabled — waiting for the refresh that enables it', 'warn');
    const enabled = await waitUntil(page, async () => !(await patch.fieldDisabled(el)), {
      maxMs: 8_000,
      pollMs: 250,
    });
    if (!enabled) {
      throw new Error(
        `"${a.accessibleName || a.description || a.selector}" is still disabled or read-only ` +
        `8s on — the value it depends on did not commit.`,
      );
    }
  }

  await el.click({ timeout: ABSENCE.bestEffort }).catch(() => {});
  await el.fill('', { timeout: ABSENCE.bestEffort }).catch(() => {});
  // Character by character so autosuggest filters — a bulk fill() sets the
  // value in one event and many ADF widgets never open their list.
  await el.pressSequentially(value, { delay: 30, timeout: T.action });

  // Settle BEFORE anything commits, ours or the recording's next step:
  // committing inside the debounce hands the widget an unresolved term, which
  // is exactly when an LOV opens Search-and-Select instead of accepting.
  await patch.settleAutosuggest(page);

  // ALWAYS confirm the keystrokes actually landed, even when the next step is
  // the one that commits.
  //
  // This is the "Enter on a blank field" bug. Handing off to the next step
  // without checking meant that when ADF was not ready and swallowed the
  // keystrokes, the fill still reported success, and the NEXT step pressed
  // Enter on an empty Transaction Source / Transaction Type — which Oracle
  // answered with a validation error attributed to the wrong step. The run then
  // carried on, and because the fill had "passed", AI recovery was never
  // offered the step that was actually broken.
  //
  // Failing here instead means the failure is attributed to the fill, recovery
  // fires on the field that is actually empty, and nothing commits a blank.
  const landed = await readValue(el);
  if (value && !String(landed).trim()) {
    const field = a.accessibleName || a.description || a.selector || '(unnamed field)';
    throw new FillNotCommittedError(field, value, '', {
      message:
        `Nothing was entered into "${field}" — ` +
        `the field is still empty after typing "${value}". ` +
        `Stopping rather than letting the next step commit a blank value.`,
    });
  }

  // The recording commits this field itself — an option pick or the operator's
  // own keystroke. Adding our own on top is what turned a fill into a search.
  if (isOptionPick(ctx.next) || isCommitKeyStep(ctx.next)) {
    // Non-empty but not what was typed is worth saying out loud — it is how a
    // half-eaten value ("1" for "100") reaches the commit — but it is not
    // grounds to fail, because a widget may legitimately reformat as you type.
    if (value && !valueAccepted(landed, value)) {
      log(`  [fill] field reads "${String(landed).slice(0, 60)}" after typing "${value}"`, 'warn');
    }
    log(`  [fill] "${value}" typed — next step commits it`);
    return;
  }

  // blur(), not a keystroke. Typing alone leaves the model empty (it only reads
  // the field on `change`), but Tab opens the LOV search and Enter fires the
  // form default. Blur raises the same `change` with neither, and mirrors the
  // click-away the operator actually performed.
  await el.evaluate((n: any) => n.blur()).catch(() => {});
  await patch.waitForIdle(page);

  let actual = await readValue(el);
  if (!valueAccepted(actual, value, committed)) {
    // An LOV that did not resolve on blur still answers to Tab — its own hint
    // reads "Autocompletes on TAB". One retry beats failing a good fill.
    await el.press('Tab', { timeout: T.action }).catch(() => {});
    await patch.waitForIdle(page);
    actual = await readValue(el);
  }
  if (!valueAccepted(actual, value, committed)) {
    throw new FillNotCommittedError(
      a.accessibleName || a.description || a.selector || '(unnamed field)',
      String(committed || value),
      String(actual),
      {
        message:
          `Value mismatch after fill: expected "${String(committed || value).slice(0, 80)}", ` +
          `got "${String(actual).slice(0, 80)}"`,
      },
    );
  }
  log(`  [fill] "${value}" → "${actual}"`);
}

async function doClick(a: NormalizedAction, ctx: ActionContext, isDouble = false) {
  const { page, patch, log } = ctx;
  const launcher = patch.isListLauncher(a);
  const hit = (target: any, opts: any) => (isDouble ? target.dblclick(opts) : target.click(opts));

  let el = await resolve(page, a, patch, { log: (m) => log(`  [click] ${m}`) });

  if (!el) {
    // A row that is not in the DOM because the list only rendered the first ~25
    // of 253. Filtering the open dialog is how the field is meant to be used,
    // and it also closes the modal — left open, it blocks every later step.
    const wanted = a.accessibleName || a.text || '';
    if (isSelectionStep(a)) {
      if (await patch.selectFromOpenList(page, wanted, log)) return;
      // The pick failed and the dialog is MODAL. Left open it blocks every
      // remaining step, so the report would blame whichever step ran next
      // rather than this one.
      await patch.dismissOpenList(page, log).catch(() => {});
    }
    // Same distinction mustResolve() draws, and for the same reason: a click
    // target that matches NOTHING in the document is a provisioning gap, not a
    // selector fault. Costs milliseconds and only runs on the failure path.
    const target = a.accessibleName || a.description || a.selector || '(no locator)';
    const { absent, searched } = await proveAbsent(page, a, patch, (m) => log(`  [click] ${m}`));
    if (absent) {
      const err: any = new TargetNotPresentError(target, {
        searched,
        scope: a.selector || '',
        message:
          `"${target}" is NOT PRESENT ON THIS INSTANCE. After the full locate budget ` +
          `every one of the ${searched} candidate locator(s) matched nothing in the ` +
          `document — not hidden, not off-screen, absent — so this is not a timeout ` +
          `and not a stale selector: the feature the script needs is not provisioned ` +
          `on this environment, or the signed-in user has no access to it.`,
      });
      err.failureStage = 'ABSENT';
      throw err;
    }
    throw new Error(`click target not found: ${a.selector || a.accessibleName || '(no locator)'}`);
  }

  // Sampled immediately before the click — taken earlier, a leftover
  // autosuggest could close in between and read as "did not open".
  const baseline = launcher ? await patch.countListSurfaces(page) : 0;

  const button = (a.button as 'left' | 'right' | 'middle') ?? 'left';
  const clickCount = a.clickCount ?? 1;

  // A checkbox recorded as a click is a request for it to end up TICKED, not
  // for it to be toggled. Replaying a plain click against a box some other step
  // (or an Oracle default) already ticked would silently clear it — a recording
  // that "passed" while turning the setting off. Only for a single left click:
  // a right-click or double-click on a checkbox means something else.
  if (button === 'left' && clickCount === 1 && !isDouble) {
    const already = await el
      .evaluate((n: any) => {
        const t = String(n.type || '').toLowerCase();
        if (n.tagName !== 'INPUT' || (t !== 'checkbox' && t !== 'radio')) return null;
        return Boolean(n.checked);
      })
      .catch(() => null);

    if (already === true) {
      log('  [click] checkbox is already ticked — leaving it');
      await patch.waitForIdle(page);
      return;
    }
    if (already === false) {
      // check() verifies the resulting state instead of trusting the click,
      // which is the whole point on a control whose click can be swallowed.
      await el.check({ timeout: T.action });
      log('  [click] ticked checkbox');
      await patch.waitForIdle(page);
      return;
    }
  }

  const isFileInput = await el
    .evaluate((n: any) => n instanceof HTMLInputElement && (n.type || '').toLowerCase() === 'file')
    .catch(() => false);

  if (isFileInput) {
    log('  [click] target is <input type="file"> — skipping click to avoid blocking file dialog');
    await patch.waitForIdle(page);
    return;
  }

  // Plain click first — its actionability checks ARE the verification. Force is
  // the fallback, never the opening move: it skips those checks, which turns
  // "did not work" into "reported success".
  const isCommit = patch.isCommitStep(a);
  try {
    await hit(el, { button, clickCount, timeout: T.action });
  } catch (e: any) {
    const why = String(e.message).split('\n')[0].slice(0, 80);
    // NEVER force a commit. force:true skips actionability but still dispatches
    // at those coordinates, so a Save behind a leftover modal or glass pane is
    // "clicked" while the overlay swallows it — the handler never runs, no
    // validation dialog appears, and the engine prints [commit] accepted for a
    // record that was never submitted.
    if (isCommit) {
      const err: any = new Error(`Commit "${a.accessibleName || a.description}" was not clickable: ${why}`);
      err.failureStage = 'COMMIT';
      throw err;
    }
    // An element that RESOLVED but is outside the viewport is a different
    // failure from "not actionable", and forcing does not fix it: force skips
    // the actionability checks but still dispatches at a point, and a point
    // outside the window is refused just the same. It needs the element brought
    // into view.
    //
    // Scrolling is the whole of the remedy here, and it is true of every web
    // page, so it needs no application knowledge. An element parked in a strip
    // the scrollbar cannot reach used to be handled from here too, by asking the
    // patch to drive the app's paging controls — but only AFTER a click had
    // already failed, which meant it could correct a recording that paged too
    // little and never one that paged too much. That is now handled BEFORE the
    // paging steps run, in engine/relative-nav.ts.
    //
    // Reported as revealed only if the element ENDED UP in the viewport:
    // `scrollIntoViewIfNeeded` resolves happily inside a container that cannot
    // scroll, and retrying on that guarantees the identical failure.
    let revealed = false;
    if (/outside of the viewport/i.test(String(e.message))) {
      log('  [click] target is outside the viewport — scrolling to it', 'warn');
      await el.scrollIntoViewIfNeeded({ timeout: T.visibleShort }).catch(() => {});
      if (await inViewport(el)) {
        revealed = await hit(el, { button, clickCount, timeout: T.action }).then(() => true, () => false);
        log(revealed ? '  [click] revealed and clicked' : '  [click] revealed but still not clickable', revealed ? 'info' : 'warn');
      }
    }

    if (!revealed) {
      log(`  [click] not actionable (${why.slice(0, 60)}) — forcing`, 'warn');
      await hit(el, { button, clickCount, force: true, timeout: T.action });
    }
  }
  await patch.waitForIdle(page);

  // Returns immediately when the page already has content, so a click that
  // opens a menu costs nothing here; only a real navigation waits.
  if (!(await waitForPaint(page))) {
    log(`  [click] page still blank after "${a.description || a.accessibleName || a.selector}" — continuing`);
  }

  // Opening the list is the only thing a launcher click does.
  if (launcher && !(await patch.listOpened(page, baseline))) {
    const fallback = patch.fieldOfLauncher(a);
    if (fallback) {
      log('  [click] trigger opened nothing — clicking the field itself', 'warn');
      const alt = await resolve(page, { ...a, selector: fallback, role: 'combobox' }, patch, {
        timeout: T.visibleShort,
      });
      if (alt) {
        await alt.click({ timeout: T.action }).catch(() => {});
        await patch.waitForIdle(page);
      }
    }
    if (!(await patch.listOpened(page, baseline, true))) {
      const err: any = new Error(`List did not open for "${a.accessibleName || a.description || 'trigger'}"`);
      err.failureStage = 'OPEN';
      throw err;
    }
  }

  if (isCommit) {
    const errors = await patch.collectCommitErrors(page);
    if (errors.length) {
      // The messages ride ON the error, not only inside its text. main.ts needs
      // them as an array to name the KIND of rejection ("Duplicate Data") and to
      // skip AI recovery — the application refused the data, which no amount of
      // selector-hunting fixes. Re-parsing them back out of a truncated,
      // comma-joined sentence would be lossy.
      const err: any = new Error(
        `Save rejected — ${errors.length} validation error(s): ${errors.join(', ').slice(0, 300)}`,
      );
      err.commitRejected = true;
      err.commitErrors = errors;
      throw err;
    }
    log(`  [commit] "${a.accessibleName || a.description}" accepted`);
  }
}

/**
 * Typed list selection recorded as a single step: the locator describes the
 * FIELD and the value is the row to choose. The options do not exist in the
 * page until something is typed, so the sequence is focus → type → wait → pick.
 *
 * The split of responsibility here is the point. The PATCH owns how the widget
 * behaves — which search terms to try, which ARIA roles the rows carry, what
 * commits a typed value. The ENGINE owns what counts as PROOF that a selection
 * took, because that is the safety-critical half and it is identical for every
 * application. Moving the evidence rules into a patch would mean re-deriving
 * them, and getting them wrong, once per vendor.
 */
async function doLovSelect(a: NormalizedAction, ctx: ActionContext) {
  const { page, patch, log } = ctx;
  const wanted = String(a.text || '').trim();
  if (!wanted) {
    const err: any = new Error('lovSelect step has no value to select');
    err.failureStage = 'INPUT';
    throw err;
  }
  assertResolved(a, wanted);

  const container = await mustResolve(page, a, patch, 'lov', log);

  // The recorded locator may be the wrapper or the input itself.
  let input = container;
  const tag = await container.evaluate((el: any) => el.tagName.toLowerCase()).catch(() => '');
  if (tag !== 'input' && tag !== 'textarea') {
    const inner = container.locator('input').filter({ visible: true }).first();
    if (await inner.count().catch(() => 0)) input = inner;
  }

  // How to narrow the search is the application's business, not the engine's.
  const probes = patch.lovProbes(wanted);

  // Surfaces already open before we touch anything, so "a list is still open"
  // afterwards means OURS is open, not that the page always had one.
  const surfaceBaseline = await patch.countListSurfaces(page);

  for (const probe of probes) {
    try {
      await input.click({ timeout: ABSENCE.bestEffort }).catch(() => {});
      await input.fill('', { timeout: ABSENCE.bestEffort }).catch(() => {});
      await input.pressSequentially(probe, { delay: 30, timeout: T.action });
    } catch (err: any) {
      if (!err.failureStage) err.failureStage = 'INPUT';
      throw err;
    }
    await patch.settleAutosuggest(page);

    let picked = false;
    try {
      picked = await patch.pickListRow(page, wanted, log);
    } catch (err: any) {
      if (!err.failureStage) err.failureStage = 'OPEN';
      throw err;
    }
    if (!picked) {
      try {
        await patch.commitTypedValue(page, input);
      } catch (err: any) {
        if (!err.failureStage) err.failureStage = 'COMMIT';
        throw err;
      }
    }

    // Selection has to be PROVEN, and "the field still holds what I typed" does
    // not prove it — that is true by construction unless the widget erased it.
    // Comparing against `probe` was therefore self-fulfilling: a pick that
    // matched nothing, resolved nothing and left the raw search term in the
    // field reported success, and the record was saved with no value.
    //
    // Two pieces of evidence, both required:
    //   - the field holds the value we were asked for, not the term we typed
    //   - our list is closed; a list still open means nothing was chosen
    const actual = await readValue(input);
    const listStillOpen = (await patch.countListSurfaces(page)) > surfaceBaseline;
    const holdsWanted = valueAccepted(actual, wanted) && !!String(actual).trim();

    // The hard case: when the probe IS the wanted value, "the field holds the
    // wanted value" is satisfied by our own typing and proves nothing. So
    // something must have happened beyond typing — either a row was clicked, or
    // the widget rewrote the value while resolving it.
    const somethingResolvedIt = picked || norm(actual) !== norm(probe);

    if (holdsWanted && !listStillOpen && somethingResolvedIt) {
      log(`  [lov] "${a.description || a.selector}" → "${actual}"`);
      return;
    }
    if (holdsWanted && listStillOpen) {
      log(`  [lov] "${actual}" is in the field but the list is still open — not treating that as a pick`, 'warn');
    }
  }

  // Leave nothing modal behind: an unclosed Search-and-Select blocks every
  // later step and the report would blame whichever ran next.
  await patch.dismissOpenList(page, log).catch(() => {});
  const finalValue = await readValue(input);
  const err: any = new Error(
    `lovSelect could not select "${wanted}" — field reads "${finalValue}" after trying: ${probes.join(' | ')}`,
  );
  err.failureStage = 'VERIFY';
  throw err;
}

async function doPress(a: NormalizedAction, ctx: ActionContext) {
  const { page, patch, log } = ctx;
  const key = a.key || 'Tab';
  const el = a.selector
    ? await resolve(page, a, patch, { timeout: T.visibleShort }).catch(() => null)
    : null;
  if (el) await el.press(key, { timeout: T.action });
  else await page.keyboard.press(key);
  await patch.waitForIdle(page);
  log(`  [press] ${key}`);
}

async function doSelectOption(a: NormalizedAction, ctx: ActionContext) {
  const { page, patch, log } = ctx;
  const el = await mustResolve(page, a, patch, 'select', log);
  const value = a.text == null ? '' : String(a.text);
  assertResolved(a, value);
  // Label, then value, then the recorded position. The index is the last resort
  // precisely because it is positional — but a renamed or re-translated option
  // still sits where the operator found it, and the recorder stored that.
  // Short timeouts on the speculative attempts. mustResolve has already waited
  // for the <select> itself, so its options are present — a miss here means the
  // option is not there, not that it is slow to arrive, and paying the full
  // action timeout twice before reaching the index fallback cost 30s a step.
  const probe = { timeout: ABSENCE.selectProbe };
  try {
    await el.selectOption({ label: value }, probe);
  } catch (_) {
    try {
      await el.selectOption(value, probe);
    } catch (e) {
      const idx = Number(a.optionIndex);
      if (!Number.isFinite(idx)) throw e;

      // The index is a fallback for a RENAMED option, never for a DIFFERENT
      // one. Parameterization rewrites the value a step commits but preserves
      // optionIndex, leaving a step that says "select Credit memo, else take
      // option 2" while option 2 is still Debit memo. ADF also renumbers
      // options per session and again when a dependent field filters the list.
      //
      // Taking the index there does not fail — it SUCCEEDS on the wrong option,
      // and nothing downstream can tell. Refusing is the safe direction: the
      // step fails with the label that was actually asked for.
      if (a.originalValue != null && String(a.originalValue).trim() !== value) {
        log(
          `  [select] ignoring recorded index ${idx} — the value was changed from ` +
          `"${a.originalValue}" to "${value}" after recording, so the index no longer names it`,
          'warn',
        );
        throw e;
      }

      log(`  [select] "${value}" did not match — falling back to recorded index ${idx}`, 'warn');
      await el.selectOption({ index: idx }, { timeout: T.action });
    }
  }
  await patch.waitForIdle(page);
  const chosen = await readValue(el);
  log(`  [select] "${value}" → "${String(chosen).slice(0, 60)}"`);
}

async function doCheck(a: NormalizedAction, ctx: ActionContext) {
  const { page, patch, log } = ctx;
  const el = await mustResolve(page, a, patch, 'check', log);
  const uncheck = nameOf(a) === 'uncheck';
  await (uncheck ? el.uncheck({ timeout: T.action }) : el.check({ timeout: T.action }));
  await patch.waitForIdle(page);
  log(`  [check] ${uncheck ? 'unchecked' : 'checked'}`);
}

async function doHover(a: NormalizedAction, ctx: ActionContext) {
  const el = await mustResolve(ctx.page, a, ctx.patch, 'hover', ctx.log);
  await el.hover({ timeout: T.action });
  await ctx.patch.waitForIdle(ctx.page);
}

async function doScroll(a: NormalizedAction, ctx: ActionContext) {
  const dx = Number(a.deltaX || 0);
  const dy = Number(a.deltaY || 0);
  await ctx.page.mouse.wheel(dx, dy).catch(() => {});
  await ctx.patch.waitForIdle(ctx.page);
  ctx.log(`  [scroll] ${dx},${dy}`);
}

/**
 * Read a value off the page — the identifier the application just assigned —
 * and keep it, so a dependent script can bind a parameter to it.
 */
async function doCopy(a: NormalizedAction, ctx: ActionContext, index: number) {
  const { page, patch, log } = ctx;
  // Not mustResolve: a copy with nothing on screen falls back to the recorded
  // value rather than failing the step.
  const el = await resolve(page, a, patch, { timeout: T.visibleShort, log: (m) => log(`  [copy] ${m}`) });
  const value = el ? await readValue(el) : '';
  // outputName is the key script_outputs and every param_binding uses, so it
  // wins. The recorder's parent label is the next best thing — a copy step's
  // own description is often just "Copy value".
  const name = String(
    a.outputName || a.locator?.parent?.name || a.locator?.label || a.description || `output_${index}`,
  ).trim();
  // Deliberately NOT falling back to the value captured at RECORDING time. A
  // copy step is how THIS run's newly-assigned identifier reaches
  // captured_outputs and then a dependent script's param_bindings. Substituting
  // the previous run's identifier does not degrade gracefully — it points the
  // next script at a real but WRONG business record and edits it, every step
  // green. A false red is enormously cheaper.
  if (!value.trim()) {
    throw new Error(
      `Nothing to copy for "${name}" — the value is not on the page. Refusing to fall ` +
      `back to the recording-time value, which would bind a dependent script to the wrong record.`,
    );
  }
  ctx.outputs[name] = value.trim();
  log(`  [copy] ${name} = "${value.trim()}"`);
}

// ── Assertions ─────────────────────────────────────────────────────────────
//
// The recorder emits these when the operator explicitly asks for a check
// (assertVisible / assertText / assertValue / assertChecked / assertSnapshot).
// They are the only steps in a recording that state a business expectation
// rather than an interaction, so they fail the run when they do not hold —
// that is the entire reason the operator recorded them.

const normWs = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();

async function doAssertVisible(a: NormalizedAction, ctx: ActionContext) {
  await mustResolve(ctx.page, a, ctx.patch, 'assertVisible', ctx.log);
  ctx.log(`  [assert] visible: ${a.accessibleName || a.selector}`);
}

async function doAssertText(a: NormalizedAction, ctx: ActionContext) {
  const el = await mustResolve(ctx.page, a, ctx.patch, 'assertText', ctx.log);
  const expected = normWs(a.text);
  let actual = '';
  // Substring, whitespace-normalised — the recorder asserts the same way.
  // Case-insensitive on top of that, because Oracle's label casing varies
  // between releases and translations and a case flip is never the defect the
  // operator meant to catch. Polled via expect.poll to accommodate late-rendering ADF text natively.
  //
  // `intervals` is a single entry on purpose. Playwright repeats the LAST entry
  // until the timeout, so a ramp like [50, 100, 250] is not a ramp — it is a
  // 250ms polling grain over the whole 15s window, and a late assertion is then
  // detected up to 250ms after it becomes true. 50ms flat, as the waitUntil this
  // replaced did. The same reasoning applies to the two assertions below.
  try {
    await expect.poll(async () => {
      actual = normWs(await el.innerText().catch(() => ''));
      return actual.toLowerCase().includes(expected.toLowerCase());
    }, { timeout: T.action, intervals: [50] }).toBe(true);
  } catch {
    throw new Error(`Assertion failed: expected text "${expected.slice(0, 80)}", element reads "${actual.slice(0, 120)}"`);
  }
  ctx.log(`  [assert] text contains "${expected.slice(0, 60)}"`);
}

async function doAssertValue(a: NormalizedAction, ctx: ActionContext) {
  const el = await mustResolve(ctx.page, a, ctx.patch, 'assertValue', ctx.log);
  const expected = normWs(a.text);
  let actual: string | null = null;
  // STRICT. This is the operator's own stated expectation and the last line of
  // defence for "green means the record is correct" — it must not inherit the
  // LOV-resolution tolerance, under which asserting "100" passes against a
  // field holding 1000.00. Polled via expect.poll so asynchronous value binding resolves cleanly.
  try {
    await expect.poll(async () => {
      actual = await readValue(el);
      return valueMatchesStrict(actual, expected);
    }, { timeout: T.action, intervals: [50] }).toBe(true);
  } catch {
    throw new Error(`Assertion failed: expected value "${expected.slice(0, 80)}", field holds "${String(actual).slice(0, 120)}"`);
  }
  ctx.log(`  [assert] value "${String(actual).slice(0, 60)}"`);
}

async function doAssertChecked(a: NormalizedAction, ctx: ActionContext) {
  const el = await mustResolve(ctx.page, a, ctx.patch, 'assertChecked', ctx.log);
  const want = a.checked !== false; // the recorder writes `checked: false` for unchecked
  let actual: boolean | null = null;
  try {
    await expect.poll(async () => {
      actual = await el.isChecked().catch(() => null);
      return actual === want;
    }, { timeout: T.action, intervals: [50] }).toBe(true);
  } catch {
    if (actual === null) throw new Error('Assertion failed: element has no checked state');
    throw new Error(`Assertion failed: expected ${want ? 'checked' : 'unchecked'}, element is ${actual ? 'checked' : 'unchecked'}`);
  }
  ctx.log(`  [assert] ${want ? 'checked' : 'unchecked'}`);
}

/**
 * An aria snapshot of an ADF page drifts constantly — row counts, generated
 * ids, injected status text — so enforcing one by default would fail runs for
 * reasons that have nothing to do with the business flow.
 *
 * Recorded as SKIPPED rather than success, so the report says plainly that the
 * check did not run instead of implying it passed. Set ASSERT_SNAPSHOTS=true to
 * enforce it.
 */
async function doAssertSnapshot(a: NormalizedAction, ctx: ActionContext): Promise<'skipped' | void> {
  if (process.env.ASSERT_SNAPSHOTS !== 'true') {
    ctx.log('  [assert] snapshot check skipped (set ASSERT_SNAPSHOTS=true to enforce)', 'warn');
    return 'skipped';
  }
  const el = await mustResolve(ctx.page, a, ctx.patch, 'assertSnapshot', ctx.log);
  await expect(el).toMatchAriaSnapshot(String(a.snapshot ?? ''), { timeout: T.action });
  ctx.log('  [assert] snapshot matched');
}

/**
 * File upload. Not skippable — a recording that uploads a document and then
 * saves produces a different record without it, so a missing file has to stop
 * the run rather than quietly continue.
 */
async function doSetInputFiles(a: NormalizedAction, ctx: ActionContext) {
  const rawFiles = (a.files && a.files.length ? a.files : (a.text || a.value ? [a.text || a.value] : [])).map((f) => String(f));
  if (!rawFiles.length) throw new Error('setInputFiles step has no files');

  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }

  const files: string[] = [];
  for (const raw of rawFiles) {
    const safeName = path.basename(raw || 'upload.dat');
    const abs = path.resolve(UPLOAD_ROOT, safeName);
    if (!fs.existsSync(abs)) {
      ctx.log(`  [upload] auto-staging sample upload file: ${safeName}`, 'warn');
      fs.writeFileSync(abs, `FlowTrace automated upload fixture: ${safeName}\n`);
    }
    files.push(abs);
  }

  const el = await mustResolve(ctx.page, a, ctx.patch, 'upload', ctx.log);
  await el.setInputFiles(files, { timeout: T.action });
  await ctx.patch.waitForIdle(ctx.page);
  ctx.log(`  [upload] ${files.length} file(s) set: ${files.map((f) => path.basename(f)).join(', ')}`);
}

/**
 * Independently confirm a step the AI says it recovered.
 *
 * `recovered: true` is the model's own self-report, and a `warn` row counts as a
 * pass all the way through to the PDF — so without this, one confident tool call
 * converts a red run into a green one with nothing checking the page.
 *
 * Deliberately re-checks only the OUTCOME, never re-performing the action:
 * re-running a fill that already succeeded would retype into a resolved LOV.
 * Returns null when there is nothing meaningful to re-check.
 */
export async function verifyRecovered(
  action: NormalizedAction,
  ctx: ActionContext,
): Promise<string | null> {
  const { page, patch, log } = ctx;
  const kind = nameOf(action);

  try {
    if (['fill', 'type', 'lovselect', 'selectlov', 'selectoption', 'assertvalue'].includes(kind)) {
      const want = action.committedValue || action.text || '';
      if (!want) return null;
      const el = await resolve(page, action, patch, { timeout: T.visibleShort });
      if (!el) return `the field could not be found again after recovery`;
      const actual = await readValue(el);
      if (!valueAccepted(actual, action.text || '', action.committedValue)) {
        return `the field holds "${String(actual).slice(0, 60)}", not "${String(want).slice(0, 60)}"`;
      }
      log(`  [verify] recovery confirmed: field holds "${String(actual).slice(0, 60)}"`);
      return null;
    }

    if (kind === 'click' && patch.isCommitStep(action)) {
      const errors = await patch.collectCommitErrors(page);
      if (errors.length) return `the commit is still refused: ${errors.join(', ').slice(0, 160)}`;
      log('  [verify] recovery confirmed: the commit was accepted');
      return null;
    }
  } catch (e: any) {
    return `re-verification could not run: ${String(e?.message || e).split('\n')[0]}`;
  }
  return null;
}

// ── Dispatch ───────────────────────────────────────────────────────────────

export async function executeAction(
  action: NormalizedAction,
  ctx: ActionContext,
  index: number,
): Promise<'skipped' | void> {
  switch (nameOf(action)) {
    case 'navigate': case 'openpage': case 'goto':
      return await doNavigate(action, ctx);

    case 'fill': case 'type':
      return await withStaleRetry('fill', ctx, () => doFill(action, ctx));

    case 'click': case 'mouseup':
      return await doClick(action, ctx, false);

    case 'dblclick':
      return await doClick(action, ctx, true);

    case 'lovselect': case 'selectlov':
      return await withStaleRetry('lov', ctx, () => doLovSelect(action, ctx));

    // `select` is a RETIRED verb, and what it means depends on the schema —
    // which is why this branches instead of just picking one.
    //
    // LEGACY (bare array, ~779 recordings): `select` is a row pick from an
    // ALREADY-OPEN Oracle LOV popup, which is a click. Those recordings were
    // authored against that meaning and are not being migrated, so it is
    // preserved exactly — routing them to doSelectOption instead would open a
    // dropdown that is not a <select> and choose nothing, green.
    //
    // V1: `select` is not a verb. v1 draws the line explicitly — `selectOption`
    // is a real HTML <select>, `lovSelect` is a row pick — so there is nothing
    // left for `select` to mean, and guessing between two behaviours that act on
    // different widgets is exactly the ambiguity v1 exists to remove.
    case 'select':
      if (action.schemaVersion == null) return await doClick(action, ctx, false);
      throw new Error(
        `"select" is not a schema v1 action (step ${index + 1}). v1 distinguishes them: ` +
        `use "selectOption" for a real <select> element, or "lovSelect" to pick a row from a ` +
        `list of values. Refusing to guess which one this step meant.`,
      );

    case 'press': case 'keypress':
      return await doPress(action, ctx);

    case 'selectoption':
      return await withStaleRetry('select', ctx, () => doSelectOption(action, ctx));

    case 'check': case 'uncheck':
      return await withStaleRetry('check', ctx, () => doCheck(action, ctx));

    case 'hover':
      return await doHover(action, ctx);

    case 'scroll':
      return await doScroll(action, ctx);

    case 'copy': case 'capture':
      return await doCopy(action, ctx, index);

    case 'setinputfiles':
      return await doSetInputFiles(action, ctx);

    // Operator-recorded verifications.
    case 'assertvisible':
      return await doAssertVisible(action, ctx);
    case 'asserttext':
      return await doAssertText(action, ctx);
    case 'assertvalue':
      return await doAssertValue(action, ctx);
    case 'assertchecked':
      return await doAssertChecked(action, ctx);
    case 'assertsnapshot':
      return await doAssertSnapshot(action, ctx);

    case 'wait': {
      const ms = waitDurationMs(action, ctx.log);
      ctx.log(`  [wait] ${ms}ms`);
      await ctx.page.waitForTimeout(ms);
      return;
    }

    // The paired mouseup performs the click; the runner takes its own shots.
    case 'mousedown':
    case 'screenshot':
      return 'skipped';

    // Recorder bookkeeping, not flow. `closePage` is the codegen teardown —
    // running it would kill the session and fail every step after it, which is
    // exactly the "browser closed" cascade the old engine had to special-case.
    case 'closepage':
    case 'pause':
      ctx.log(`  [${nameOf(action)}] recorder bookkeeping — skipped`);
      return 'skipped';

    default:
      // Never silently pass. An unhandled action used to be logged and recorded
      // as SUCCESS, so a recording could "pass" without doing its work.
      throw new Error(
        `Unsupported action "${action.name}" at step ${index + 1}. Handled: navigate, fill, ` +
        `click, dblclick, lovSelect, press, selectOption, check, uncheck, hover, scroll, copy, wait.`,
      );
  }
}
