/**
 * AI step recovery.
 *
 * When a recorded step fails, this hands the LIVE page to Claude along with the
 * step's *intent* ("set Business Unit to McGrath RentCorp"), plus tools to look
 * at the page and act on it. Claude works out why the recorded selector didn't
 * work, completes the step, verifies it, and hands control back.
 *
 * Why it lives in the spec rather than the worker: Claude needs the real browser
 * — the DOM as it is right now — not a description of it. Only this process has
 * the Playwright `page`.
 *
 * It runs ONLY on failure, so a clean run never calls the API. Every tool call
 * is recorded and returned so the PDF can show what was actually done.
 */

import type { Page } from '@playwright/test';
import Anthropic from '@anthropic-ai/sdk';
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import OpenAI from 'openai';
import { apiProviderId, recoverySystemPrompt } from './ai-recovery-types';

export interface RecoveryContext {
  index: number;
  action: string;
  description: string;
  /** The human label of the field/control, when the recording has one. */
  label: string;
  /** The value the step was meant to commit, if any. */
  value: string;
  /** The selector that failed. */
  selector: string;
  error: string;
}

export interface RecoveryResult {
  attempted: boolean;
  recovered: boolean;
  summary: string;
  /** One line per tool call — the audit trail that goes into the report. */
  actions: string[];
}

const MAX_HTML = 4000;

function truncate(s: string, n = MAX_HTML): string {
  if (!s) return '(empty)';
  return s.length > n ? s.slice(0, n) + `\n…(truncated, ${s.length} chars total)` : s;
}

