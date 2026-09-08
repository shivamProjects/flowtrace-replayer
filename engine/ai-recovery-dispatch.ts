/**
 * AI step recovery — dispatcher.
 *
 * The only file that changed at the call site (action-replayer.spec.ts now
 * imports recoverWithClaude/isRecoveryEnabled from here instead of from
 * ./ai-recovery directly). Everything it depends on is additive:
 *
 *   ./ai-recovery                    UNCHANGED, matches main exactly.
 *                                     Anthropic API transport (the 'anthropic'
 *                                     provider under AI_RECOVERY_METHOD=api).
 *   ./ai-recovery-cli                 NEW. Claude CLI/subscription transport.
 *   ./ai-recovery-openai-compatible   NEW. Generic HTTPS transport for any
 *                                     OpenAI-chat-completions-shaped provider
 *                                     (gemini, openai today).
 *   ./ai-recovery-types                NEW. Shared RecoveryResult contract.
 *
 * ── Method selection ──────────────────────────────────────────────────────
 * AI_RECOVERY_METHOD = 'cli' (default) | 'api'
 *   'cli' — try the claude CLI (subscription billing). If it looks logged out
 *           (cheap local check, no network round trip) or the live run itself
 *           fails to even start (missing binary / not logged in), fall back
 *           to the API path for THIS attempt — console.log only, the
 *           RecoveryResult shape is identical either way so the report/PDF
 *           never shows which transport ran.
 *   'api'  — skip the CLI entirely, go straight to the API path.
 *
 * AI_RECOVERY_API_PROVIDER = 'anthropic' (default) | 'gemini' | 'openai'
 *   Only consulted when the API path runs (explicit AI_RECOVERY_METHOD=api,
 *   or as the CLI's fallback). 'anthropic' calls the untouched ./ai-recovery
 *   file; 'gemini'/'openai' go through the generic HTTPS client.
 *
 * ── Cross-script fix library ──────────────────────────────────────────────
 * Before spending anything on AI recovery, check .ai-recovery-fixes.json (a
 * local, gitignored cache — same convention as .commit-error-types.json) for
 * a previously-solved issue of the same shape (same field label + same error
 * classification, NOT the same selector — Oracle regenerates ids per session,
 * see healWriter.js's stabilizeSelector). If a match's steps replay cleanly,
 * that's the whole recovery for near-zero cost. Only fall through to a real
 * AI call when no cached fix applies. A successful NEW recovery is written
 * back here so every OTHER script benefits immediately, not just the one
 * that discovered it — closing the gap where a fix previously only ever
 * landed on cus_script.ai for the one script that triggered it.
 *
 * ── CLI session reuse ──────────────────────────────────────────────────────
 * The claude CLI's session store is file-backed under ~/.claude/, so a
 * session survives across the process-per-script boundary specRunner.js
 * imposes — verified live: --resume <id> plus a BRAND NEW --mcp-config in a
 * separate process invocation correctly retained earlier context AND called
 * the new server's tools. The session id is persisted in the same fix-library
 * file. Once the session's reported context usage crosses
 * AI_RECOVERY_COMPACT_THRESHOLD (default 0.6), '/compact' is sent as the next
 * resumed prompt before the real recovery prompt — also verified live:
 * triggers real compaction (confirmed via the compact_boundary event) and the
 * summary correctly preserved the prior context in testing.
 */

