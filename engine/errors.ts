/**
 * Deterministic error classification for the replayer.
 *
 * WHY THIS EXISTS
 * ---------------
 * Today a failure surfaces as whatever raw text Playwright or Oracle produced.
 * "locator.waitFor: Timeout 80000ms exceeded" reads as a selector bug, so that
 * is what gets investigated — even when the real cause is that the task link
 * was never provisioned on the pod. In one recent batch 7 of 19 scripts failed
 * that way on a missing "Register Supplier" task, each burning ~80s, and every
 * one of them was reported as an automation timeout.
 *
 * So every failure carries a CATEGORY decided here, by explicit rules, and the
 * category says what went wrong and who must act.
 *
 * THE ORDER OF PREFERENCE, WHICH IS THE WHOLE POINT
 * -------------------------------------------------
 *   1. THROWN. When the engine already knows — it enumerated every task link on
 *      the instance and the target was not among them — it throws a typed error
 *      carrying its own category. classify() reads the category off the error.
 *      No text matching, no model, no ambiguity.
 *   2. RULE. A message we have seen before, matched by an ordered rule table
 *      derived from 191 real failed executions (see the provenance on each rule).
 *   3. needs-model. Genuinely unrecognised Oracle message text, and nothing else.
 *      classify() NEVER calls a model. It returns 'needs-model' and the caller
 *      decides whether that is worth an API call.
 *
 * This module is pure and dependency-free apart from the FailureStage vocabulary
 * it reuses, so it is trivially testable offline: no browser, no network, no DB.
 */

import { inferStage } from './aiFixClassifier';
import type { FailureStage } from './aiFixClassifier';

export type { FailureStage };

// ═══════════════════════════════════════════════════════════════════════════════
// AXIS 1 — RESPONSIBILITY: who must act
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ported verbatim from the client replayer's STARTING_CATEGORIES
 * (D:/Freelance/FirstCron/replay/engine/oracle-error-type.ts, ~line 89) so the
 * two products keep one vocabulary. Described by MEANING, not by the words
 * Oracle happens to use.
 */
export type Responsibility =
  /** The data the run supplied cannot be used: supplier inactive, invalid BU, closed period. */
  | 'DATA_ERROR'
  /** Oracle correctly rejected something it should reject. The application behaved as designed. */
  | 'EXPECTED_VALIDATION'
  /** The user lacks the privilege or role to do this. */
  | 'SECURITY_ERROR'
  /** The script or the tool, not the application: locator changed, timeout, stale element. */
  | 'AUTOMATION_ERROR'
  /** Oracle itself misbehaved: page crash, server exception, unexpected functional defect. */
  | 'APPLICATION_ERROR'
  /** The instance or the network, not the data: service unavailable, login issue, missing setup. */
  | 'ENVIRONMENT_ERROR'
  /** The evidence is insufficient to tell which of the above it is. */
  | 'UNKNOWN';

// ═══════════════════════════════════════════════════════════════════════════════
// AXIS 2 — KIND: what is wrong
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ported verbatim from engine/commit-error-type.ts (~line 87), including its
 * general label. Kept as the same display strings so a Kind produced here can be
 * written straight into the `cus_oracle_error_type` vocabulary that file caches,
 * with no translation table to drift.
 */
export type Kind =
  | 'Duplicate Data'
  | 'Missing Data'
  | 'Invalid Data'
  | 'Setup Missing'
  | 'Access Issue'
  | 'System Error'
  /** The general label, for anything the others do not cover. */
  | 'Data Error';

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY — the named thing that happened
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Responsibility and Kind are both coarse on purpose — they are for routing and
 * for a report badge. The Category is the specific diagnosis, and it is what the
 * human-readable message is built from.
 */
export type Category =
  /**
   * The destination was searched for exhaustively and is not on this instance.
   * DETERMINISTIC ONLY — this is never inferred from message text and never sent
   * to a model. A timeout looks identical to a slow page; only the engine, which
   * enumerated the candidates, can know the difference. It must be THROWN.
   */
  | 'TARGET_NOT_PRESENT'
  /** The action is not permitted in the record's current state (already validated, locked by another user). */
  | 'STATE_CONFLICT'
  /** A value that must be unique already exists. */
  | 'DUPLICATE_RECORD'
  /** The browser is on a sign-in page: the session is gone or was never established. */
  | 'SESSION_EXPIRED'
  /** A literal `${param}` reached a field, or a bound parameter could not be resolved. */
  | 'UNRESOLVED_PARAMETER'
  /** A field was filled and did not keep the value. */
  | 'FILL_NOT_COMMITTED'
  /** Oracle refused the submit for a data reason it stated plainly (required field, bad LOV). */
  | 'VALIDATION_REJECTED'
  /** The user is authenticated but not entitled to the page. */
  | 'ACCESS_DENIED'
  /** The locator matched more than one element. A script defect, not an app one. */
  | 'AMBIGUOUS_TARGET'
  /** The element exists but could not be acted on: hidden, off-viewport. */
  | 'ELEMENT_NOT_INTERACTABLE'
  /** A select had no such option. */
  | 'OPTION_NOT_AVAILABLE'
  /** The page, context or browser went away underneath the run. */
  | 'BROWSER_LOST'
  /** The operator stopped the run. Not a defect at all. */
  | 'RUN_CANCELLED'
  /** The runner process died or produced nothing. */
  | 'RUNNER_FAILED'
  /**
   * A locator timed out and we cannot say why from the text alone. This is the
   * honest floor, NOT a diagnosis — see the note on rule R900.
   */
  | 'LOCATOR_TIMEOUT'
  /** No rule matched. */
  | 'UNCLASSIFIED';

