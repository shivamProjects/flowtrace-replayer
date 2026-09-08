/**
 * Engine contracts.
 *
 * The split this file exists to enforce: `engine/` knows about Playwright and
 * about recordings; it knows nothing about Oracle. Everything vendor-specific
 * lives behind `AppPatch`, so supporting a second ERP means adding one file
 * under `patches/` and registering it — not editing the replayer.
 */

import type { FrameLocator, Locator, Page } from '@playwright/test';

/**
 * Anything a locator can be built against.
 *
 * `Page` and `FrameLocator` share the whole builder surface the engine uses —
 * locator, getByRole, getByLabel, getByPlaceholder, getByText, getByTestId — so
 * every candidate in `locators.ts` is constructed against one of these without
 * caring which. That is what lets a step recorded inside an iframe resolve
 * through exactly the same ladder as a top-frame step.
 */
export type LocatorScope = Page | FrameLocator;

/**
 * The document a step was recorded against.
 *
 * Two generations of this field exist and they mean different things:
 *
 *   schema v1  `{ url, name }`            — one iframe, addressable. RESOLVED.
 *   codegen    `{ pageAlias, framePath }` — a path through nested frames, or a
 *                                           second browser page. STILL REFUSED
 *                                           (see `assertReplayable`), because
 *                                           routing to a second page is a
 *                                           different problem from routing to a
 *                                           frame and the engine owns one page.
 */
export interface RecordedFrame {
  /** URL of the frame's document at recording time. */
  url?: string;
  /** The iframe's name / title / id, whichever the recorder could read. */
  name?: string;
  /** Codegen-era nested frame path. Presence still fails the recording. */
  framePath?: string[];
  /** Codegen-era page handle. Anything but `page` still fails the recording. */
  pageAlias?: string;
}

/**
 * The recorder's locator object, as stored.
 *
 * Measured across 377 current-format recordings, so the fields here are the
 * ones that actually exist rather than the ones that might: `id` appears on
 * 1138 clicks and 845 fills, `attrSelector` on 1383 clicks, `label` on 2910,
 * `text` on 1984, `title` on 774, `placeholder` on 182 fills. Reducing all of
 * that to a single `selector` string — which is what the engine did at first —
 * throws away every fallback the recorder went to the trouble of capturing.
 */
export interface RecordedLocator {
  id?: string;
  role?: string;
  name?: string;
  label?: string;
  title?: string;
  text?: string;
  selector?: string;
  /** A ready-made CSS attribute selector, e.g. `[title="Search: Supplier"]`. */
  attrSelector?: string;
  placeholder?: string;
  componentId?: string;
  /** Role of the wrapping control — `combobox` marks a dropdown trigger. */
  containerRole?: string;
  /** The recorder saw an Oracle LOV magnifier on this field. */
  hasLovIcon?: boolean;
  ariaAutocomplete?: string;
  ariaOwns?: string;
  /** Underlying tag, e.g. `select` vs `input`. */
  sourceTag?: string;
  exact?: boolean;
  /** The labelled field this element sits inside — used to name copy outputs. */
  parent?: { name?: string; label?: string };
}

/** One recorded step, flattened from whichever shape the recorder emitted. */
export interface NormalizedAction {
  name: string;
  url?: string;
  selector?: string;
  text?: string;
  key?: string;
  button?: string;
  clickCount?: number;
  description?: string;
  outputName?: string;

  /**
   * The recorder marked this captured value as the transaction's identifier
   * while the operator was looking at it. Better than any heuristic, so when a
   * recording carries one the automatic probe in transaction-capture.ts stays
   * out of the way entirely.
   */
  isTransactionNumber?: boolean;

  /** The value the field was left holding, when the recorder captured it. */
  committedValue?: string;

  // ── Assertion / upload payloads. The recorder can emit assertChecked,
  // assertText, assertValue, assertVisible, assertSnapshot and setInputFiles;
  // these carry what each one expects.
  checked?: boolean;
  files?: string[];
  snapshot?: string;

  /** Scroll deltas, carried on the step itself by the recorder. */
  deltaX?: number;
  deltaY?: number;

  /**
   * Oracle component id, supplied EXPLICITLY by the recorder rather than dug
   * out of a selector string. This is the strongest locator the recording has —
   * it addresses the component wrapper directly.
   */
  componentId?: string;

  /** Excluded from the PDF by the recorder's own request. */
  skipInReport?: boolean;

  /**
   * How long a `wait` step should sleep, in milliseconds — schema v1.
   *
   * Legacy recordings put the duration in `text`, which is the same field a
   * fill's value lives in. That overload is retired: v1 states the duration in
   * its own typed field, and a v1 `durationMs` that is not a number FAILS the
   * step rather than quietly becoming a 1s sleep.
   */
  durationMs?: number | string;