import type { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { recoverWithClaude as recoverWithClaudeApiHead, isRecoveryEnabled as isRecoveryEnabledHead } from './ai-recovery';
import { recoverWithClaudeViaCli } from './ai-recovery-cli';
import { recoverWithOpenAiCompatible, OPENAI_COMPATIBLE_PROVIDERS } from './ai-recovery-openai-compatible';
import { RecoveryContext, RecoveryResult, HealStep, DEFAULT_RECOVERY_MODEL, apiProviderId, zeroUsage } from './ai-recovery-types';

export type { RecoveryContext, HealStep, RecoveryResult } from './ai-recovery-types';

/** Passed through from main.ts to whichever transport runs. */
export interface RecoveryOptions {
  /** What the RUN has left; caps the transport's own timeout. */
  budgetMs?: number;
  /** Masks recorded values in logs, `actions[]` and the PDF. */
  redact?: (s: string) => string;
  /**
   * Facts about the application being replayed, from the active patch. Supplied
   * by the caller because only it knows which patch is in play — the transports
   * are deliberately vendor-agnostic.
   */
  recoveryHints?: string[];
  /** The product being replayed, from AppPatch.productName. */
  productName?: string;
}

// ── Config ───────────────────────────────────────────────────────────────

function useCliMethod(): boolean {
  return (process.env.AI_RECOVERY_METHOD || 'cli').toLowerCase() !== 'api';
}



/**
 * Cheap, network-free signal that the claude CLI is probably logged in —
 * same heuristic already validated in Workflow Studio's credentials.ts
 * (~/.claude/settings.json existing means the CLI/VS Code extension has been
 * through its own auth flow). Not a guarantee — a stale/expired session
 * still looks "logged in" here — which is exactly why the live-failure
 * fallback below exists as a second, real safety net.
 */
function claudeCliLikelyAuthenticated(): boolean {
  try {
    return fs.existsSync(path.join(os.homedir(), '.claude', 'settings.json'));
  } catch {
    return false;
  }
}

// ── Cross-script fix library ────────────────────────────────────────────

const FIX_LIBRARY_PATH = path.join(__dirname, '..', '.ai-recovery-fixes.json');
const COMPACT_THRESHOLD = Number(process.env.AI_RECOVERY_COMPACT_THRESHOLD || '0.6');
/** Rough chars-per-token so a threshold expressed as "% of context" can be
 *  checked without a tokenizer — the CLI's own compact_boundary event
 *  reports exact pre/post token counts once compaction actually runs; this
 *  is only used to decide WHEN to ask for it. */
const APPROX_CHARS_PER_TOKEN = 4;
const CLI_CONTEXT_WINDOW_TOKENS = 200_000;

interface FixEntry {
  matchKey: { label: string; errorType: string };
  fix: HealStep[];
  resolvedAt: string;
  /** How many recovery attempts (across any script) this exact fix has
   *  helped with — a rough confidence signal, not per-script attribution.
   *  RecoveryContext carries no script identifier, only a step index, so
   *  there is nothing reliable to attribute a "which scripts" list to here. */
  hitCount: number;
}

interface FixLibrary {
  issues: FixEntry[];
  lastSessionId?: string;
  /** Running estimate of the resumed session's context size, updated after
   *  every recovery attempt from the CLI's own reported usage. */
  approxSessionTokens?: number;
}

function loadFixLibrary(): FixLibrary {
  try {
    const raw = fs.readFileSync(FIX_LIBRARY_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.issues)) return parsed;
  } catch { /* missing/corrupt — start fresh */ }
  return { issues: [] };
}

/**
 * Write is last-writer-wins, not transactional — deliberately simpler than
 * healWriter.js's DB `FOR UPDATE` approach. Worst case under concurrent
 * script executions is a lost hitCount increment or a slightly stale
 * lastSessionId, neither of which corrupts anything or loses a fix (an
 * entry already on disk is never removed by another writer, only appended
 * to or have its own hitCount bumped). A full lock was judged not worth the
 * complexity for a cache whose entries are individually small and additive.
 */
function saveFixLibrary(lib: FixLibrary): void {
  try {
    fs.writeFileSync(FIX_LIBRARY_PATH, JSON.stringify(lib, null, 2), 'utf-8');
  } catch (e: any) {
    console.log(`[AI] could not persist fix library: ${e.message}`);
  }
}

/** Normalize the same way regardless of casing/whitespace differences
 *  between two scripts' recordings of "conceptually the same" field. */
function normalizeLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Coarse classification so "selector not found" on two different scripts
 *  counts as the same error type even though the exact message/id differs. */
function classifyError(error: string): string {
  const e = error.toLowerCase();
  if (e.includes('timeout')) return 'timeout';
  if (e.includes('not found') || e.includes('no element') || e.includes('no node')) return 'selector-not-found';
  if (e.includes('not visible') || e.includes('detached')) return 'not-visible';
  if (e.includes('intercept')) return 'click-intercepted';
  return 'other';
}

function findCachedFix(lib: FixLibrary, ctx: RecoveryContext): FixEntry | null {
  const label = normalizeLabel(ctx.label || ctx.description);
  const errorType = classifyError(ctx.error);
  return lib.issues.find(i => i.matchKey.label === label && i.matchKey.errorType === errorType) ?? null;
}

/** Replay a cached fix's steps directly, the same way the replayer itself
 *  executes an `ai` step — no model call at all. Returns true only if every
 *  step ran without throwing; a partial failure is not applied piecemeal. */
async function tryReplayCachedFix(page: Page, entry: FixEntry): Promise<boolean> {
  try {
    for (const step of entry.fix) {
      if (step.action === 'fill' && step.locator?.selector) {
        const el = page.locator(step.locator.selector).first();
        await el.click({ timeout: 15_000 });
        await el.clear();
        await el.pressSequentially(step.value ?? '', { timeout: 20_000 });
        await page.waitForTimeout(1_200);
      } else if (step.action === 'click' && step.locator?.selector) {
        await page.locator(step.locator.selector).first().click({ timeout: 20_000 });
        await page.waitForTimeout(1_200);
      } else if (step.action === 'press' && step.key) {
        await page.keyboard.press(step.key);
        await page.waitForTimeout(1_000);
      }
    }
    return true;
  } catch {
    return false;
  }
}