// ═══════════════════════════════════════════════════════════════════════════════
// THE RESULT
// ═══════════════════════════════════════════════════════════════════════════════

/** How the verdict was reached. Never 'model' — this module does not call one. */
export type VerdictSource = 'thrown' | 'rule' | 'needs-model';

/**
 * How far the evidence actually goes.
 *
 * 'assumed' exists because one axis genuinely is not decidable from a message.
 * "Duplicate invoice number" is EXPECTED_VALIDATION when the scenario MEANT to
 * submit a duplicate and DATA_ERROR when it did not — identical text, opposite
 * verdicts. The KIND (Duplicate Data) is certain either way. So the module
 * reports what it can and flags the rest rather than committing silently.
 */
export type Confidence = 'certain' | 'assumed';

export interface Verdict {
  category: Category;
  responsibility: Responsibility;
  kind: Kind;
  stage: FailureStage;
  /** Stable id of the rule that decided this, or of the thrown error class. Null when needs-model. */
  ruleId: string | null;
  source: VerdictSource;
  /** 'assumed' means the responsibility was defaulted and the caller may know better. */
  confidence: Confidence;
  /**
   * True when `responsibility` would change if the scenario's intent were known.
   * Set on the data-rejection rules. Never set on a thrown verdict.
   */
  responsibilityDependsOnIntent: boolean;
  /**
   * Non-null when this verdict must NOT be treated as final.
   *
   * Oracle's "Unauthorized Access: Either you do not have the privilege, or you
   * have not signed in." is documented as appearing BOTH for a real privilege
   * gap and for an expired session that a refresh clears. One string, two
   * classes. Classifying it terminally on first sight is guaranteed to be wrong
   * half the time, so the rule asks for a retry and a re-classification instead.
   */
  retry: 'refresh-then-reclassify' | null;
  /** The Oracle message code the verdict was keyed on, e.g. 'JBO-25014'. Null when text-matched. */
  code: string | null;
}

/**
 * What the scenario says it was trying to do.
 *
 * This is the ONLY thing that can settle DATA_ERROR vs EXPECTED_VALIDATION on a
 * data rejection, and it is not in the failure text — it is in the test's own
 * declaration. The caller supplies it; the classifier never guesses it.
 */
export type ScenarioIntent =
  /** The scenario meant this to succeed. A rejection is therefore bad data. */
  | 'expects-success'
  /** The scenario is a negative test: the rejection is the pass condition. */
  | 'expects-rejection';

/** Everything classify() is allowed to look at. */
export interface Evidence {
  /** The raw failure text as stored in api_execution_history.error_message. */
  message?: string | null;
  /** The error object the engine threw, if any. A ClassifiedError short-circuits everything. */
  error?: unknown;
  /** Stage, when the caller already knows it. Otherwise inferred from the message. */
  stage?: FailureStage;
  /**
   * A parsed Oracle ADF REST error envelope, when one was captured.
   *
   * MEASURED on the dev79 pod: the classification code lives NESTED in
   * `o:errorDetails[].code` (as "29140", the JBO- prefix stripped) and the TOP
   * level carried no `o:errorCode` at all. A parser that reads only the top
   * level finds nothing, so this walks the array first.
   */
  envelope?: unknown;
  /** What the scenario declared it was doing. Settles responsibility on data rejections. */
  intent?: ScenarioIntent;
  /**
   * True when this failure has already been retried after a session refresh.
   * Rules that ask for 'refresh-then-reclassify' stop asking once it is set.
   */
  retried?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPED ERRORS — a category attached at the throw site
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The base class. Anything that extends this is classified with zero inference:
 * the code that threw it had evidence no message text can carry.
 *
 * `Object.setPrototypeOf` is not decoration. The tsconfig targets ES2022 so it
 * is not strictly needed today, but the engine is transpiled by esbuild for
 * Playwright with its own settings, and a downlevelled subclass of Error fails
 * `instanceof` silently — which would route a KNOWN failure to the model.
 */
export class ClassifiedError extends Error {
  readonly category: Category;
  readonly responsibility: Responsibility;
  readonly kind: Kind;
  readonly stage: FailureStage;
  /** Free-form facts for the message builder. Never contains a credential. */
  readonly context: Record<string, string | number>;

