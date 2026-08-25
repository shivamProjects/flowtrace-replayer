/**
 * Shared types between the two AI-recovery implementations
 * (ai-recovery-cli.ts and ai-recovery-api.ts) and the dispatcher
 * (ai-recovery.ts) that picks between them.
 *
 * Kept in one place so the two implementations cannot drift into
 * incompatible result shapes — the dispatcher and the report/pipeline code
 * downstream see exactly one RecoveryResult shape no matter which method ran.
 */

export interface RecoveryContext {
  index: number;
  action: string;
  /** The human label of the field/control, when the recording has one. */
  label: string;
  /** The value the step was meant to commit, if any. */
  value: string;
  /** The selector that failed. */
  selector: string;
  description: string;
  error: string;
}

/**
 * A step Claude actually performed, in the same shape the replayer executes.
 * These are what get stored back on the recording as `ai`, so the next run
 * replays the fix directly instead of paying for recovery again.
 */
export interface HealStep {
  action: string;
  type: string;
  locator?: { selector: string };
  value?: string;
  key?: string;
}

/**
 * Claude's self-reported outcome, delivered through the `done` tool.
 *
 * Shared so both transports report a verdict in the same shape — and so
 * neither has to inline an anonymous type that TypeScript then narrows to
 * `null` at every read site.
 */
export interface Verdict {
  success: boolean;
  explanation: string;
}

/** Token counts for one recovery attempt. */
export interface RecoveryUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export interface RecoveryResult {
  attempted: boolean;
  recovered: boolean;
  summary: string;
  /** One line per tool call — the audit trail that goes into the report. */
  actions: string[];
  /** Replayable version of the fix. Empty when nothing was recovered. */
  healSteps: HealStep[];
  /** Which model ran, for the usage log. */
  model: string;
  /** Summed/reported token usage — zeros when the call never reached Claude. */
  usage: RecoveryUsage;
  /** Wall-clock time for the whole attempt, including a failed call. */
  durationMs: number;
  /**
   * Set only when the call itself failed to run at all (missing binary/key,
   * not logged in, network/4xx/5xx, timeout) — distinguishes "Claude ran and
   * could not fix the step" from "Claude never ran". The dispatcher also uses
   * this to decide whether a CLI failure is safe to retry via the API.
   */
  apiError?: string;
  /** Which transport actually ran — informational only, never shown in the
   *  report/PDF. Lets the dispatcher's console log say what happened without
   *  the two implementations needing to know about each other. */
  method?: 'cli' | 'api';
  /** The claude CLI's own session id, when the CLI transport ran. The
   *  dispatcher persists this so a LATER attempt (any script) can
   *  `--resume` it instead of starting from zero context every time. */
  sessionId?: string;
}

export function zeroUsage(): RecoveryUsage {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };
}

/**
 * Claude resolves selectors with `.first()`; the replayer resolves them
 * strictly. A selector that matches three elements therefore works here and
 * then fails on replay — so pin it to the first match before storing it.
 */
export function pinToFirst(selector: string): string {
  // `>>nth=0` is as valid as `>> nth=0`, so the guard cannot require whitespace
  // — matching only the spaced form would double-pin an already-pinned selector.
  return /(^|\s|>>)\s*nth=/.test(selector) ? selector : `${selector} >> nth=0`;
}

/** Model default shared by both transports — a subscription/CLI run resolves
 *  this the same as a pinned API call would. Sonnet 5, not Opus: recovery is
 *  selector-hunting, not deep reasoning, and Opus costs meaningfully more for
 *  no accuracy gain on this task. */
export const DEFAULT_RECOVERY_MODEL = 'claude-sonnet-5';

/** Cap on the HTML one `inspect` returns. Every tool result stays in the
 *  conversation and is resent on each later iteration, so this is not paid
 *  once — it is paid once per remaining iteration. */
export const MAX_INSPECT_HTML = 1500;

export function truncate(s: string, n = MAX_INSPECT_HTML): string {
  if (!s) return '(empty)';
  return s.length > n ? s.slice(0, n) + `\n…(truncated, ${s.length} chars total)` : s;
}