function recordFix(lib: FixLibrary, ctx: RecoveryContext, healSteps: HealStep[]): void {
  const label = normalizeLabel(ctx.label || ctx.description);
  const errorType = classifyError(ctx.error);
  const existing = lib.issues.find(i => i.matchKey.label === label && i.matchKey.errorType === errorType);
  if (existing) {
    existing.fix = healSteps;
    existing.resolvedAt = new Date().toISOString();
    existing.hitCount += 1;
    return;
  }
  lib.issues.push({
    matchKey: { label, errorType },
    fix: healSteps,
    resolvedAt: new Date().toISOString(),
    hitCount: 1,
  });
}

// ── Public API ───────────────────────────────────────────────────────────

export function isRecoveryEnabled(): boolean {
  if (process.env.AI_RECOVERY_ENABLED !== 'true') return false;
  // The CLI needs no API key at all; only the api method's isRecoveryEnabled
  // (which DOES require ANTHROPIC_API_KEY) applies when method=api and
  // provider=anthropic. Gemini/OpenAI need their own key, checked lazily
  // inside recoverWithOpenAiCompatible so a missing key reports cleanly as
  // "disabled" on that specific attempt rather than blocking the whole run.
  if (useCliMethod()) return true;
  if (apiProviderId() === 'anthropic') return isRecoveryEnabledHead();
  return true;
}

/**
 * `opts` is passed straight through to whichever transport runs, and both
 * options are load-bearing rather than conveniences:
 *
 *   budgetMs — the RUN owns the clock. main.ts passes whatever the run has
 *              left, so the last recovery of a run cannot overrun the whole
 *              budget on its own and take the report down with it.
 *   redact   — without it the transports' default suppresses their output
 *              entirely (NOT identity). A silent identity fallback is exactly
 *              how a typed password reached stdout, the service log and the SSE
 *              stream once already; an unreadable log beats a leaked credential.
 */
export async function recoverWithClaude(
  page: Page,
  ctx: RecoveryContext,
  opts: RecoveryOptions = {}
): Promise<RecoveryResult> {
  if (!isRecoveryEnabled()) {
    return {
      attempted: false, recovered: false, summary: 'AI recovery disabled',
      actions: [], healSteps: [], model: DEFAULT_RECOVERY_MODEL, usage: zeroUsage(), durationMs: 0,
    };
  }

  const lib = loadFixLibrary();

  // ── Cheap path first: has this exact kind of issue already been solved
  // on ANY script? Try it before spending anything on a model call. ───────
  const cached = findCachedFix(lib, ctx);
  if (cached) {
    const start = Date.now();
    const ok = await tryReplayCachedFix(page, cached);
    if (ok) {
      console.log(`[AI] applied a cached fix for "${ctx.label || ctx.description}" (${cached.matchKey.errorType}, seen ${cached.hitCount}x before) — no model call needed`);
      cached.hitCount += 1;
      saveFixLibrary(lib);
      return {
        attempted: true, recovered: true,
        summary: `Applied a previously-learned fix (${cached.matchKey.errorType}), no AI call needed.`,
        actions: [`applied cached fix: ${cached.fix.map(s => s.action).join(' → ')}`],
        healSteps: cached.fix,
        model: 'cached', usage: zeroUsage(), durationMs: Date.now() - start,
      };
    }
    console.log(`[AI] cached fix for "${ctx.label || ctx.description}" didn't apply cleanly — falling through to AI recovery`);
  }

  const model = process.env.AI_RECOVERY_MODEL || DEFAULT_RECOVERY_MODEL;
  const maxIterations = parseInt(process.env.AI_RECOVERY_MAX_ITERATIONS || '12', 10);
  // The RUN's remaining budget always wins over the configured ceiling — see
  // the note on opts.budgetMs above.
  const configuredTimeout = parseInt(process.env.AI_RECOVERY_TIMEOUT_MS || '300000', 10);
  const timeoutMs = opts.budgetMs ? Math.min(configuredTimeout, opts.budgetMs) : configuredTimeout;

  let result: RecoveryResult;

  if (useCliMethod()) {
    const authLooksOk = claudeCliLikelyAuthenticated();
    if (!authLooksOk && process.env.ANTHROPIC_API_KEY) {
      console.log('[AI] claude CLI does not look logged in (~/.claude/settings.json missing) — using the API key for this attempt instead');
      result = await recoverViaApi(page, ctx, model, maxIterations, timeoutMs, opts);
    } else {
      result = await recoverViaCliWithSessionReuse(page, ctx, lib, model, maxIterations, timeoutMs, opts);
      const infraFailure = Boolean(result.apiError) && result.actions.length === 0 && !result.recovered;
      if (infraFailure && process.env.ANTHROPIC_API_KEY) {
        console.log(`[AI] claude CLI failed to run (${result.apiError}) — falling back to the API key for this attempt`);
        result = await recoverViaApi(page, ctx, model, maxIterations, timeoutMs, opts);
      }
    }
  } else {
    result = await recoverViaApi(page, ctx, model, maxIterations, timeoutMs, opts);
  }

  if (result.recovered && result.healSteps.length) {
    recordFix(lib, ctx, result.healSteps);
    saveFixLibrary(lib);
  }

  return result;
}