  constructor(
    message: string,
    v: {
      category: Category;
      responsibility: Responsibility;
      kind: Kind;
      stage: FailureStage;
      context?: Record<string, string | number>;
    },
  ) {
    super(message);
    this.name = new.target.name;
    this.category = v.category;
    this.responsibility = v.responsibility;
    this.kind = v.kind;
    this.stage = v.stage;
    this.context = v.context ?? {};
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the engine has enumerated the available destinations and the one
 * the script wants is not among them.
 *
 * ENVIRONMENT_ERROR, not AUTOMATION_ERROR: the script is correct and the pod is
 * missing a task. Getting this axis wrong is exactly the failure this whole
 * module exists to stop — 7 scripts in one batch blamed on selectors.
 */
export class TargetNotPresentError extends ClassifiedError {
  /**
   * `opts.message` overrides the default sentence.
   *
   * It exists because the throw sites already carry wording that was tuned
   * against real reports and is quoted verbatim in docs and in checks/run.mjs.
   * Replacing those sentences with a generic one to gain a category would trade
   * a good message for a good label; carrying both costs nothing.
   */
  constructor(
    target: string,
    opts: { instance?: string; searched?: number; scope?: string; message?: string } = {},
  ) {
    super(opts.message ?? `Target not present on this instance: ${target}`, {
      category: 'TARGET_NOT_PRESENT',
      responsibility: 'ENVIRONMENT_ERROR',
      kind: 'Setup Missing',
      stage: 'LOCATE',
      context: {
        target,
        ...(opts.instance ? { instance: opts.instance } : {}),
        ...(opts.scope ? { scope: opts.scope } : {}),
        ...(typeof opts.searched === 'number' ? { searched: opts.searched } : {}),
      },
    });
  }
}

/** The record is in a state that forbids the action. Oracle was right to refuse. */
export class StateConflictError extends ClassifiedError {
  constructor(message: string, context: Record<string, string | number> = {}) {
    super(message, {
      category: 'STATE_CONFLICT',
      responsibility: 'EXPECTED_VALIDATION',
      kind: 'Invalid Data',
      stage: 'COMMIT',
      context,
    });
  }
}

/** A unique value already exists. Real: "A record with the value 234554673 already exists". */
export class DuplicateRecordError extends ClassifiedError {
  constructor(message: string, context: Record<string, string | number> = {}) {
    super(message, {
      category: 'DUPLICATE_RECORD',
      responsibility: 'EXPECTED_VALIDATION',
      kind: 'Duplicate Data',
      stage: 'COMMIT',
      context,
    });
  }
}

/** The page is a sign-in page. The run has no session. */
export class SessionExpiredError extends ClassifiedError {
  constructor(message = 'The application session is not signed in', context: Record<string, string | number> = {}) {
    super(message, {
      category: 'SESSION_EXPIRED',
      responsibility: 'ENVIRONMENT_ERROR',
      kind: 'Access Issue',
      stage: 'OTHER',
      context,
    });
  }
}

/**
 * A literal `${param}` reached a field, or a bound parameter never resolved.
 * AUTOMATION_ERROR: the run's own parameter wiring is broken, not Oracle's.
 */
export class UnresolvedParameterError extends ClassifiedError {
  /** `context.message` overrides the sentence; see TargetNotPresentError. */
  constructor(param: string, context: Record<string, string | number> & { message?: string } = {}) {
    const { message, ...rest } = context;
    context = rest;
    super(message ?? `Parameter was never resolved: ${param}`, {
      category: 'UNRESOLVED_PARAMETER',
      responsibility: 'AUTOMATION_ERROR',
      kind: 'Missing Data',
      stage: 'INPUT',
      context: { param, ...context },
    });
  }
}

/** A field was filled and read back different. The engine measured this; it is not a guess. */
export class FillNotCommittedError extends ClassifiedError {
  /** `opts.message` overrides the sentence; see TargetNotPresentError. */
  constructor(field: string, expected: string, actual: string, opts: { message?: string } = {}) {
    super(opts.message ?? `Field "${field}" did not keep the value it was given`, {
      category: 'FILL_NOT_COMMITTED',
      responsibility: 'AUTOMATION_ERROR',
      kind: 'System Error',
      stage: 'VERIFY',
      context: { field, expected, actual },
    });
  }
}

/** The user is signed in but the instance refused the page. */
export class AccessDeniedError extends ClassifiedError {
  constructor(message = 'Access denied for this page', context: Record<string, string | number> = {}) {
    super(message, {
      category: 'ACCESS_DENIED',
      responsibility: 'SECURITY_ERROR',
      kind: 'Access Issue',
      stage: 'OPEN',
      context,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORACLE MESSAGE CODES — the locale-independent signal
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * THE PRECEDENCE, and why it is in this order.
 *
 *   1. nested  o:errorDetails[].code   — MEASURED on dev79: a malformed query
 *      returned HTTP 400 with keys {title, status, o:errorDetails} and the code
 *      "29140" (JBO-29140) ONLY inside that array. Top level had no o:errorCode.
 *   2. top-level o:errorCode           — often absent. Never rely on it alone.
 *   3. parenthesised (XXX-nnnnnnn) scraped from the message text — this is what
 *      our UI-path failures actually carry: "You must enter a different number.
 *      There's already an invoice with that number. (AP-810245)".
 *   4. English text match              — LOCALE-FRAGILE. Every rule in RULES
 *      below is in this tier and is marked as such; a non-English pod silently
 *      drops to needs-model, which is the correct failure mode but is a real
 *      limitation, not a theoretical one.
 *   5. framework exception type        — LAST, and deliberately weakest.
 *      Playwright's auto-waiting collapses "element missing" and "sync failure"
 *      into the same TimeoutError, so the exception type cannot separate them.
 *      That is rule R900, and R900 is why it is only a floor.
 *
 * NOT DONE HERE, and it must not be: sending REST-Framework-Version: 4 with the
 * error Accept type unconditionally. MEASURED on the same pod — on the items
 * resource the plain request returned a useful coded message
 * ("...(EGP-2776154)") while v4 + error Accept returned HTTP 406 with an EMPTY
 * body. The v4 headers LOSE information on some endpoints. Any future client
 * that fetches an envelope must not send them unconditionally.
 */
export interface CodeRule {
  /** Full code including its product prefix. */
  code: string;
  why: string;
  category: Category;
  responsibility: Responsibility;
  kind: Kind;
  stage: FailureStage;
  responsibilityDependsOnIntent?: boolean;
}

/**
 * Ordered: when one message carries several codes — and real ones do, e.g.
 * "(AP-810879) | ... (AP-810245)" — the FIRST entry here that appears in the
 * message wins, not the first code in the string. Duplicates outrank missing
 * fields for the same reason R210 precedes R240.
 */
export const CODE_RULES: readonly CodeRule[] = [
  {
    code: 'AP-810245',
    why: "Real corpus: \"You must enter a different number. There's already an invoice with that number. (AP-810245)\".",
    category: 'DUPLICATE_RECORD',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Duplicate Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
  {
    code: 'POZ-2130479',
    why: 'Real corpus: "Another supplier ... with taxpayer ID 099812124 already exists. (POZ-2130479)".',
    category: 'DUPLICATE_RECORD',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Duplicate Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
  {
    // Documented Oracle behaviour, and the coordinator's point about replay
    // specifically: in a SINGLE-USER replay session there is no other user, so
    // "another user changed the row" almost always means we replayed a stale
    // cached resource without a refreshed ETag/If-Match. That is our bug, not
    // Oracle's and not a genuine concurrency conflict — hence AUTOMATION_ERROR
    // here even though the same code in a multi-user context is EXPECTED_VALIDATION.
    // This is the one place the code layer deliberately disagrees with the text
    // layer (R220), and it wins because it is checked first.
    code: 'JBO-25014',
    why: 'Documented: "Another user has changed the row with primary key {0}." Self-inflicted in a single-user replay: stale ETag.',
    category: 'STATE_CONFLICT',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'COMMIT',
  },
  {
    code: 'JBO-29140',
    why: 'MEASURED on dev79: a malformed ViewCriteria returned o:errorDetails[].code "29140". A bad query we built.',
    category: 'VALIDATION_REJECTED',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'COMMIT',
  },
  {
    code: 'EGP-2776154',
    why: 'MEASURED on dev79: "You must enter at least 3 characters in one of these fields: ItemNumber,... (EGP-2776154)" — our search term was too short.',
    category: 'VALIDATION_REJECTED',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'Invalid Data',
    stage: 'INPUT',
  },
  {
    code: 'AP-810879',
    why: 'Real corpus: "You must provide a value for the Amount attribute for line 1. (AP-810879)".',
    category: 'VALIDATION_REJECTED',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Missing Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
  {
    code: 'AR-856687',
    why: 'Real corpus: "Enter the required line information for line number 2. (AR-856687)".',
    category: 'VALIDATION_REJECTED',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Missing Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
  {
    code: 'AR-855322',
    why: 'Real corpus: "The default remit-to address wasn\'t populated. (AR-855322)" — the customer setup lacks a remit-to address.',
    category: 'VALIDATION_REJECTED',
    responsibility: 'DATA_ERROR',
    kind: 'Setup Missing',
    stage: 'COMMIT',
  },
  {
    code: 'AR-856520',
    why: 'Real corpus: "You must enter a bill-to customer name or a bill-to customer account number. (AR-856520)".',
    category: 'VALIDATION_REJECTED',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Missing Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
  {
    code: 'AR-856522',
    why: 'Real corpus: "You must enter a bill-to customer site. (AR-856522)".',
    category: 'VALIDATION_REJECTED',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Missing Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
];

/** `(AP-810245)` and friends, as they appear inline in a UI-path failure. */
const SCRAPED_CODE = /\(([A-Z][A-Z0-9]{1,5}-\d{3,9})\)/g;

/**
 * Walk a parsed ADF REST error envelope for message codes, nested first.
 *
 * Returns codes WITH their prefix restored where the envelope stripped it: the
 * pod reports `code: "29140"` for JBO-29140, so a bare all-digit code is
 * emitted both as-is and as `JBO-<n>`. Unknown-shaped input yields [] rather
 * than throwing — this must never be able to fail a run.
 */
export function codesFromEnvelope(envelope: unknown): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v !== 'string' && typeof v !== 'number') return;
    const s = String(v).trim();
    if (!s) return;
    if (/^\d+$/.test(s)) out.push(`JBO-${s}`, s);
    else out.push(s.toUpperCase());
  };
  const walk = (node: unknown, depth: number) => {
    if (depth > 6 || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    const obj = node as Record<string, unknown>;
    // 1. nested details, 2. top-level o:errorCode. Both are read; ORDER of the
    // walk puts details first because that is where the pod actually put it.
    if (Array.isArray(obj['o:errorDetails'])) walk(obj['o:errorDetails'], depth + 1);
    push(obj['code']);
    push(obj['o:errorCode']);
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'o:errorDetails' || k === 'code' || k === 'o:errorCode') continue;
      walk(v, depth + 1);
    }
  };
  walk(envelope, 0);
  return out;
}

/** Every code visible in a message's text, in the order Oracle printed them. */
export function codesFromText(message: string): string[] {
  const out: string[] = [];
  for (const m of message.matchAll(SCRAPED_CODE)) out.push(m[1].toUpperCase());
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE TEXT RULE TABLE  (precedence tier 4 — LOCALE-FRAGILE by construction)
// ═══════════════════════════════════════════════════════════════════════════════

export interface Rule {
  /** Stable id. Referenced by checks and by anything that reports a verdict. Never renumber. */
  id: string;
  /** One line: WHY this rule exists, citing the real message it came from. */
  why: string;
  test: (message: string) => boolean;
  category: Category;
  responsibility: Responsibility;
  kind: Kind;
  /** Fixed stage, or undefined to fall back to inferStage(). */
  stage?: FailureStage;
  /** True when only the scenario's declared intent can settle `responsibility`. */
  responsibilityDependsOnIntent?: boolean;
  /** Set when the verdict must not be final until a refresh has been tried. */
  retry?: 'refresh-then-reclassify';
}

/**
 * ORDER IS THE CONTRACT: specific before general, and it is deliberate.
 *
 * The ids are banded so a rule can be inserted without renumbering:
 *   R0xx  run-level outcomes — not a step failure at all, so they must win
 *         before anything reads the step text.
 *   R1xx  session and entitlement — a sign-in page makes every locator time out,
 *         so this MUST precede R9xx or every logged-out run is filed as a
 *         selector bug. This is the second-biggest mis-blame after R900.
 *   R2xx  Oracle's own words. Within the band, duplicate and state conflict come
 *         before required-field, because a single submit routinely reports both
 *         ("You must provide a value for the Amount attribute for line 1. |
 *         You must enter a different number. There's already an invoice...")
 *         and the duplicate is the one a human must act on.
 *   R3xx  Playwright faults that name a specific mechanism.
 *   R9xx  the general locator timeout. Last, always, because it matches half the
 *         corpus and would swallow every band above it.
 *
 * Deliberately absent: a general "Oracle rejected the data" catch-all. Oracle
 * text we have never seen is precisely the one case worth a model call, so it is
 * left to fall through to 'needs-model'.
 */
export const RULES: readonly Rule[] = [
  // ── R0xx — run-level outcomes ────────────────────────────────────────────────
  {
    id: 'R010',
    // 35 of 191 real rows are exactly this. The single largest cluster in the
    // corpus is not a defect at all, and filing it as one poisons every metric.
    why: 'Verbatim, 35 rows: "Execution stopped by user" — an operator cancelled the run.',
    test: (m) => /execution stopped by user/i.test(m),
    category: 'RUN_CANCELLED',
    responsibility: 'UNKNOWN',
    kind: 'System Error',
    stage: 'OTHER',
  },
  {
    id: 'R020',
    why: 'Verbatim: "Execution did not finish — the runner stopped while it was still running" — the runner process died.',
    test: (m) => /execution did not finish|the runner stopped while it was still running/i.test(m),
    category: 'RUNNER_FAILED',
    responsibility: 'ENVIRONMENT_ERROR',
    kind: 'System Error',
    stage: 'OTHER',
  },
  {
    id: 'R030',
    why: 'Verbatim: "Spec produced no results (exit code 1)" — the spec crashed before reporting.',
    test: (m) => /spec produced no results/i.test(m),
    category: 'RUNNER_FAILED',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'OTHER',
  },
  {
    id: 'R040',
    // Kept above R9xx: this run never started a step, so a stage inference would
    // be meaningless.
    why: 'Verbatim, 5 rows: "Dependency script failed — bound parameter could not be resolved".',
    test: (m) => /bound parameter could not be resolved|dependency script failed/i.test(m),
    category: 'UNRESOLVED_PARAMETER',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'Missing Data',
    stage: 'INPUT',
  },
  {
    id: 'R050',
    why: 'Verbatim: "Target page, context or browser has been closed" — the browser went away mid-run.',
    test: (m) => /target page, context or browser has been closed/i.test(m),
    category: 'BROWSER_LOST',
    responsibility: 'ENVIRONMENT_ERROR',
    kind: 'System Error',
    stage: 'OTHER',
  },

  // ── R1xx — session and entitlement ───────────────────────────────────────────
  {
    id: 'R100',
    // Documented Oracle string, and documented to be AMBIGUOUS: it appears for a
    // real privilege gap AND for an expired session that a refresh clears. One
    // string, two responsibilities. So this rule refuses to be terminal — it
    // asks for a refresh and a second classification. Only once `retried` is set
    // does the SECURITY_ERROR reading stand, because by then the session excuse
    // has been eliminated. First in the R1xx band so neither R110 nor R120 can
    // claim it and commit to the wrong axis.
    why: 'Documented: "Unauthorized Access: Either you do not have the privilege, or you have not signed in." — ambiguous by design.',
    test: (m) => /unauthorized access/i.test(m) && /(privilege|signed in)/i.test(m),
    category: 'ACCESS_DENIED',
    responsibility: 'SECURITY_ERROR',
    kind: 'Access Issue',
    stage: 'OPEN',
    retry: 'refresh-then-reclassify',
  },
  {
    id: 'R110',
    // Real: "The page is at an 'access-denied' URL and contains no Email field".
    // Checked BEFORE R120 because an access-denied page is an entitlement
    // problem, whereas a sign-in page is merely an absent session.
    why: 'Real rows: the run landed on an "access-denied" page — signed in, not entitled.',
    test: (m) => /access[-\s]?denied/i.test(m),
    category: 'ACCESS_DENIED',
    responsibility: 'SECURITY_ERROR',
    kind: 'Access Issue',
    stage: 'OPEN',
  },
  {
    id: 'R120',
    // Real: "the current page is the Oracle Identity Cloud sign-in page, not the
    // application ... the user session appears logged out". Without this rule all
    // four such rows read as locator timeouts, because that is literally what
    // Playwright reported before the recovery narrative was appended.
    why: 'Real rows: "Oracle Identity Cloud sign-in page", "the user session appears logged out", "IDCS sign-in page".',
    test: (m) =>
      /identity cloud|\bidcs\b/i.test(m) ||
      /sign[-\s]?in (?:page|screen)/i.test(m) ||
      /session (?:appears logged out|isn'?t authenticated)/i.test(m),
    category: 'SESSION_EXPIRED',
    responsibility: 'ENVIRONMENT_ERROR',
    kind: 'Access Issue',
    stage: 'OTHER',
  },

  // ── R2xx — Oracle's own words ────────────────────────────────────────────────
  {
    id: 'R210',
    // Real, verbatim: "A record with the value 234554673 already exists. Enter a
    // unique value.", "You must enter a different number. There's already an
    // invoice with that number. (AP-810245)", "A record with this combination of
    // values already exists.", "Another supplier ... with taxpayer ID 099812124
    // already exists. (POZ-2130479)".
    why: 'Real, 4 distinct phrasings of a uniqueness rejection. EXPECTED_VALIDATION: Oracle was right.',
    test: (m) =>
      /already exists\.?\s*enter a unique value/i.test(m) ||
      /there'?s already an invoice with that number/i.test(m) ||
      /a record with this combination of values already exists/i.test(m) ||
      /with taxpayer id .{0,40}already exists/i.test(m),
    category: 'DUPLICATE_RECORD',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Duplicate Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },
  {
    id: 'R215',
    // Real, verbatim: "Another user has changed the row with primary key
    // oracle.jbo.Key[300000048914681 ]" — the untagged text form of JBO-25014.
    // AUTOMATION_ERROR, not EXPECTED_VALIDATION: in a single-user replay there
    // IS no other user, so this is us replaying a stale cached resource without
    // a refreshed ETag. Split out of R220 for exactly that reason — the two look
    // alike and route to opposite teams.
    why: 'Real: "Another user has changed the row with primary key oracle.jbo.Key[...]" — text form of JBO-25014, self-inflicted in replay.',
    test: (m) => /another user has changed the row/i.test(m),
    category: 'STATE_CONFLICT',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'COMMIT',
  },
  {
    id: 'R220',
    // The reported production case that motivated the category — an invoice
    // already validated by another user, "this action is not allowed". It is NOT
    // in the 191 rows, and is labelled as such in the check file.
    why: 'Reported case (NOT in corpus): an already-validated invoice re-validated, "this action is not allowed".',
    test: (m) =>
      /this action is\s*(?:n'?t|not)\s+allowed/i.test(m) ||
      /(?:has )?already been (?:validated|approved|cancelled|posted|accounted)/i.test(m) ||
      /cannot be (?:validated|modified|deleted) (?:in|because).{0,40}status/i.test(m),
    category: 'STATE_CONFLICT',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Invalid Data',
    stage: 'COMMIT',
  },
  {
    id: 'R230',
    // Real, verbatim: "This combination is invalid: Cost Center 12 is not in the
    // list of values." DATA_ERROR/Setup Missing rather than EXPECTED_VALIDATION:
    // the value refers to something the instance does not have configured, so a
    // human has to go and configure it.
    why: 'Real: "This combination is invalid: Cost Center 12 is not in the list of values."',
    test: (m) => /is not in the list of values|this combination is invalid/i.test(m),
    category: 'VALIDATION_REJECTED',
    responsibility: 'DATA_ERROR',
    kind: 'Setup Missing',
    stage: 'COMMIT',
  },
  {
    id: 'R240',
    // Real, verbatim: "Address Name: You must enter a value. | Country: You must
    // enter a value. | Address Purpose: You must make at least one selection.",
    // "You must provide a value for the Amount attribute for line 1. (AP-810879)",
    // "Enter the required line information for line number 2. (AR-856687)",
    // "The default remit-to address wasn't populated."
    // Last in the R2xx band on purpose: these phrases co-occur with duplicates
    // and with LOV failures, and are the least actionable of the three.
    why: 'Real, 4 phrasings of a required-field rejection. The commonest Oracle refusal in the corpus.',
    test: (m) =>
      /you must (?:enter|provide|select) a (?:value|different|bill-to)/i.test(m) ||
      /you must make at least one selection/i.test(m) ||
      /enter the required line information/i.test(m) ||
      /wasn'?t populated/i.test(m),
    category: 'VALIDATION_REJECTED',
    responsibility: 'EXPECTED_VALIDATION',
    kind: 'Missing Data',
    stage: 'COMMIT',
    responsibilityDependsOnIntent: true,
  },

  // ── R3xx — Playwright faults naming a mechanism ──────────────────────────────
  {
    id: 'R310',
    why: 'Real: "strict mode violation: getByRole(\'gridcell\', { name: /jabalpur/i }) resolved to 10 elements".',
    test: (m) => /strict mode violation/i.test(m),
    category: 'AMBIGUOUS_TARGET',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'LOCATE',
  },
  {
    id: 'R320',
    why: 'Real: "locator.click: Element is not visible", "locator.click: Element is outside of the viewport".',
    test: (m) => /element is not visible|element is outside of the viewport/i.test(m),
    category: 'ELEMENT_NOT_INTERACTABLE',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'LOCATE',
  },
  {
    id: 'R330',
    // Real: 'selectOption could not select "35" — tried label "35":
    // locator.selectOption: Timeout...'. Must precede R900, which would
    // otherwise claim it on the trailing "Timeout ...ms exceeded".
    why: 'Real: \'selectOption could not select "35" — tried label "35"\' — the option was not in the select.',
    test: (m) => /selectoption could not select|could not select option/i.test(m),
    category: 'OPTION_NOT_AVAILABLE',
    responsibility: 'DATA_ERROR',
    kind: 'Invalid Data',
    stage: 'INPUT',
  },
  {
    id: 'R340',
    // The text form of what FillNotCommittedError throws. No row in the 191
    // matches it, because the read-back verifier post-dates this corpus — it is
    // here as the rule mirror of a thrown error, and is labelled INVENTED in the
    // check file rather than claimed as evidence-derived.
    why: 'INVENTED (no corpus row): mirrors FillNotCommittedError for callers that only have text.',
    test: (m) => /did not keep the value|value mismatch after fill|read-?back disagreed/i.test(m),
    category: 'FILL_NOT_COMMITTED',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
    stage: 'VERIFY',
  },
  {
    id: 'R350',
    // Likewise INVENTED as a rule: zero corpus rows contain a literal ${...}.
    // Kept because the substitution bug it catches is real (R040 is the same bug
    // caught one layer earlier, 5 rows) and because a rendered `${param}` in a
    // field is unmistakable — there is no false-positive risk worth the miss.
    why: 'INVENTED (no corpus row): a literal ${param} rendered into a field or selector.',
    test: (m) => /\$\{[A-Za-z0-9_.\-]+\}/.test(m),
    category: 'UNRESOLVED_PARAMETER',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'Missing Data',
    stage: 'INPUT',
  },

  // ── R9xx — the honest floor ──────────────────────────────────────────────────
  {
    id: 'R900',
    // ~110 of 191 rows. This rule is NOT a diagnosis and must never be presented
    // as one: a locator timeout is what a missing task link, a slow pod, a
    // renamed label and a logged-out session all look like. It is AUTOMATION_ERROR
    // only because that is the cheapest place to start looking once every band
    // above has declined it. TARGET_NOT_PRESENT is deliberately NOT reachable
    // from here — only a throw can assert it.
    why: 'Real, the largest step-level cluster: "locator.waitFor: Timeout 80000ms exceeded". A floor, not a diagnosis.',
    test: (m) => /timeout \d+ms exceeded|locator\.\w+: timeout/i.test(m),
    category: 'LOCATOR_TIMEOUT',
    responsibility: 'AUTOMATION_ERROR',
    kind: 'System Error',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// classify
// ═══════════════════════════════════════════════════════════════════════════════

/** True for anything thrown with a category already attached. */
export function isClassifiedError(e: unknown): e is ClassifiedError {
  return (
    e instanceof ClassifiedError ||
    // Duck-typed fallback: esbuild/Playwright can load two copies of this module
    // (spec and worker), and instanceof is false across copies. A silent miss
    // here would route a KNOWN failure to the model, which is the one outcome
    // this module exists to prevent.
    (typeof e === 'object' &&
      e !== null &&
      typeof (e as { category?: unknown }).category === 'string' &&
      typeof (e as { responsibility?: unknown }).responsibility === 'string' &&
      typeof (e as { kind?: unknown }).kind === 'string')
  );
}

/**
 * The single entry point.
 *
 * Never calls a model, never touches the network, never reads a file. When no
 * rule matches it returns source 'needs-model' and the caller decides.
 */
/**
 * Settle the responsibility axis for a data rejection.
 *
 * The KIND is decided by the message; the RESPONSIBILITY is decided by what the
 * scenario said it was trying to do, and nothing else. Absent an intent the
 * rule's default stands but is reported as 'assumed', so a caller that knows
 * better can override and one that does not is at least not misled.
 */
function resolveResponsibility(
  fallback: Responsibility,
  dependsOnIntent: boolean,
  intent: ScenarioIntent | undefined,
): { responsibility: Responsibility; confidence: Confidence } {
  if (!dependsOnIntent) return { responsibility: fallback, confidence: 'certain' };
  if (intent === 'expects-rejection') return { responsibility: 'EXPECTED_VALIDATION', confidence: 'certain' };
  if (intent === 'expects-success') return { responsibility: 'DATA_ERROR', confidence: 'certain' };
  return { responsibility: fallback, confidence: 'assumed' };
}

export function classify(evidence: Evidence): Verdict {
  const thrown = evidence.error;
  if (isClassifiedError(thrown)) {
    return {
      category: thrown.category,
      responsibility: thrown.responsibility,
      kind: thrown.kind,
      stage: evidence.stage ?? thrown.stage,
      ruleId: (thrown as Error).name || 'ClassifiedError',
      source: 'thrown',
      confidence: 'certain',
      responsibilityDependsOnIntent: false,
      retry: null,
      code: null,
    };
  }

  const message = typeof evidence.message === 'string' ? evidence.message : '';

  // ── Tiers 1–3: the code, wherever it can be found. Locale-independent, so it
  //    outranks every text rule below.
  const codes = new Set([
    ...(evidence.envelope === undefined ? [] : codesFromEnvelope(evidence.envelope)),
    ...codesFromText(message),
  ]);
  if (codes.size) {
    // CODE_RULES order, not message order: a submit reporting AP-810879 then
    // AP-810245 is the duplicate, which is the actionable half.
    for (const cr of CODE_RULES) {
      if (!codes.has(cr.code)) continue;
      const dep = cr.responsibilityDependsOnIntent === true;
      const r = resolveResponsibility(cr.responsibility, dep, evidence.intent);
      return {
        category: cr.category,
        responsibility: r.responsibility,
        kind: cr.kind,
        stage: evidence.stage ?? cr.stage,
        ruleId: cr.code,
        source: 'rule',
        confidence: r.confidence,
        responsibilityDependsOnIntent: dep,
        retry: null,
        code: cr.code,
      };
    }
  }

  // ── Tiers 4–5: English text, then the bare exception shape (R900).
  if (message.trim()) {
    for (const rule of RULES) {
      if (!rule.test(message)) continue;
      const dep = rule.responsibilityDependsOnIntent === true;
      const r = resolveResponsibility(rule.responsibility, dep, evidence.intent);
      return {
        category: rule.category,
        responsibility: r.responsibility,
        kind: rule.kind,
        stage: evidence.stage ?? rule.stage ?? inferStage(message),
        ruleId: rule.id,
        source: 'rule',
        confidence: r.confidence,
        responsibilityDependsOnIntent: dep,
        // A rule that wants a refresh stops asking once one has happened.
        retry: rule.retry && !evidence.retried ? rule.retry : null,
        code: null,
      };
    }
  }

  return {
    category: 'UNCLASSIFIED',
    responsibility: 'UNKNOWN',
    kind: 'Data Error',
    stage: evidence.stage ?? inferStage(message),
    ruleId: null,
    source: 'needs-model',
    confidence: 'certain',
    responsibilityDependsOnIntent: false,
    retry: null,
    code: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════

export interface MessageContext {
  /** What the step was after: a task link, a field label. */
  target?: string;
  /** The pod or environment name. */
  instance?: string;
  /** Step number and label, e.g. 'Step 8 (Open Register Supplier)'. */
  step?: string;
  /** How many candidates the engine enumerated before concluding absence. */
  searched?: number;
  /** The raw text, used verbatim where nothing better can be said. */
  raw?: string;
}

/**
 * The sentence a human should read.
 *
 * The rule for every branch: say what is wrong, then who must act. A message
 * that only restates the exception ("Timeout 80000ms exceeded") is the status
 * quo this replaces.
 */
export function buildMessage(verdict: Verdict, ctx: MessageContext = {}): string {
  const where = ctx.step ? `${ctx.step}: ` : '';
  const on = ctx.instance ? ` on ${ctx.instance}` : ' on this instance';
  const thing = ctx.target ? `"${ctx.target}"` : 'the target';

  switch (verdict.category) {
    case 'TARGET_NOT_PRESENT': {
      const searched =
        typeof ctx.searched === 'number' ? ` (${ctx.searched} candidates were enumerated)` : '';
      return (
        `${where}${thing} is not available${on}${searched}. ` +
        `This is a provisioning gap, not a timeout and not a selector fault — ` +
        `the script cannot proceed until the task is added to this environment. ` +
        `Action: ask whoever provisions${on.replace(' on ', ' ')} to enable it.`
      );
    }
    case 'STATE_CONFLICT':
      // JBO-25014 lands here too, and it is OURS — same category, opposite
      // owner — so the sentence follows the responsibility, not the category.
      if (verdict.responsibility === 'AUTOMATION_ERROR') {
        return (
          `${where}Oracle reported that the record changed under us. In a single-user replay there is no ` +
          `other user, so this is the replayer re-submitting a stale copy. ` +
          `Action: the step must re-read the record before it saves.`
        );
      }
      return (
        `${where}Oracle refused the action because the record is no longer in a state that allows it ` +
        `(typically already actioned, or changed by another user). ` +
        `Nothing is broken: the application behaved as designed. Action: re-run against a fresh record.`
      );
    case 'DUPLICATE_RECORD':
      return (
        `${where}Oracle rejected the submit because a value that must be unique already exists. ` +
        `The application behaved as designed. Action: supply a new value for the run.` +
        (ctx.raw ? ` Oracle said: ${ctx.raw}` : '')
      );
    case 'SESSION_EXPIRED':
      return (
        `${where}The browser was on a sign-in page, so no step could run${on}. ` +
        `Every later timeout in this run is a consequence, not a cause. ` +
        `Action: check the run's credentials and the instance's SSO.`
      );
    case 'ACCESS_DENIED':
      return (
        `${where}The instance returned an access-denied page${on}. ` +
        `The sign-in worked; the user is not entitled to this page. Action: grant the role.`
      );
    case 'UNRESOLVED_PARAMETER':
      return (
        `${where}A parameter was never resolved, so the step ran with a placeholder instead of a value. ` +
        `Action: fix the parameter binding, or the upstream script that was to supply it.`
      );
    case 'FILL_NOT_COMMITTED':
      return (
        `${where}${thing} was filled but did not keep the value — the field read back different. ` +
        `Action: the field needs a commit gesture (blur, Tab or Enter) the recording did not capture.`
      );
    case 'VALIDATION_REJECTED':
      return (
        `${where}Oracle rejected the submit and said why. ` +
        (verdict.kind === 'Setup Missing'
          ? `The value refers to something not configured${on}. Action: configure it, or use a configured value.`
          : `Required information was missing. Action: complete the run's data.`) +
        (ctx.raw ? ` Oracle said: ${ctx.raw}` : '')
      );
    case 'AMBIGUOUS_TARGET':
      return (
        `${where}The step's locator matched more than one element, so it refused to guess. ` +
        `Action: the recording needs a narrower selector.`
      );
    case 'ELEMENT_NOT_INTERACTABLE':
      return (
        `${where}${thing} was found but could not be acted on — it was hidden or off-screen. ` +
        `Action: the step needs a scroll or a wait the recording did not capture.`
      );
    case 'OPTION_NOT_AVAILABLE':
      return (
        `${where}The value the run supplied was not among the options offered${on}. ` +
        `Action: check the run's data against what this environment allows.`
      );
    case 'BROWSER_LOST':
      return (
        `${where}The browser closed while the run was still going, so the outcome is unknown. ` +
        `Action: re-run; if it repeats, the runner host is short of memory.`
      );
    case 'RUN_CANCELLED':
      return `${where}The run was stopped by an operator. Nothing failed.`;
    case 'RUNNER_FAILED':
      return (
        `${where}The runner stopped before it could report an outcome. ` +
        `Action: re-run; this is not a result about the application.`
      );
    case 'LOCATOR_TIMEOUT':
      return (
        `${where}${thing} never appeared within the step's time limit${on}, and the cause is not ` +
        `determinable from the failure alone — a renamed label, a slow page and a missing setup all ` +
        `look like this. Action: open the screenshot for this step before assuming a selector fault.` +
        (ctx.raw ? ` Raw: ${ctx.raw}` : '')
      );
    case 'UNCLASSIFIED':
    default:
      return `${where}${ctx.raw ?? 'The step failed and no rule recognised the failure.'}`;
  }
}