  /** The recorder marked this step's value a credential. Never logged or sent. */
  sensitive?: boolean;
  /** Name of the credential this step's value should be sourced from. */
  credentialRef?: string;

  /** Which document this step was recorded against. See RecordedFrame. */
  frame?: RecordedFrame;

  /**
   * Schema the recording declared, carried per step so dispatch can branch on
   * it. `null` means the recording was a bare array — LEGACY — and NOT that it
   * is v0 of anything: the two dialects in the corpus are both "legacy" and the
   * only thing that distinguishes v1 is that it says so.
   */
  schemaVersion?: number | null;

  /**
   * Index of the chosen <option>, a fallback when its label no longer matches.
   *
   * Session-scoped, and only meaningful while `text` is still what was recorded
   * beside it — see `originalValue`.
   */
  optionIndex?: string | number;

  /**
   * What the recorder captured for this step, before parameterization rewrote
   * `text`.
   *
   * Exists to tell an EDITED value from an untouched one. Parameterization
   * rewrites the value a step commits but preserves `optionIndex`, which leaves
   * a step meaning "select Credit memo, and if that label is gone take option
   * 2" — while option 2 is still Debit memo. ADF renumbers options per session
   * and again whenever a dependent field filters the list, so the index is a
   * fallback for a RENAMED option, never for a DIFFERENT one.
   *
   * Undefined on recordings made before this was captured; the guard treats
   * that as "not edited", which is the previous behaviour.
   */
  originalValue?: string | null;

  /** The recorder's full locator object, kept intact for candidate building. */
  locator?: RecordedLocator;

  // ── Derived from the selector, so patches can reason about a step without
  // re-parsing `internal:` syntax. A codegen recording gives us only a selector
  // string, and the Oracle heuristics (is this a Save? is this an LOV arrow?)
  // need the role and the accessible name that are buried inside it.
  role?: string;
  accessibleName?: string;
  /** True when the recorded name match was exact (`"…"s`) rather than `"…"i`. */
  exact?: boolean;
}

export type StepStatus = 'success' | 'failed' | 'skipped' | 'warn';

export interface StepResult {
  index: number;
  action: string;
  description: string;
  status: StepStatus;
  duration: number;
  timestamp: number;
  error: string | null;
  code: string;
  /** Honoured by the PDF builder, which filters these rows out. */
  skipInReport?: boolean;
  /** Present only when AI recovery ran — the audit trail for the report. */
  recovery?: { summary: string; actions: string[] };

  /**
   * The KIND of failure, when the application refused the data rather than the
   * selector missing — "Duplicate Data", "Missing Required Field". Set from
   * commit-error-type.ts and read by the PDF, which leads with it instead of
   * with the raw message.
   */
  errorType?: string;

  /**
   * The deterministic verdict for this failure — WHAT went wrong and WHO must
   * act. See engine/errors.ts.
   *
   * ADDITIVE, never a replacement: `error`, `errorType` and the rest are
   * untouched, because the queue worker and the report generator read them and
   * this engine does not get to break their contract from the inside. A reader
   * that does not know about `verdict` behaves exactly as it did before.
   */
  verdict?: {
    category: string;
    responsibility: string;
    kind: string;
    ruleId: string | null;
    source: string;
    confidence: string;
    /** The human sentence buildMessage() produced. */
    summary: string;
    /** True when AI recovery was deliberately not attempted for this category. */
    recoverySkipped?: boolean;
  };
}

export type LogFn = (message: string, level?: 'info' | 'warn' | 'error') => void;

/**
 * Everything the engine needs to know about one application family.
 *
 * Only `name` and `matches` are required; every hook has a safe default in
 * `patches/generic.ts`, so a new patch can start by overriding the one or two
 * behaviours that actually differ and grow from there.
 */
export interface AppPatch {
  /** Identifier used in logs and by APP_PATCH to force a selection. */
  readonly name: string;

  /**
   * The application's name as a person writes it — "Oracle Fusion Cloud", not
   * the `name` slug "oracle-fusion".
   *
   * Separate from `name` because this one goes into AI prompts as prose. A slug
   * reads as a typo to the model, and error classification asks it to label
   * "<app> validation failures", so a wrong name there means the labels are
   * grouped under the wrong product.
   */
  readonly productName: string;

  /** Does this patch handle the application at `url`? */
  matches(url: string): boolean;

  /**
   * Wait for the app to stop working. Not `networkidle` — a partial-page
   * refresh is neither a navigation nor a quiet network.
   */
  waitForIdle(page: Page): Promise<void>;

  /** Wait out an autosuggest debounce before anything commits the field. */
  settleAutosuggest(page: Page): Promise<void>;