export function isRecoveryEnabled(): boolean {
  if (process.env.AI_RECOVERY_ENABLED !== 'true') return false;
  const provider = apiProviderId();
  if (provider === 'openai' || provider === 'openai-compatible') {
    return Boolean(process.env.AI_RECOVERY_API_KEY || process.env.OPENAI_API_KEY);
  }
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function recoverWithClaude(
  page: Page,
  ctx: RecoveryContext,
  opts: {
    budgetMs?: number;
    redact?: (s: string) => string;
    /** Bullet lines from the active application patch, appended to the neutral
     *  base prompt. Omitting them is safe: the model works without vendor
     *  guidance, which beats a hardcoded "this is Oracle Fusion" being sent
     *  while replaying something else. */
    recoveryHints?: string[];
    productName?: string;
  } = {}
): Promise<RecoveryResult> {
  const actions: string[] = [];
  // The caller owns the clock. Without a budget one recovery could outlast the
  // whole run's ceiling and take the report down with it.
  const budgetMs = opts.budgetMs ?? 90_000;
  const deadline = Date.now() + budgetMs;
  // Neutral rules + whatever the active patch knows about its own widgets. Both
  // the Anthropic and the OpenAI branch below send this same string.
  const systemPrompt = recoverySystemPrompt(opts.recoveryHints, opts.productName);
  // No default identity function. The caller not wiring a redactor is exactly
  // how the password reached stdout, the service log and the SSE stream last
  // time — a silent fallback made the omission invisible. Masking everything is
  // the safe failure: an unreadable log beats a leaked credential.
  const redact = opts.redact ?? ((s: string) => `«unredacted output suppressed: ${String(s).length} chars»`);

  if (!isRecoveryEnabled()) {
    return { attempted: false, recovered: false, summary: 'AI recovery disabled', actions };
  }

  const provider = apiProviderId();
  const maxIterations = parseInt(process.env.AI_RECOVERY_MAX_ITERATIONS || '12', 10);

  // Claude / model reports its own verdict through this, rather than us inferring one
  // from "it stopped calling tools".
  let verdict: { success: boolean; explanation: string } | null = null;

  // Everything printed here reaches stdout -> the service log -> the SSE
  // stream. `type_into` logs the value it is typing, which on a login step is
  // the password, and this console.log never passed through the Redactor.
  const log = (line: string) => {
    const safe = redact(line);
    actions.push(safe);
    console.log(`[AI] ${safe}`);
  };

  /**
   * Resolve a selector the same way the replayer does, so Claude and the
   * replayer agree on what a selector means.
   *
   * `filter({ visible: true })` is the important half: ADF pre-renders closed
   * popups, so a bare `.first()` hands Claude the hidden copy — it then reads a
   * value off a node no operator can see and reports the step recovered.
   */
  const loc = (selector: string) => page.locator(selector).filter({ visible: true }).first();

  const runners: Record<string, (args: any) => Promise<string>> = {
    inspect: async ({ selector }: { selector: string }) => {
      log(`inspect ${selector}`);
      const html = await loc(selector).evaluate((el) => el.outerHTML).catch((e) => `(error: ${e.message})`);
      return truncate(html);
    },
    find: async ({ text }: { text: string }) => {
      log(`find "${text}"`);
      const found = await page.evaluate((needle: string) => {
        const q = needle.toLowerCase();
        const out: string[] = [];
        const all = Array.from(document.querySelectorAll('*')) as HTMLElement[];
        for (const el of all) {
          if (out.length >= 25) break;
          const label = el.getAttribute('aria-label') || '';
          const text = (el.textContent || '').trim();
          const own = text.length < 120 ? text : '';
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
      }, text).catch((e) => [`(error: ${e.message})`]);
      return found.length ? found.join('\n') : `no elements matched "${text}"`;
    },
    type_into: async ({ selector, value }: { selector: string; value: string }) => {
      log(`type_into ${selector} = "${value}"`);
      try {
        const el = loc(selector);
        await el.click({ timeout: 15_000 });
        await el.clear();
        await el.pressSequentially(value, { timeout: 20_000 });
        await page.waitForTimeout(1_200);
        const now = await el.inputValue().catch(() => '(not an input)');
        return `typed. field now reads "${now}"`;
      } catch (e: any) {
        return `failed: ${e.message}`;
      }
    },
    click: async ({ selector }: { selector: string }) => {
      log(`click ${selector}`);
      try {
        await loc(selector).click({ timeout: 20_000 });
        await page.waitForTimeout(1_200);
        return 'clicked';
      } catch (e: any) {
        return `failed: ${e.message}`;
      }
    },
    press: async ({ key }: { key: string }) => {
      log(`press ${key}`);
      await page.keyboard.press(key);
      await page.waitForTimeout(1_000);
      return `pressed ${key}`;
    },
    read_value: async ({ selector }: { selector: string }) => {
      log(`read_value ${selector}`);
      const el = loc(selector);
      // A JET/ADF wrapper holds its value on a nested <input>, so reading the
      // wrapper yields nothing and a correct fix looks like an empty field.
      let v = await el.inputValue().catch(() => null);
      if (v === null) {
        v = await el.locator('input, textarea').first().inputValue().catch(() => null);
      }
      if (v === null || v === '') v = (await el.textContent().catch(() => '')) ?? '';
      return `"${String(v).trim()}"`;
    },
    done: async ({ success, explanation }: { success: boolean; explanation: string }) => {
      verdict = { success, explanation };
      log(`done success=${success}: ${explanation}`);
      return 'control returned to the replayer';
    }
  };

  const goal = ctx.value
    ? `Set "${ctx.label || ctx.description}" to "${ctx.value}".`
    : `Complete this step: ${ctx.description || ctx.action}.`;

  // Through redact(), like every other line here — a raw console.log was how
  // the description bypassed masking entirely.
  log(`── recovery starting for step ${ctx.index + 1}: ${ctx.description} ──`);

  // Enforce the budget. Without a deadline one recovery could outlast the whole
  // run's ceiling and take the report down with it.
  const abort = new AbortController();
  const stopAt = setTimeout(() => abort.abort(), Math.max(deadline - Date.now(), 1_000));
  try {
    if (provider === 'openai' || provider === 'openai-compatible') {
      const client = new OpenAI({
        apiKey: process.env.AI_RECOVERY_API_KEY || process.env.OPENAI_API_KEY,
        baseURL: process.env.AI_RECOVERY_BASE_URL || undefined,
      });

      const modelName = process.env.AI_RECOVERY_MODEL || 'gpt-4o';

      const openAITools: OpenAI.Chat.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'inspect',
            description: 'Return the HTML of the first element matching a CSS selector, so you can see its real structure and attributes. Use this before guessing at selectors.',
            parameters: {
              type: 'object',
              properties: { selector: { type: 'string', description: 'A CSS selector.' } },
              required: ['selector'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'find',
            description: 'Find candidate elements by visible text, aria-label, or role. Returns each match with its tag, id, key attributes and whether it is visible. Use this to locate a control when the recorded selector no longer matches.',
            parameters: {
              type: 'object',
              properties: { text: { type: 'string', description: 'Text or label to search for (case-insensitive).' } },
              required: ['text'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'type_into',
            description: 'Focus an input and type a value using real keystrokes. Use this for search/autosuggest fields whose option list is only fetched once you type. Returns what the field holds afterwards.',
            parameters: {
              type: 'object',
              properties: {
                selector: { type: 'string' },
                value: { type: 'string' },
              },
              required: ['selector', 'value'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'click',
            description: 'Click the first element matching a CSS selector.',
            parameters: {
              type: 'object',
              properties: { selector: { type: 'string' } },
              required: ['selector'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'press',
            description: 'Press a keyboard key (e.g. "Tab", "Enter", "ArrowDown"). Many fields commit their value on Tab or Enter.',
            parameters: {
              type: 'object',
              properties: { key: { type: 'string' } },
              required: ['key'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'read_value',
            description: 'Read back what an element currently holds (input value, else text). Use this to VERIFY your fix actually took effect before calling done.',
            parameters: {
              type: 'object',
              properties: { selector: { type: 'string' } },
              required: ['selector'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'done',
            description: 'Hand control back to the replayer. Call this only after you have verified the outcome with read_value, or when you are certain you cannot complete the step.',
            parameters: {
              type: 'object',
              properties: {
                success: { type: 'boolean', description: 'True only if you VERIFIED the step is now complete.' },
                explanation: { type: 'string', description: 'What was wrong and what you did, in one or two sentences.' },
              },
              required: ['success', 'explanation'],
              additionalProperties: false,
            },
          },
        },
      ];

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content:
            `GOAL: ${goal}\n\n` +
            `The recorded step failed.\n` +
            `  action:      ${ctx.action}\n` +
            `  description: ${ctx.description}\n` +
            `  selector:    ${ctx.selector}\n` +
            `  error:       ${ctx.error}\n\n` +
            `Current page URL: ${page.url()}\n\n` +
            `Work out why it failed and complete the goal.`,
        },
      ];

      let iterations = 0;
      while (iterations < maxIterations && !verdict) {
        iterations++;
        
        const response = await client.chat.completions.create({
          model: modelName,
          messages,
          tools: openAITools,
          tool_choice: 'auto',
        }, { signal: abort.signal });

        const choice = response.choices[0];
        if (!choice) break;

        const message = choice.message;
        messages.push(message);

        if (message.content) {
          log(`Model: ${message.content}`);
        }

        if (!message.tool_calls || message.tool_calls.length === 0) {
          if (!verdict) {
            log('Model stopped calling tools without calling done.');
          }
          break;
        }

        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const functionCall = toolCall.function;
          const toolName = functionCall.name;
          const toolArgs = JSON.parse(functionCall.arguments);

          let toolResult = '';
          if (runners[toolName]) {
            try {
              toolResult = await runners[toolName](toolArgs);
            } catch (e: any) {
              toolResult = `Error executing tool: ${e.message}`;
            }
          } else {
            toolResult = `Tool "${toolName}" not found`;
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      }
    } else {
      // Anthropic Provider
      const client = new Anthropic();
      const inspectTool = betaTool({
        name: 'inspect',
        description:
          'Return the HTML of the first element matching a CSS selector, so you can see its real ' +
          'structure and attributes. Use this before guessing at selectors.',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string', description: 'A CSS selector.' } },
          required: ['selector'],
          additionalProperties: false,
        },
        run: runners.inspect,
      });

      const findTool = betaTool({
        name: 'find',
        description:
          'Find candidate elements by visible text, aria-label, or role. Returns each match with its ' +
          'tag, id, key attributes and whether it is visible. Use this to locate a control when the ' +
          'recorded selector no longer matches.',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text or label to search for (case-insensitive).' },
          },
          required: ['text'],
          additionalProperties: false,
        },
        run: runners.find,
      });

      const typeIntoTool = betaTool({
        name: 'type_into',
        description:
          'Focus an input and type a value using real keystrokes. Use this for search/autosuggest ' +
          'fields whose option list is only fetched once you type. Returns what the field holds afterwards.',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            value: { type: 'string' },
          },
          required: ['selector', 'value'],
          additionalProperties: false,
        },
        run: runners.type_into,
      });

      const clickTool = betaTool({
        name: 'click',
        description: 'Click the first element matching a CSS selector.',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string' } },
          required: ['selector'],
          additionalProperties: false,
        },
        run: runners.click,
      });

      const pressTool = betaTool({
        name: 'press',
        description: 'Press a keyboard key (e.g. "Tab", "Enter", "ArrowDown"). Many fields ' +
          'commit their value on Tab or Enter.',
        inputSchema: {
          type: 'object',
          properties: { key: { type: 'string' } },
          required: ['key'],
          additionalProperties: false,
        },
        run: runners.press,
      });

      const readValueTool = betaTool({
        name: 'read_value',
        description:
          'Read back what an element currently holds (input value, else text). Use this to VERIFY ' +
          'your fix actually took effect before calling done.',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string' } },
          required: ['selector'],
          additionalProperties: false,
        },
        run: runners.read_value,
      });

      const doneTool = betaTool({
        name: 'done',
        description:
          'Hand control back to the replayer. Call this only after you have verified the outcome ' +
          'with read_value, or when you are certain you cannot complete the step.',
        inputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'True only if you VERIFIED the step is now complete.' },
            explanation: { type: 'string', description: 'What was wrong and what you did, in one or two sentences.' },
          },
          required: ['success', 'explanation'],
          additionalProperties: false,
        },
        run: runners.done,
      });

      const modelName = process.env.AI_RECOVERY_MODEL || 'claude-opus-5';
      const runnerParams: any = {
        model: modelName,
        max_tokens: 16000,
        max_iterations: maxIterations,
        system: systemPrompt,
        tools: [findTool, inspectTool, typeIntoTool, clickTool, pressTool, readValueTool, doneTool],
        messages: [
          {
            role: 'user',
            content:
              `GOAL: ${goal}\n\n` +
              `The recorded step failed.\n` +
              `  action:      ${ctx.action}\n` +
              `  description: ${ctx.description}\n` +
              `  selector:    ${ctx.selector}\n` +
              `  error:       ${ctx.error}\n\n` +
              `Current page URL: ${page.url()}\n\n` +
              `Work out why it failed and complete the goal.`,
          },
        ],
      };

      // Only enable thinking on Claude 3.7+ models (e.g. claude-3-7-sonnet or claude-opus-5)
      // Claude 3.5 models (haiku, sonnet) do not support the thinking parameter.
      if (!modelName.includes('3-5') && !modelName.includes('haiku')) {
        runnerParams.thinking = { type: 'adaptive' };
      }

      await client.beta.messages.toolRunner(runnerParams, { signal: abort.signal });
    }
  } catch (e: any) {
    if (abort.signal.aborted) {
      log(`recovery hit its ${Math.round(budgetMs / 1000)}s budget and was stopped`);
      return {
        attempted: true,
        recovered: false,
        summary: `AI recovery exceeded its ${Math.round(budgetMs / 1000)}s budget`,
        actions,
      };
    }
    // A recovery failure must never be worse than the original failure.
    log(`recovery error: ${e.message}`);
    return {
      attempted: true,
      recovered: false,
      summary: `AI recovery errored: ${e.message}`,
      actions,
    };
  } finally {
    // In a finally, not after the try: both catch branches above `return`, so
    // on every error path the timer stayed armed and held the event loop open
    // until it fired.
    clearTimeout(stopAt);
  }

  if (!verdict) {
    return {
      attempted: true,
      recovered: false,
      summary: `AI recovery stopped after ${actions.length} action(s) without reporting a verdict`,
      actions,
    };
  }

  return {
    attempted: true,
    recovered: (verdict as { success: boolean }).success,
    summary: (verdict as { explanation: string }).explanation,
    actions,
  };
}