async function recoverViaApi(
  page: Page, ctx: RecoveryContext, model: string, maxIterations: number, timeoutMs: number,
  opts: RecoveryOptions = {}
): Promise<RecoveryResult> {
  const providerId = apiProviderId();
  if (providerId === 'anthropic') {
    // ./ai-recovery reports the narrower {attempted, recovered, summary, actions}
    // shape this engine has always used. Widen it to the dispatcher's contract so
    // the report/pipeline sees ONE result shape whichever transport ran.
    //
    // healSteps stays empty on purpose: that transport does not record a
    // replayable version of the fix, and inventing one would have healWriter
    // write a fix nobody verified. The step is still healed for THIS run.
    const started = Date.now();
    const head = await recoverWithClaudeApiHead(page, ctx, opts);
    return {
      ...head,
      healSteps: [],
      model,
      usage: zeroUsage(),
      durationMs: Date.now() - started,
      method: 'api',
    };
  }
  const provider = OPENAI_COMPATIBLE_PROVIDERS[providerId];
  if (!provider) {
    return {
      attempted: false, recovered: false, summary: `Unknown AI_RECOVERY_API_PROVIDER "${providerId}"`,
      actions: [], healSteps: [], model, usage: zeroUsage(), durationMs: 0,
    };
  }
  return recoverWithOpenAiCompatible(page, ctx, {
    provider,
    model: process.env.AI_RECOVERY_MODEL || provider.defaultModel,
    maxIterations,
    timeoutMs,
    redact: opts.redact,
    recoveryHints: opts.recoveryHints,
    productName: opts.productName,
  });
}

async function recoverViaCliWithSessionReuse(
  page: Page, ctx: RecoveryContext, lib: FixLibrary, model: string, maxIterations: number, timeoutMs: number,
  opts: RecoveryOptions = {}
): Promise<RecoveryResult> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { runClaudeCompact } = require('../src/services/claude-cli.js') as {
    runClaudeCompact?: (sessionId: string, timeoutMs: number) => Promise<void>;
  };

  const approxTokens = lib.approxSessionTokens ?? 0;
  const usageRatio = approxTokens / CLI_CONTEXT_WINDOW_TOKENS;
  if (lib.lastSessionId && usageRatio >= COMPACT_THRESHOLD && typeof runClaudeCompact === 'function') {
    console.log(`[AI] resumed session context ~${Math.round(usageRatio * 100)}% of window — compacting before this attempt`);
    try {
      await runClaudeCompact(lib.lastSessionId, timeoutMs);
      lib.approxSessionTokens = 0;
    } catch (e: any) {
      console.log(`[AI] compaction failed, continuing without it: ${e.message}`);
    }
  }

  const callCli = (resumeSessionId?: string) =>
    recoverWithClaudeViaCli(page, ctx, {
      model, maxIterations, timeoutMs,
      resumeSessionId,
      redact: opts.redact,
      recoveryHints: opts.recoveryHints,
      productName: opts.productName,
    });

  let result = await callCli(lib.lastSessionId);

  // A stored session id outlives the CLI's own conversation store — a different
  // machine, a cleared cache, an expired session. `--resume` then fails outright
  // with "No conversation found with session ID", and because the dead id is
  // never cleared this used to disable recovery permanently rather than for one
  // run. Resuming is an optimisation (it keeps prior context); starting fresh is
  // always valid, so drop the id and try once more.
  if (lib.lastSessionId && !result.recovered && /No conversation found with session ID/i.test(result.apiError || '')) {
    console.log('[AI] stored session is gone from the CLI — starting a fresh one');
    lib.lastSessionId = undefined;
    lib.approxSessionTokens = 0;
    result = await callCli(undefined);
  }

  if (result.sessionId) lib.lastSessionId = result.sessionId;
  const approxNewChars = result.actions.join('\n').length + (result.summary?.length ?? 0);
  lib.approxSessionTokens = (lib.approxSessionTokens ?? 0) + result.usage.input_tokens + result.usage.output_tokens
    || Math.round(approxNewChars / APPROX_CHARS_PER_TOKEN);
  saveFixLibrary(lib);

  return result;
}
