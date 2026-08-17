/**
 * AI step recovery — Claude CLI transport (subscription billing).
 *
 * Same job as ai-recovery-api.ts (hand the live page to Claude, let it work
 * out why a recorded step failed and complete it), but Claude runs as the
 * `claude` CLI in a SEPARATE process, billed against the user's Pro/Max
 * subscription rather than an API key. That process cannot touch our
 * in-memory Playwright `page`, so we publish the browser tools as an MCP
 * server on an ephemeral localhost port and point the CLI at it with
 * `--mcp-config`. Tool calls travel back over HTTP and run here, against the
 * real browser. The server is bound to 127.0.0.1 and lives only for the
 * duration of one recovery attempt.
 *
 * Selected by ai-recovery.ts's dispatcher, not called directly by the
 * replayer — see that file for how the CLI-vs-API choice and the
 * CLI-failed-so-fall-back-to-API safety net work.
 */

import type { Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

// The SDK ships a CommonJS build alongside its ESM one, so these resolve from
// this CommonJS project without a dynamic import.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import {
  RecoveryContext, RecoveryResult, RecoveryUsage, HealStep,
  zeroUsage, pinToFirst, truncate, recoverySystemPrompt, recoveryUserPrompt,
} from './ai-recovery-types';

// Spawning the CLI, scrubbing the API key out of the child env and parsing
// stream-json is not specific to browser recovery — pg-final's parameterizer
// needs exactly the same thing. It lives in one dependency-free module that is
// copied verbatim between the two repos. See src/services/claude-cli.js.
interface CliRun {
  text: string;
  usage: RecoveryUsage;
  model: string;
  durationMs: number;
  exitCode: number | null;
  diagnostics: string;
  isError: boolean;
  sessionId?: string;
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runClaude } = require('../src/services/claude-cli.js') as {
  runClaude: (opts: Record<string, unknown>) => Promise<CliRun>;
};

