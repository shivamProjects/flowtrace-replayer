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

const num = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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
export const RECOVERY_STEP_MS = num('REPLAY_RECOVERY_MS', 90_000);
export const RECOVERY_RUN_MS = num('REPLAY_RECOVERY_RUN_MS', 240_000);
export const RECOVERY_MAX_ATTEMPTS = num('REPLAY_RECOVERY_MAX_ATTEMPTS', 3);

export const SLOW_STEP_MS = num('REPLAY_SLOW_STEP_MS', 15_000);

/** Log the effective configuration — a slow run's first question is "what were the limits?". */
export function describeTimeouts(): string {
  return (
    `settle≤${PATIENCE.settle / 1000}s navigate≤${PATIENCE.navigate / 1000}s ` +
    `listOpen≤${ABSENCE.listOpen / 1000}s | visible≤${ABSENCE.visible / 1000}s ` +
    `action≤${ABSENCE.action / 1000}s | step≤${STEP_BUDGET_MS / 1000}s`
  );
}
