/**
 * Every timeout in the engine, in one place, split by what raising it COSTS.
 *
 * Sizing principle: a timeout is a DIAGNOSTIC, not a courtesy. This runs on
 * cloud infrastructure against a hosted Fusion pod — if a login page has not
 * loaded in a minute, waiting three more will not fix it, and every extra
 * second holds a queue slot and delays the defect that says so. Numbers here
 * are set to the slowest a HEALTHY system plausibly is, so that exceeding one
 * is information rather than routine.
 *
 * Adaptive waiting changed the economics, but not uniformly, and treating all
 * timeouts as one kind is how a run ends up either fragile or glacial.
 *
 * ── PATIENCE (free to raise) ────────────────────────────────────────────────
 * Caps on waits that return on EVIDENCE — the page went quiet, the list opened,
 * the spinner cleared. These finish the moment the thing happens, so the number
 * is a ceiling that is only ever reached in the worst case. Oracle Fusion is
 * heavy and genuinely does take 20-30s on a cold login page or a billing tile,
 * so these are set generously. A fast page pays nothing for the headroom.
 *
 * ── ABSENCE (costs real time to raise) ──────────────────────────────────────
 * Timeouts that expire because something is NOT there — an element that never
 * appears, a click that never becomes actionable. There is no evidence to
 * return on, so the full budget is spent every time, on the failure path. These
 * are deliberately NOT set to Oracle's worst case, because:
 *   • every genuine failure pays this before the step is even reported failed
 *   • AI recovery cannot start until it expires, so an over-generous value
 *     directly delays the thing most likely to rescue the run
 *   • a 40-step script that goes off the rails pays it per step
 * Kept comfortably above a slow-but-working page, well below the step budget.
 *
 * Anything here can be overridden per deployment without a code change; the
 * server this runs on is fast, but a customer pod on a bad day is not.
 */

/**
 * Known environment variables for REPLAY_RECOVERY_* configuration.
 * Any other REPLAY_RECOVERY_* variable in process.env causes a loud warning.
 */
export const KNOWN_RECOVERY_VARS = new Set([
  'REPLAY_RECOVERY_STEP_MS',
  'REPLAY_RECOVERY_MS',
  'REPLAY_RECOVERY_RUN_MS',
  'REPLAY_RECOVERY_MAX_ATTEMPTS',
]);

/**
 * Scan environment for unrecognized REPLAY_RECOVERY_* variables and warn loudly.
 */
export function validateRecoveryEnv(env: Record<string, string | undefined> = process.env): string[] {
  const warnings: string[] = [];
  for (const key of Object.keys(env)) {
    if (key.startsWith('REPLAY_RECOVERY_') && !KNOWN_RECOVERY_VARS.has(key)) {
      const msg = `[timeouts] WARNING: Unrecognized environment variable "${key}". Valid recovery variables are: ${Array.from(KNOWN_RECOVERY_VARS).join(', ')}`;
      console.warn(msg);
      warnings.push(msg);
    }
  }
  return warnings;
}

// Perform validation on module load
validateRecoveryEnv();

/**
 * Maximum delay supported by Node.js setTimeout (signed 32-bit integer: 2^31 - 1 = 2,147,483,647ms, ~24.8 days).
 * Passing a value larger than this causes Node to emit a TimeoutOverflowWarning and clamp the delay to 1ms.
 */
export const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Parse a human duration string (e.g. "90s", "2m", "500ms", or bare "90000").
 * Bare numbers are treated as milliseconds.
 * Rejects malformed values loudly by throwing an Error.
 * Rejects zero/sub-millisecond rounded results, non-finite values, and values exceeding MAX_TIMEOUT_MS (2,147,483,647ms).
 */