/**
 * The vendor-neutral half of the recovery prompt.
 *
 * Application-specific guidance is NOT here — it comes from the active patch's
 * `recoveryHints()` and is appended by `recoverySystemPrompt()`. This file is
 * shared by every transport, so a fact about Oracle stated here would be sent to
 * the model while replaying SAP.
 */
const RECOVERY_PROMPT_BASE =
  'You are recovering a failed step in a browser automation replay. A recorded ' +
  'selector did not work. ' +
  "Your job is to achieve the step's stated goal on the live page, then hand control back.\n\n" +
  'How to work:\n' +
  '- Inspect before you act. Use find and inspect to see the real structure rather than guessing.\n' +
  '- Do the minimum needed to complete THIS step. Do not navigate away, submit forms, or ' +
  'perform later steps in the flow — the replayer will continue from here.\n' +
  '- Always verify with read_value before calling done. Never report success you have not verified.\n' +
  '- If you cannot complete it, call done with success=false and say what blocked you.';

/**
 * Build the system prompt: the neutral rules plus whatever the active
 * application patch knows about its own widgets.
 *
 * `productName` names the product being replayed — "Oracle Fusion Cloud", "SAP
 * S/4HANA". Worth stating separately from `hints` because it is what the model
 * reasons from when a page shows something no hint anticipated: knowing it is
 * looking at ADF is useful even for a widget nobody wrote a hint about.
 *
 * Both are optional, and omitting them is safe — the model works without vendor
 * guidance rather than being told the wrong vendor.
 */
export function recoverySystemPrompt(hints?: string[], productName?: string): string {
  // 'this application' is GenericPatch's placeholder, not a product — naming it
  // as one would tell the model the app is literally called that.
  const named = productName && productName !== 'this application' ? productName : '';
  if (!named && !hints?.length) return RECOVERY_PROMPT_BASE;

  // One statement of the product, in the heading. A separate "- belongs to X"
  // bullet said the same thing a second time, and the patch's own first hint
  // usually says it a third.
  let out = RECOVERY_PROMPT_BASE + '\n\n';
  out += named ? `About this application — you are replaying ${named}:\n` : 'About this application:\n';
  if (hints?.length) {
    out += hints.map((h) => (h.startsWith('-') ? h : `- ${h}`)).join('\n');
  }
  return out.trimEnd();
}

export function recoveryGoal(ctx: RecoveryContext): string {
  return ctx.value
    ? `Set "${ctx.label || ctx.description}" to "${ctx.value}".`
    : `Complete this step: ${ctx.description || ctx.action}.`;
}

export function recoveryUserPrompt(ctx: RecoveryContext, pageUrl: string): string {
  return (
    `GOAL: ${recoveryGoal(ctx)}\n\n` +
    `The recorded step failed.\n` +
    `  action:      ${ctx.action}\n` +
    `  description: ${ctx.description}\n` +
    `  selector:    ${ctx.selector}\n` +
    `  error:       ${ctx.error}\n\n` +
    `Current page URL: ${pageUrl}\n\n` +
    `Work out why it failed and complete the goal.`
  );
}

/**
 * Which API provider to use, resolving the two spellings of the variable.
 *
 * `AI_RECOVERY_PROVIDER` is the older name. It is honoured as a deprecated
 * fallback because for a while only the old name was documented while only the
 * new one was read, so a .env setting the documented variable did nothing.
 *
 * Shared rather than duplicated: this module previously had the resolver while
 * ./ai-recovery read `AI_RECOVERY_PROVIDER` alone, so setting only the CURRENT
 * name left that module on 'anthropic' no matter what — a silent disagreement
 * about which provider the run was using.
 */
let warnedLegacyProvider = false;
export function apiProviderId(): string {
  const current = process.env.AI_RECOVERY_API_PROVIDER;
  const legacy = process.env.AI_RECOVERY_PROVIDER;
  if (!current && legacy && !warnedLegacyProvider) {
    warnedLegacyProvider = true;
    console.log(
      `[AI] AI_RECOVERY_PROVIDER is deprecated — use AI_RECOVERY_API_PROVIDER. ` +
      `Honouring "${legacy}" for now.`,
    );
  }
  return (current || legacy || 'anthropic').toLowerCase();
}