export interface RecoverViaCliOptions {
  model: string;
  maxIterations: number;
  timeoutMs: number;
  /** Resume an earlier session instead of starting fresh — see
   *  src/services/claude-cli.js's runClaude for how this survives across the
   *  process-per-script boundary specRunner.js imposes. */
  resumeSessionId?: string;
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

export async function recoverWithClaudeViaCli(
  page: Page,
  ctx: RecoveryContext,
  opts: RecoverViaCliOptions
): Promise<RecoveryResult> {
  const { model, maxIterations, timeoutMs, resumeSessionId } = opts;
  const actions: string[] = [];
  const healSteps: HealStep[] = [];
  const startedAt = Date.now();
  const usage: RecoveryUsage = zeroUsage();

  // Claude reports its own verdict through the `done` tool, rather than us
  // inferring one from "it stopped calling tools".
  let verdict: { success: boolean; explanation: string } | null = null;

  const redact = opts.redact
    ?? ((v: string) => `«unredacted output suppressed: ${String(v).length} chars»`);

  // Everything that leaves this module goes through redact() — `actions` is
  // rendered in the PDF, not just logged.
  const log = (line: string) => {
    const safe = redact(line);
    actions.push(safe);
    console.log(`[AI:cli] ${safe}`);
  };

  /**
   * Record a step that actually changed the page. Only called after the tool
   * succeeded — a failed attempt must never end up in the stored fix.
   *
   * Claude often retypes into the same field while working out the right value;
   * only the last of those matters, so consecutive fills on one selector are
   * squashed rather than replayed as a sequence of half-typed values.
   */
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

  /** Resolve a selector the same way the replayer does, so Claude and the
   *  replayer agree on what a selector means. */
  const loc = (selector: string) => page.locator(selector).first();

  /** MCP tool handlers return content blocks; every tool here returns text. */
  const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

  // ── The browser tools, published over MCP ────────────────────────────────
  const mcp = new McpServer(
    { name: 'replay-browser', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  mcp.registerTool(
    'inspect',
    {
      description:
        'Return the HTML of the first element matching a CSS selector, so you can see its real ' +
        'structure and attributes. Use this before guessing at selectors.',
      inputSchema: { selector: z.string().describe('A CSS selector.') },
    },
    async ({ selector }) => {
      log(`inspect ${selector}`);
      const html = await loc(selector)
        .evaluate((el) => el.outerHTML)
        .catch((e) => `(error: ${e.message})`);
      return text(truncate(html));
    }
  );

  mcp.registerTool(
    'find',
    {
      description:
        'Find candidate elements by visible text, aria-label, or role. Returns each match with its ' +
        'tag, id, key attributes and whether it is visible. Use this to locate a control when the ' +
        'recorded selector no longer matches.',
      inputSchema: {
        text: z.string().describe('Text or label to search for (case-insensitive).'),
      },
    },
    async ({ text: needleText }) => {
      log(`find "${needleText}"`);
      const found = await page
        .evaluate((needle: string) => {
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
        }, needleText)
        .catch((e) => [`(error: ${e.message})`]);
      return text(found.length ? found.join('\n') : `no elements matched "${needleText}"`);
    }
  );

  mcp.registerTool(
    'type_into',
    {
      description:
        'Focus an input and type a value using real keystrokes. Use this for search/autosuggest ' +
        'fields whose option list is only fetched once you type. Returns what the field holds afterwards.',
      inputSchema: { selector: z.string(), value: z.string() },
    },
    async ({ selector, value }) => {
      log(`type_into ${selector} = "${value}"`);
      try {
        const el = loc(selector);
        await el.click({ timeout: 15_000 });
        await el.clear();
        await el.pressSequentially(value, { timeout: 20_000 });
        await page.waitForTimeout(1_200);
        const now = await el.inputValue().catch(() => '(not an input)');
        record({ action: 'fill', type: 'fill', locator: { selector: pinToFirst(selector) }, value });
        return text(`typed. field now reads "${now}"`);
      } catch (e: any) {
        return text(`failed: ${e.message}`);
      }
    }
  );

  mcp.registerTool(
    'click',
    {
      description: 'Click the first element matching a CSS selector.',
      inputSchema: { selector: z.string() },
    },
    async ({ selector }) => {
      log(`click ${selector}`);
      try {
        await loc(selector).click({ timeout: 20_000 });
        await page.waitForTimeout(1_200);
        record({ action: 'click', type: 'click', locator: { selector: pinToFirst(selector) } });
        return text('clicked');
      } catch (e: any) {
        return text(`failed: ${e.message}`);
      }
    }
  );

  mcp.registerTool(
    'press',
    {
      description:
        'Press a keyboard key (e.g. "Tab", "Enter", "ArrowDown"). Many fields ' +
        'commit their value on Tab or Enter.',
      inputSchema: { key: z.string() },
    },
    async ({ key }) => {
      log(`press ${key}`);
      await page.keyboard.press(key);
      await page.waitForTimeout(1_000);
      record({ action: 'press', type: 'press', key });
      return text(`pressed ${key}`);
    }
  );

  mcp.registerTool(
    'read_value',
    {
      description:
        'Read back what an element currently holds (input value, else text). Use this to VERIFY ' +
        'your fix actually took effect before calling done.',
      inputSchema: { selector: z.string() },
    },
    async ({ selector }) => {
      log(`read_value ${selector}`);
      const el = loc(selector);
      let v = await el.inputValue().catch(() => null);
      if (v === null || v === '') v = (await el.textContent().catch(() => '')) ?? '';
      return text(`"${String(v).trim()}"`);
    }
  );

  mcp.registerTool(
    'done',
    {
      description:
        'Hand control back to the replayer. Call this only after you have verified the outcome ' +
        'with read_value, or when you are certain you cannot complete the step.',
      inputSchema: {
        success: z.boolean().describe('True only if you VERIFIED the step is now complete.'),
        explanation: z.string().describe('What was wrong and what you did, in one or two sentences.'),
      },
    },
    async ({ success, explanation }) => {
      verdict = { success, explanation };
      log(`done success=${success}: ${explanation}`);
      return text('control returned to the replayer');
    }
  );

  console.log(
    `\n[AI:cli] ── recovery starting for step ${ctx.index + 1}: ${ctx.description} ` +
    `(max ${maxIterations} iterations) ──`
  );

  let http: Server | null = null;
  let transport: StreamableHTTPServerTransport | null = null;
  let mcpConfigPath: string | null = null;
  let sessionId: string | undefined = resumeSessionId;

  const fail = (msg: string): RecoveryResult => {
    log(`recovery error: ${msg}`);
    return {
      attempted: true,
      recovered: false,
      summary: `AI recovery errored: ${msg}`,
      actions,
      healSteps: [],
      model,
      usage,
      durationMs: Date.now() - startedAt,
      apiError: msg,
      method: 'cli',
      sessionId,
    };
  };

  try {
    // ── Serve the tools on an ephemeral localhost port ────────────────────
    // Stateful (a sessionIdGenerator is supplied) because a stateless
    // transport throws "cannot be reused across requests" on the second call —
    // and one recovery is many calls. Bound to 127.0.0.1 so nothing off-box
    // can drive the browser.
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
    });
    await mcp.connect(transport);

    http = createServer((req, res) => {
      transport!.handleRequest(req, res).catch(() => {
        if (!res.headersSent) res.writeHead(500).end();
      });
    });

    const port = await new Promise<number>((resolve, reject) => {
      http!.once('error', reject);
      http!.listen(0, '127.0.0.1', () => resolve((http!.address() as AddressInfo).port));
    });

    // Written to a file rather than passed inline: it is JSON with quotes and
    // braces, and on Windows it would have to survive a shell round-trip.
    mcpConfigPath = join(
      tmpdir(),
      `replay-mcp-${process.pid}-${ctx.index}-${startedAt}.json`
    );
    await writeFile(
      mcpConfigPath,
      JSON.stringify({
        mcpServers: {
          replay: { type: 'http', url: `http://127.0.0.1:${port}/mcp` },
        },
      }),
      'utf8'
    );

    const toolNames = ['find', 'inspect', 'type_into', 'click', 'press', 'read_value', 'done']
      .map((t) => `mcp__replay__${t}`);

    // ── Run the CLI ────────────────────────────────────────────────────────
    const exitInfo = await runClaude({
      prompt: recoveryUserPrompt(ctx, page.url()),
      systemPrompt: recoverySystemPrompt(opts.recoveryHints, opts.productName),
      model,
      timeoutMs,
      mcpConfigPath,
      allowedTools: toolNames,
      resumeSessionId,
      // The CLI counts a turn per tool call, whereas the API tool-runner loop
      // counts model round-trips — the same budget therefore cuts a recovery
      // off far earlier here. Scale up so a run gets room to inspect, act and
      // verify, which is several turns per attempt.
      maxTurns: maxIterations * 4,
    });

    sessionId = exitInfo.sessionId || resumeSessionId;
    usage.input_tokens = exitInfo.usage.input_tokens;
    usage.output_tokens = exitInfo.usage.output_tokens;
    usage.cache_read_input_tokens = exitInfo.usage.cache_read_input_tokens;
    usage.cache_creation_input_tokens = exitInfo.usage.cache_creation_input_tokens;

    // No verdict AND no tool calls means the CLI never got going — most often
    // "not logged in", which it reports on stdout with exit code 0. Report it
    // as apiError so the dispatcher can recognise it as an infra failure (and
    // fall back to the API key, if one is configured) rather than an
    // unfixable recording. If tools did run, the run was real: fall through
    // and let the no-verdict branch below describe it.
    if (!verdict && actions.length === 0) {
      return fail(
        `claude CLI produced no tool calls (exit ${exitInfo.exitCode}): ` +
        `${exitInfo.diagnostics.slice(0, 500) || '(no output)'}`
      );
    }
  } catch (e: any) {
    // A recovery failure must never be worse than the original failure.
    return fail(e.message);
  } finally {
    await mcp.close().catch(() => {});
    await new Promise<void>((r) => (http ? http.close(() => r()) : r()));
    if (mcpConfigPath) await unlink(mcpConfigPath).catch(() => {});
  }

  if (!verdict) {
    return {
      attempted: true,
      recovered: false,
      summary: `AI recovery stopped after ${actions.length} action(s) without reporting a verdict`,
      actions,
      healSteps: [],
      model,
      usage,
      durationMs: Date.now() - startedAt,
      method: 'cli',
      sessionId,
    };
  }

  const recovered = (verdict as { success: boolean }).success;

  return {
    attempted: true,
    recovered,
    summary: (verdict as { explanation: string }).explanation,
    actions,
    // Only a verified recovery is worth storing. A failed attempt's steps would
    // be replayed forever otherwise.
    healSteps: recovered ? healSteps : [],
    model,
    usage,
    durationMs: Date.now() - startedAt,
    method: 'cli',
    sessionId,
  };
}