export function parseDuration(raw: string, varName = 'duration'): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`[timeouts] Malformed timeout value for ${varName}: value cannot be empty`);
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(ms|s|m)?$/i);
  if (!match) {
    throw new Error(
      `[timeouts] Malformed timeout value for ${varName}: "${raw}". ` +
      `Expected a positive number with optional unit (e.g. 90000, 500ms, 90s, 2m).`
    );
  }

  const val = parseFloat(match[1]);
  if (!Number.isFinite(val) || val <= 0) {
    throw new Error(
      `[timeouts] Malformed timeout value for ${varName}: "${raw}". Value must be greater than zero.`
    );
  }

  const unit = match[2]?.toLowerCase();
  let scaled: number;
  switch (unit) {
    case 'ms':
      scaled = val;
      break;
    case 's':
      scaled = val * 1_000;
      break;
    case 'm':
      scaled = val * 60_000;
      break;
    default:
      scaled = val;
      break;
  }

  const res = Math.round(scaled);
  if (!Number.isFinite(res) || res <= 0 || res > MAX_TIMEOUT_MS) {
    throw new Error(
      `[timeouts] Malformed timeout value for ${varName}: "${raw}". Duration must resolve to a finite positive millisecond integer <= ${MAX_TIMEOUT_MS} (Node.js 32-bit timer ceiling).`
    );
  }

  return res;
}

/**
 * Parse a positive integer count (e.g. "3").
 * Strictly rejects duration units (s, ms, m), floats, non-positive numbers, and values exceeding Number.MAX_SAFE_INTEGER.
 */
export function parseCount(raw: string, varName = 'count'): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`[timeouts] Malformed count value for ${varName}: value cannot be empty`);
  }

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `[timeouts] Malformed count value for ${varName}: "${raw}". ` +
      `Expected a positive integer count without duration units.`
    );
  }

  const val = Number(trimmed);
  if (!Number.isSafeInteger(val) || val <= 0) {
    throw new Error(
      `[timeouts] Malformed count value for ${varName}: "${raw}". Count must be an integer greater than zero and <= Number.MAX_SAFE_INTEGER.`
    );
  }

  return val;
}

export const num = (name: string | string[], fallback: number, env: Record<string, string | undefined> = process.env): number => {
  const names = Array.isArray(name) ? name : [name];
  for (const n of names) {
    const raw = env[n];
    if (raw !== undefined && raw.trim() !== '') {
      return parseDuration(raw, n);
    }
  }
  return fallback;
};

export const count = (name: string | string[], fallback: number, env: Record<string, string | undefined> = process.env): number => {
  const names = Array.isArray(name) ? name : [name];
  for (const n of names) {
    const raw = env[n];
    if (raw !== undefined && raw.trim() !== '') {
      return parseCount(raw, n);
    }
  }
  return fallback;
};

export const PATIENCE = {
  /** "Wait until the page stops changing" — a PPR or a heavy tile rendering. */
  settle: num('REPLAY_SETTLE_MAX_MS', 30_000),
  /** A full page load. Beyond a minute is a broken pod, not a slow one. */
  navigate: num('REPLAY_NAVIGATE_MS', 60_000),
  /** How long to keep reading a validation dialog once one HAS appeared. */
  commitScan: num('REPLAY_COMMIT_SCAN_MS', 8_000),
} as const;

export const ABSENCE = {
  /** Element never becomes visible. Paid in full on every genuine miss. */
  visible: num('REPLAY_VISIBLE_MS', 20_000),
  /** A speculative lookup whose failure is expected and recovered from. */
  visibleShort: num('REPLAY_VISIBLE_SHORT_MS', 6_000),
  /** Click / fill / press actionability. */
  action: num('REPLAY_ACTION_MS', 15_000),
  /** Reading a value back off an element. */
  read: num('REPLAY_READ_MS', 8_000),

  /**
   * Best-effort preparatory operations whose failure is already swallowed —
   * focusing a field, clearing it. Giving these the full action budget meant a
   * fill into an uneditable field burned 30s twice over before the typing that
   * actually reports the problem even started, and every second of that is a
   * second AI recovery is not running.
   */
  bestEffort: num('REPLAY_BEST_EFFORT_MS', 3_000),
  /** One <select> option-matching attempt before trying the next strategy. */
  selectProbe: num('REPLAY_SELECT_PROBE_MS', 5_000),

  /**
   * Launcher click → an LOV surface is painted.
   *
   * Belongs HERE, not in PATIENCE, and getting that wrong cost 50s a step. It
   * returns instantly when the list opens, but pays in full when it does not —
   * and "it did not open" is precisely the failure this check exists to catch,
   * so it is on the failure path every time it matters. It is also checked
   * AFTER waitForIdle has already absorbed the round trip, so the list has had
   * its chance: this is a margin for a late paint, not a budget for a fetch.
   */
  listOpen: num('REPLAY_LIST_OPEN_MS', 8_000),
  /** Re-check after the fallback click. Shorter — one chance has already gone. */
  listOpenRetry: num('REPLAY_LIST_OPEN_RETRY_MS', 3_000),

  /**
   * Grace for a refusal dialog to APPEAR after an otherwise-accepted Save.
   * Also absence, not patience: an accepted commit pays this on every Save.
   */
  commitAppear: num('REPLAY_COMMIT_APPEAR_MS', 800),
} as const;