  // ── Lists (LOV / dropdown / autosuggest) ────────────────────────────────
  /** Is this step's only job to OPEN a list? Then opening it is the assertion. */
  isListLauncher(action: NormalizedAction): boolean;
  /** Painted list surfaces right now. Compared as a rise, never as presence. */
  countListSurfaces(page: Page): Promise<number>;
  /** Did a list appear that was not painted at `baseline`? */
  listOpened(page: Page, baseline: number, retry?: boolean): Promise<boolean>;
  /** Fallback selector for the field a launcher belongs to, if derivable. */
  fieldOfLauncher(action: NormalizedAction): string | null;
  /** Pick `wanted` from a list that is already open (virtualised grids). */
  selectFromOpenList(page: Page, wanted: string, log: LogFn): Promise<boolean>;
  /**
   * Search terms to type, in order, when filtering a list down to `wanted`.
   *
   * Typing the full recorded label is right for a plain combobox, but some apps
   * record a row's whole concatenated text ("MANUAL OTHER  Manual Order") —
   * typing that filters to nothing. A patch returns progressively shorter
   * prefixes so the engine can retry without knowing why.
   */
  lovProbes(wanted: string): string[];
  /**
   * Click the row for `wanted` in whatever surface this app puts it in, and
   * report whether the click actually landed.
   *
   * This is the vendor-specific half of a typed selection: which ARIA roles the
   * rows carry, and whether the list is an inline popup or a modal grid. The
   * engine decides what counts as PROOF that the selection took; the patch only
   * says whether it managed to click something.
   */
  pickListRow(page: Page, wanted: string, log: LogFn): Promise<boolean>;
  /**
   * Commit a typed value when no row was clickable — Tab, Enter, a blur, or
   * nothing at all, depending on the widget.
   */
  commitTypedValue(page: Page, input: Locator): Promise<void>;
  /**
   * Close a list dialog left open by a failed pick. These are MODAL, so one
   * unclosed dialog turns a single failed step into every later step failing.
   */
  dismissOpenList(page: Page, log?: LogFn): Promise<void>;
  /**
   * Has the session dropped us back to a sign-in screen?
   *
   * Checked only on the failure path: when true, the honest error is "your
   * session expired", not "Save and Close not found", and AI recovery must not
   * burn a call trying to complete a business step on a login page.
   */
  sessionExpired(page: Page): Promise<boolean>;

  /**
   * Disabled in a way Playwright cannot see. Its actionability check honours
   * the `disabled` property and `<fieldset disabled>`, but not `aria-disabled`
   * and not a vendor wrapper class.
   */
  fieldDisabled(el: Locator): Promise<boolean>;

  // ── Commits ─────────────────────────────────────────────────────────────
  /** Is this a Save/Submit, whose refusal looks identical to its acceptance? */
  isCommitStep(action: NormalizedAction): boolean;
  /** Validation errors the app is showing, or [] when the commit went through. */
  collectCommitErrors(page: Page): Promise<string[]>;

  // ── Outputs ─────────────────────────────────────────────────────────────
  /** Identifiers the app assigned (invoice number, order number, …). */
  scanForOutputs(page: Page): Promise<Record<string, string>>;

  /**
   * Where this application paints the things transaction-capture.ts reads, and
   * what one of its generated identifiers looks like.
   *
   * The SEARCH is vendor-neutral and stays in the engine — reading dialogs,
   * ranking candidates, refusing the values that are never an identifier. Only
   * the surfaces and the id shape differ per ERP, so only they live here. A new
   * ERP supplies this object and inherits the rest.
   *
   * `generatedIdPattern` is a source string, not a RegExp: these are handed to
   * `page.evaluate` and rebuilt in page context, where a RegExp cannot be
   * serialised across.
   */
  /**
   * Rewrite a recorded URL into one that is safe to navigate to NOW, or return
   * null to skip the navigation entirely.
   *
   * This replaced a boolean `navigationWouldBreakSession()` that could only skip.
   * Skipping discards the DESTINATION along with the stale token, which silently
   * leaves the run on whatever page the app's own redirect produced — and every
   * later step then fails "not found" against the wrong page, with the report
   * blaming the locators. That is exactly how a Fusion run died on
   * `#clusters-right-nav`: the element exists on the recorded FuseWelcome page
   * and not on the AtkHomePageWelcome the run was actually sitting on.
   *
   * Returning a URL keeps the destination while letting the patch strip whatever
   * per-session state it knows to be volatile. Skipping stays available for an
   * app that genuinely cannot be navigated to directly.
   */
  /**
   * `sessionOrigin` is the origin of the recording's FIRST navigate step, and it
   * outranks `currentUrl` as the alignment anchor. The queue worker executes
   * `[...loginSteps, ...businessSteps]`, and the login steps are re-read from the
   * instance record on every run — so when an instance is repointed at a new pod,
   * the first navigate carries the CURRENT origin while every business step still
   * carries the one the flow was recorded against, possibly months stale.
   * `currentUrl` is only whatever page the browser happens to be sitting on:
   * `about:blank` before the first navigate, and mid-flow potentially some
   * unrelated origin.
   *
   * `isFirstNavigate` is true only for the recording's first navigate step. A
   * patch may skip a redundant navigate, but never that one — it is how the run
   * reaches the sign-in page in the first place.
   */
  rewriteNavigation(
    url: string,
    currentUrl?: string,
    sessionOrigin?: string,
    isFirstNavigate?: boolean,
  ): string | null;

