/**
 * AI step recovery — generic OpenAI-compatible HTTPS transport.
 *
 * Covers any provider that speaks the OpenAI chat-completions shape over
 * plain HTTPS: no SDK per provider, one dependency-free client config-driven
 * by { baseUrl, apiKeyEnvVar, defaultModel }. Verified against two real
 * providers before writing this:
 *   - OpenAI itself (the shape this format IS).
 *   - Gemini's OpenAI-compatible endpoint (ai.google.dev/gemini-api/docs/openai):
 *     https://generativelanguage.googleapis.com/v1beta/openai/chat/completions,
 *     `Authorization: Bearer $GEMINI_API_KEY`, full function-calling support,
 *     model id `gemini-3.7-flash` used as-is.
 *
 * Deliberately hand-rolls the tool-call loop (no vendor SDK's tool-runner
 * helper) — the loop shape is: POST messages+tools, if the reply carries
 * tool_calls execute them and append results as role:'tool' messages, repeat
 * until a plain text reply, our own `done` tool fires, or maxIterations is
 * hit. Any future OpenAI-shaped provider (DeepSeek, Groq, Mistral, etc.)
 * plugs in as one more config entry, not a new implementation.
 */

import type { Page } from '@playwright/test';
import {
  RecoveryContext, RecoveryResult, RecoveryUsage, HealStep,
  zeroUsage, pinToFirst, truncate, recoverySystemPrompt, recoveryUserPrompt,
} from './ai-recovery-types';

export interface OpenAiCompatibleProviderConfig {
  /** e.g. 'gemini', 'openai' — used only for log lines and the RecoveryResult.model prefix. */
  id: string;
  baseUrl: string;
  /** Env var holding the API key, e.g. 'GEMINI_API_KEY' or 'OPENAI_API_KEY'. */
  apiKeyEnvVar: string;
  defaultModel: string;
  /**
   * Provider-specific fields merged into every chat/completions request body.
   *
   * OpenAI's gpt-5.6 family is a reasoning model, and per OpenAI/Azure's own
   * docs a Chat Completions request that includes function tools FAILS
   * unless `reasoning_effort` is explicitly set to 'none' — this is not
   * something I could live-verify (no OpenAI API key available where this
   * was built), so treat it as needing confirmation on first real run rather
   * than as proven. Gemini's OpenAI-compat endpoint has no equivalent
   * caveat in its docs, so it gets no extra body fields.
   */
  extraBody?: Record<string, unknown>;
}

export const OPENAI_COMPATIBLE_PROVIDERS: Record<string, OpenAiCompatibleProviderConfig> = {
  gemini: {
    id: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    defaultModel: 'gemini-3.7-flash',
  },
  openai: {
    id: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-5.6-terra',
    extraBody: { reasoning_effort: 'none' },
  },
};

/** OpenAI-shaped tool declaration — same `parameters` JSON Schema shape used
 *  by the CLI transport's zod schemas and the head file's betaTool schemas,
 *  just without a schema-builder library since this is plain HTTPS. */
interface ToolDecl {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties: false;
    };
  };
}

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

export interface RecoverViaOpenAiCompatibleOptions {
  provider: OpenAiCompatibleProviderConfig;
  model: string;
  maxIterations: number;
  timeoutMs: number;
  /**
   * Masks recorded VALUES before they reach a log line, `actions[]` or the PDF.
   *
   * No identity default: omitting it suppresses the output entirely instead,
   * because a silent identity fallback is exactly how a typed password reached
   * stdout, the service log and the SSE stream once already. An unreadable log
   * beats a leaked credential.
   */
  redact?: (s: string) => string;
  /** Vendor guidance from the active patch — see AppPatch.recoveryHints(). */
  recoveryHints?: string[];
  /** The product being replayed — see AppPatch.productName. */
  productName?: string;
}