/**
 * Quiet windows — how still the DOM must be before the page counts as settled.
 * Not timeouts: raising these makes EVERY step slower, so they stay small.
 * `autosuggest` is the exception and must exceed ADF's ~300-500ms debounce,
 * or the wait ends during the silence before the request is even sent.
 */
export const QUIET = {
  general: num('REPLAY_QUIET_MS', 150),
  autosuggest: num('REPLAY_QUIET_AUTOSUGGEST_MS', 600),
} as const;

/**
 * Ceiling on ONE step, enforced by the runner.
 *
 * A wedged step must not consume the whole run's budget — with the caps above,
 * a step that hits several in sequence could otherwise run for minutes. Hitting
 * this is treated as fatal rather than retried: a timed-out step cannot be
 * cancelled, so it may still be typing into the page, and continuing would act
 * on a document another step is concurrently changing.
 */
export const STEP_BUDGET_MS = num('REPLAY_STEP_BUDGET_MS', 90_000);

/**
 * A step slower than this is logged as slow, without failing.
 *
 * Measured against 377 real recordings and their run times, a healthy step
 * averages ~4-7s. Surfacing the outliers turns "the run was slow" into "step 23
 * took 22s", which is the difference between a hunch and a diagnosis.
 */
/**
 * Wall-clock ceiling on ONE AI recovery, and on recovery across a whole run.
 *
 * Recovery had neither. Twelve iterations of an Opus tool-runner with adaptive
 * thinking, each iteration a model round trip plus a tool call that can itself
 * wait 20s, is 6-10 minutes for a single failed step — and it fires again on
 * every subsequent failure, because a recovered step does not set fatalError.
 * All of it awaited INSIDE the run ceiling, so the failure path was the path
 * most likely to be killed before it could write a report. The thing meant to
 * rescue a run was its most likely cause of death.
 */
export const RECOVERY_STEP_MS = num(['REPLAY_RECOVERY_STEP_MS', 'REPLAY_RECOVERY_MS'], 90_000);
export const RECOVERY_RUN_MS = num('REPLAY_RECOVERY_RUN_MS', 240_000);
export const RECOVERY_MAX_ATTEMPTS = count('REPLAY_RECOVERY_MAX_ATTEMPTS', 3);

export const SLOW_STEP_MS = num('REPLAY_SLOW_STEP_MS', 15_000);

/**
 * How long to let a submitted login leave the sign-in page before calling it
 * failed.
 *
 * Generous on purpose. This budget is only ever spent on a run that is ABOUT to
 * be declared a login failure — a successful sign-in leaves the page and exits
 * the poll immediately — so a high ceiling costs nothing on the happy path and
 * a low one would fail slow IDCS redirects that were going to succeed. Oracle
 * bounces through several hops (authorize → signin → the app), and the whole
 * chain has been observed taking over 20s on a cold pod.
 */
export const LOGIN_SETTLE_MS = num('REPLAY_LOGIN_SETTLE_MS', 45_000);

/** Log the effective configuration — a slow run's first question is "what were the limits?". */
export function describeTimeouts(): string {
  return (
    `settle≤${PATIENCE.settle / 1000}s navigate≤${PATIENCE.navigate / 1000}s ` +
    `listOpen≤${ABSENCE.listOpen / 1000}s | visible≤${ABSENCE.visible / 1000}s ` +
    `action≤${ABSENCE.action / 1000}s | step≤${STEP_BUDGET_MS / 1000}s ` +
    `recoveryStep≤${RECOVERY_STEP_MS / 1000}s`
  );
}