  /**
   * Facts about THIS application's widgets, appended to the AI-recovery system
   * prompt. Bullet lines, no leading dash needed.
   *
   * Lives on the patch because the prompt file is shared by every transport: a
   * sentence about Oracle written there would be sent to the model while
   * replaying SAP, which is worse than saying nothing.
   */
  recoveryHints(): string[];

  transactionSurfaces(): {
    /** Page-title elements — a header that flips to "Edit Supplier: 32510". */
    title: string[];
    /** Message / alert / dialog surfaces that may quote a new identifier. */
    message: string[];
    /**
     * Dialog containers to search for the button a `dismiss` step is about to
     * click. Read BEFORE the click, because the dialog — and the identifier it
     * quotes — is gone immediately after.
     */
    dismissDialog: string[];
    /**
     * Matches an identifier this application GENERATES, not one typed in.
     *
     * A SOURCE string, not a RegExp: this crosses into page context via
     * `page.evaluate`, and a RegExp cannot be serialised across that boundary.
     * Rebuilt with `new RegExp(...)` on the far side.
     */
    generatedIdPattern: string;
    /**
     * Elements whose text is an ERROR, not an identifier. A candidate inside one
     * of these is discarded: reporting "value is required" back as a transaction
     * number is the most convincing kind of wrong answer.
     */
    errorExclusion: string;
  };

  /**
   * The ONE element `wanted` names, when the recorded name cannot say which.
   *
   * A recorded role+name is a case-insensitive SUBSTRING match, so a name that
   * is a strict prefix of another matches both — "United States" also names
   * "United States Minor Outlying Islands". The engine's own answer is to retry
   * the lookup as an exact accessible-name match and take it when exactly one
   * element matches; that is application-agnostic and lives in locators.ts.
   *
   * It is not always enough. An application may render the row's DISPLAY text
   * as something wider than the value it carries — ADF paints "United States
   * US" for the value "United States" — so no element's text equals the
   * recorded name and the exact retry decides nothing. Where the app publishes
   * the underlying value as an exact key in the DOM, this hook is how the patch
   * hands that key over. The engine never needs to know what the key is.
   *
   * Returns a scope-relative locator (matching zero elements is fine — it is
   * one candidate among many and is screened for visibility like any other), or
   * null when this application has nothing better to offer than the name.
   */
  exactMatch(scope: LocatorScope, action: NormalizedAction, wanted: string): Locator | null;

  // ── Relative navigation (paged strips) ──────────────────────────────────
  //
  // A control whose click MOVES the page's contents by one step instead of
  // arriving somewhere. Its recorded click count is a property of the window
  // the recording was made in, not of the destination, so it cannot be
  // replayed; see engine/relative-nav.ts for the loop that replaces it. An
  // application with no such control leaves all three at their defaults and the
  // mechanism never engages.

  /** Does clicking this step merely shift a strip, rather than reach a target? */
  isRelativeNavStep(action: NormalizedAction): boolean;

  /**
   * The same control pointing the OTHER way, for scanning back when the strip
   * ran out in the recorded direction. Null when the application has no
   * counterpart, which simply ends the search.
   */
  reverseNavStep(action: NormalizedAction): NormalizedAction | null;

  /**
   * A string that changes whenever the strip's contents change, used to catch a
   * control that stays enabled but moves nothing.
   *
   * Returning '' means "I cannot read this strip"; the engine then relies on
   * the control disabling itself and on its own page cap, and never reads an
   * unreadable strip as an unchanged one. Must never throw.
   */
  navStripSignature(page: Page): Promise<string>;

  /**
   * Extra locator candidates that only make sense in this application — e.g.
   * the editable node inside a component wrapper. Optional.
   */
  componentCandidates?(scope: LocatorScope, action: NormalizedAction): Array<{ name: string; locator: Locator }>;

  /**
   * Extra ways to reach a list-of-values launcher, tried only after the
   * recorded selector has failed. Separate from `componentCandidates` because
   * these are last-resort alternatives for one widget kind, not a better
   * address for the recorded node — see OraclePatch.launcherCandidates for the
   * case that motivated it. Optional.
   */
  launcherCandidates?(scope: LocatorScope, action: NormalizedAction): Array<{ name: string; locator: Locator }>;
}