export async function recoverWithOpenAiCompatible(
  page: Page,
  ctx: RecoveryContext,
  opts: RecoverViaOpenAiCompatibleOptions
): Promise<RecoveryResult> {
  const { provider, model, maxIterations, timeoutMs } = opts;
  const actions: string[] = [];
  const healSteps: HealStep[] = [];
  const startedAt = Date.now();
  const usage: RecoveryUsage = zeroUsage();

  const apiKey = process.env[provider.apiKeyEnvVar];
  if (!apiKey) {
    return {
      attempted: false, recovered: false,
      summary: `AI recovery disabled: ${provider.apiKeyEnvVar} is not set`,
      actions, healSteps, model, usage, durationMs: 0, method: 'api',
    };
  }

  let verdict: { success: boolean; explanation: string } | null = null;

  const redact = opts.redact
    ?? ((v: string) => `«unredacted output suppressed: ${String(v).length} chars»`);

  // Everything that leaves this module goes through redact() — `actions` is
  // rendered in the PDF, not just logged.
  const log = (line: string) => {
    const safe = redact(line);
    actions.push(safe);
    console.log(`[AI:${provider.id}] ${safe}`);
  };

  const record = (step: HealStep) => {
    const prev = healSteps[healSteps.length - 1];
    if (
      prev && step.action === 'fill' && prev.action === 'fill' &&
      prev.locator?.selector === step.locator?.selector
    ) {
      healSteps[healSteps.length - 1] = step;
      return;
    }
    healSteps.push(step);
  };

  const loc = (selector: string) => page.locator(selector).first();

  // ── Tool bodies — same logic as ai-recovery-cli.ts's MCP handlers and the
  // head file's betaTool handlers, just returning plain strings here since
  // this transport builds its own message objects rather than MCP/SDK
  // content blocks. ──────────────────────────────────────────────────────
  const toolBodies: Record<string, (args: any) => Promise<string>> = {
    inspect: async ({ selector }) => {
      log(`inspect ${selector}`);
      const html = await loc(selector).evaluate((el) => el.outerHTML).catch((e) => `(error: ${e.message})`);
      return truncate(html);
    },
    find: async ({ text: needleText }) => {
      log(`find "${needleText}"`);
      const found = await page.evaluate((needle: string) => {
        const q = needle.toLowerCase();
        const out: string[] = [];
        const all = Array.from(document.querySelectorAll('*')) as HTMLElement[];
        for (const el of all) {
          if (out.length >= 25) break;
          const label = el.getAttribute('aria-label') || '';
          const elText = (el.textContent || '').trim();
          const own = elText.length < 120 ? elText : '';
          if (!label.toLowerCase().includes(q) && !own.toLowerCase().includes(q)) continue;
          const r = el.getBoundingClientRect();
          const attrs = ['id', 'role', 'aria-label', 'aria-haspopup', 'aria-autocomplete',
                         'aria-expanded', 'title', 'class', 'type']
            .map((a) => (el.getAttribute(a) ? `${a}="${el.getAttribute(a)}"` : ''))
            .filter(Boolean)
            .join(' ');
          out.push(`<${el.tagName.toLowerCase()} ${attrs}> visible=${r.width > 0 && r.height > 0} text="${own.slice(0, 60)}"`);
        }
        return out;
      }, needleText).catch((e) => [`(error: ${e.message})`]);
      return found.length ? found.join('\n') : `no elements matched "${needleText}"`;
    },
    type_into: async ({ selector, value }) => {
      log(`type_into ${selector} = "${value}"`);
      try {
        const el = loc(selector);
        await el.click({ timeout: 15_000 });
        await el.clear();
        await el.pressSequentially(value, { timeout: 20_000 });
        await page.waitForTimeout(1_200);
        const now = await el.inputValue().catch(() => '(not an input)');
        record({ action: 'fill', type: 'fill', locator: { selector: pinToFirst(selector) }, value });
        return `typed. field now reads "${now}"`;
      } catch (e: any) {
        return `failed: ${e.message}`;
      }
    },
    click: async ({ selector }) => {
      log(`click ${selector}`);
      try {
        await loc(selector).click({ timeout: 20_000 });
        await page.waitForTimeout(1_200);
        record({ action: 'click', type: 'click', locator: { selector: pinToFirst(selector) } });
        return 'clicked';
      } catch (e: any) {
        return `failed: ${e.message}`;
      }
    },
    press: async ({ key }) => {
      log(`press ${key}`);
      await page.keyboard.press(key);
      await page.waitForTimeout(1_000);
      record({ action: 'press', type: 'press', key });
      return `pressed ${key}`;
    },
    read_value: async ({ selector }) => {
      log(`read_value ${selector}`);
      const el = loc(selector);
      let v = await el.inputValue().catch(() => null);
      if (v === null || v === '') v = (await el.textContent().catch(() => '')) ?? '';
      return `"${String(v).trim()}"`;
    },
    done: async ({ success, explanation }) => {
      verdict = { success, explanation };
      log(`done success=${success}: ${explanation}`);
      return 'control returned to the replayer';
    },
  };

  const tools: ToolDecl[] = [
    { type: 'function', function: { name: 'inspect', description: 'Return the HTML of the first element matching a CSS selector, so you can see its real structure and attributes. Use this before guessing at selectors.', parameters: { type: 'object', properties: { selector: { type: 'string', description: 'A CSS selector.' } }, required: ['selector'], additionalProperties: false } } },
    { type: 'function', function: { name: 'find', description: 'Find candidate elements by visible text, aria-label, or role. Returns each match with its tag, id, key attributes and whether it is visible. Use this to locate a control when the recorded selector no longer matches.', parameters: { type: 'object', properties: { text: { type: 'string', description: 'Text or label to search for (case-insensitive).' } }, required: ['text'], additionalProperties: false } } },
    { type: 'function', function: { name: 'type_into', description: 'Focus an input and type a value using real keystrokes. Use this for search/autosuggest fields whose option list is only fetched once you type. Returns what the field holds afterwards.', parameters: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'], additionalProperties: false } } },
    { type: 'function', function: { name: 'click', description: 'Click the first element matching a CSS selector.', parameters: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'], additionalProperties: false } } },
    { type: 'function', function: { name: 'press', description: 'Press a keyboard key (e.g. "Tab", "Enter", "ArrowDown"). Many fields commit their value on Tab or Enter.', parameters: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'], additionalProperties: false } } },
    { type: 'function', function: { name: 'read_value', description: 'Read back what an element currently holds (input value, else text). Use this to VERIFY your fix actually took effect before calling done.', parameters: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'], additionalProperties: false } } },
    { type: 'function', function: { name: 'done', description: 'Hand control back to the replayer. Call this only after you have verified the outcome with read_value, or when you are certain you cannot complete the step.', parameters: { type: 'object', properties: { success: { type: 'boolean', description: 'True only if you VERIFIED the step is now complete.' }, explanation: { type: 'string', description: 'What was wrong and what you did, in one or two sentences.' } }, required: ['success', 'explanation'], additionalProperties: false } } },
  ];

  const messages: OpenAiMessage[] = [
    { role: 'system', content: recoverySystemPrompt(opts.recoveryHints, opts.productName) },
    { role: 'user', content: recoveryUserPrompt(ctx, page.url()) },
  ];

  console.log(
    `\n[AI:${provider.id}] ── recovery starting for step ${ctx.index + 1}: ${ctx.description} ` +
    `(max ${maxIterations} iterations) ──`
  );

  const fail = (msg: string): RecoveryResult => {
    log(`recovery error: ${msg}`);
    return {
      attempted: true, recovered: false, summary: `AI recovery errored: ${msg}`,
      actions, healSteps: [], model, usage, durationMs: Date.now() - startedAt,
      apiError: msg, method: 'api',
    };
  };

  try {
    for (let iteration = 0; iteration < maxIterations && !verdict; iteration++) {
      const controller = new AbortController();
      const remainingMs = timeoutMs - (Date.now() - startedAt);
      if (remainingMs <= 0) return fail(`timed out after ${timeoutMs}ms`);
      const timer = setTimeout(() => controller.abort(), remainingMs);

      let res: Response;
      try {
        res = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', ...provider.extraBody }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return fail(`HTTP ${res.status} from ${provider.id}: ${body.slice(0, 500)}`);
      }

      const data: any = await res.json();
      const u = data.usage;
      if (u) {
        // Cumulative-report shape, not per-iteration delta — matches how the
        // CLI transport's terminal `result` event is read, so all three
        // transports agree on "usage is the run total, not a sum you build yourself."
        usage.input_tokens = u.prompt_tokens ?? usage.input_tokens;
        usage.output_tokens = u.completion_tokens ?? usage.output_tokens;
        usage.cache_read_input_tokens = u.prompt_tokens_details?.cached_tokens ?? usage.cache_read_input_tokens;
      }

      const choice = data.choices?.[0];
      const msg: OpenAiMessage | undefined = choice?.message;
      if (!msg) return fail(`no message in ${provider.id} response: ${JSON.stringify(data).slice(0, 500)}`);

      if (!msg.tool_calls || !msg.tool_calls.length) {
        // Model replied with plain text and never called `done` — same
        // "stopped without a verdict" case the CLI/head-API transports hit.
        messages.push(msg);
        break;
      }

      messages.push(msg);
      for (const call of msg.tool_calls) {
        const body = toolBodies[call.function.name];
        let result: string;
        if (!body) {
          result = `unknown tool "${call.function.name}"`;
        } else {
          let args: any = {};
          try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* leave {} */ }
          result = await body(args);
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: result });
      }
    }
  } catch (e: any) {
    return fail(e.name === 'AbortError' ? `timed out after ${timeoutMs}ms` : e.message);
  }

  if (!verdict) {
    return {
      attempted: true, recovered: false,
      summary: `AI recovery stopped after ${actions.length} action(s) without reporting a verdict`,
      actions, healSteps: [], model, usage, durationMs: Date.now() - startedAt, method: 'api',
    };
  }

  const recovered = (verdict as { success: boolean }).success;
  return {
    attempted: true, recovered,
    summary: (verdict as { explanation: string }).explanation,
    actions,
    healSteps: recovered ? healSteps : [],
    model, usage, durationMs: Date.now() - startedAt, method: 'api',
  };
}
