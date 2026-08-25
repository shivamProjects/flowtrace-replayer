/**
 * claude-cli.js — run Claude through the `claude` CLI, billed against the
 * user's Pro/Max subscription rather than an API key.
 *
 * Node builtins only, no npm dependencies — it can be lifted into another
 * project as-is, and cannot break through a version bump of something it does
 * not use.
 *
 * ── what it does ─────────────────────────────────────────────────────────────
 * Spawns `claude -p` with `--output-format stream-json`, feeds the prompt on
 * STDIN, and reads back the assistant's final text plus the run's token usage.
 * Optionally points the CLI at an MCP server so the model can call tools that
 * execute in the CALLING process — that is how the replayer hands Claude a live
 * Playwright page it could not otherwise reach.
 *
 * ── why a subprocess at all ──────────────────────────────────────────────────
 * Subscription credentials live in the CLI's own auth store (OAuth / keychain).
 * There is no way to present them over the HTTP API, so the only way to bill a
 * Pro/Max plan is to let the CLI make the call.
 *
 * ── things that were learned the hard way ────────────────────────────────────
 * · The prompt goes on STDIN, never argv. It is multi-line and full of quotes
 *   and URLs, and on Windows `claude` is a .cmd shim spawned through a shell,
 *   which re-splits argv and mangles it.
 * · ANTHROPIC_API_KEY is DELETED from the child env, not set to undefined —
 *   spawn forwards an undefined value as the literal string "undefined" on some
 *   platforms, which reads as a malformed key. Leaving a real key in place is
 *   worse: it bills the key and silently defeats the entire point of this file.
 * · CLAUDE_CODE_SIMPLE / --bare must NOT be set. They restrict auth to
 *   ANTHROPIC_API_KEY and never read OAuth or the keychain, so the CLI reports
 *   "Not logged in" and exits without running.
 * · Auth and startup failures ("Not logged in · Please run /login") print as
 *   PLAIN TEXT on stdout, not stderr, and can come with exit code 0. Non-JSON
 *   stdout lines are therefore collected as diagnostics or they vanish.
 */

'use strict';

const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');

/** `claude` is a shell shim on Windows, so it needs a shell to resolve. */
const CLI_BIN = process.env.AI_RECOVERY_CLI_PATH || process.env.CLAUDE_CLI_PATH || 'claude';

/**
 * Alias rather than a pinned model id: the CLI resolves 'opus' / 'sonnet' to
 * whatever the plan currently entitles, which is what a subscription run should
 * follow. A full model id works too.
 */
const DEFAULT_MODEL = 'sonnet';

const DEFAULT_TIMEOUT_MS = 300000;

function zeroUsage() {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };
}

/**
 * Run one Claude prompt through the CLI.
 *
 * @param {object}   opts
 * @param {string}   opts.prompt           the user prompt (required)
 * @param {string}  [opts.systemPrompt]    prepended to the prompt, see below
 * @param {string}  [opts.model]           alias or model id
 * @param {number}  [opts.timeoutMs]       hard ceiling on the whole run
 * @param {string}  [opts.mcpConfigPath]   path to an MCP config JSON file
 * @param {string[]}[opts.allowedTools]    e.g. ['mcp__replay__click']
 * @param {string[]}[opts.disallowedTools] defaults to the filesystem/shell set
 * @param {number}  [opts.maxTurns]        CLI turn budget
 * @param {function}[opts.onEvent]         called with each parsed stream-json event
 *
 * @returns {Promise<{text, usage, model, durationMs, exitCode, diagnostics, isError}>}
 *
 * Never rejects on a *Claude* failure — a non-zero exit, a refusal or an auth
 * error come back as `isError` with `diagnostics` explaining why, because the
 * callers all need to distinguish "Claude ran and could not do it" from "Claude
 * never ran". It DOES reject when the process could not be started or timed
 * out, which are not answers at all.
 */
function runClaude(opts) {
  const {
    prompt,
    systemPrompt = '',
    model = process.env.CLAUDE_CLI_MODEL || DEFAULT_MODEL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    mcpConfigPath = null,
    allowedTools = null,
    disallowedTools = ['Bash', 'Edit', 'Write', 'Read', 'WebFetch', 'WebSearch', 'Task'],
    maxTurns = null,
    onEvent = null,
    // Resumes an earlier session by id (claude's own session store is
    // file-backed under ~/.claude/, so this works across separate process
    // invocations, not just within one). Verified live: a resumed session
    // combined with a BRAND NEW --mcp-config still connects correctly and
    // the model retains context from the earlier call.
    resumeSessionId = null,
  } = opts || {};

  if (!prompt) return Promise.reject(new Error('runClaude: prompt is required'));

  const startedAt = Date.now();
  const usage = zeroUsage();

  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose', // stream-json requires it
    '--model', model,
  ];

  if (resumeSessionId) {
    args.push('--resume', resumeSessionId);
  }

  if (mcpConfigPath) {
    args.push('--mcp-config', mcpConfigPath);
    // Ignore whatever MCP servers the operator has configured for their own
    // use — this run must see only the tools it was given.
    args.push('--strict-mcp-config');
  }
  if (allowedTools && allowedTools.length) {
    args.push('--allowedTools', allowedTools.join(','));
  }
  if (disallowedTools && disallowedTools.length) {
    args.push('--disallowedTools', disallowedTools.join(','));
  }
  if (mcpConfigPath) {
    // Only meaningful when tools are in play, and only safe because the tool
    // list above is an explicit allowlist.
    args.push('--permission-mode', 'bypassPermissions');
  }
  if (maxTurns) args.push('--max-turns', String(maxTurns));

  return new Promise((resolve, reject) => {
    const childEnv = { ...process.env, MCP_TIMEOUT: '30000' };
    delete childEnv.ANTHROPIC_API_KEY;
    delete childEnv.ANTHROPIC_AUTH_TOKEN;
    delete childEnv.CLAUDE_API_KEY;

    let child;
    try {
      child = spawn(CLI_BIN, args, {
        // `claude` is a .cmd shim on Windows; without a shell, spawn ENOENTs.
        shell: process.platform === 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: childEnv,
      });
    } catch (e) {
      return reject(new Error(`could not start "${CLI_BIN}": ${e.message}`));
    }

    // The system prompt is prepended rather than passed as --system-prompt, for
    // the same argv-mangling reason the user prompt is. Closing stdin is what
    // tells `-p` the prompt is complete.
    child.stdin.on('error', () => {}); // EPIPE if the CLI dies early
    child.stdin.end(systemPrompt ? `${systemPrompt}\n\n---\n\n${prompt}\n` : `${prompt}\n`);

    let diagnostics = '';
    let text = '';
    let isError = false;
    let resolvedModel = model;
    let sessionId = resumeSessionId || null;
    let settled = false;

    let timedOut = false;

    /**
     * Kill the CLI and everything it spawned.
     *
     * On Windows `shell: true` means the direct child is the `cmd.exe` shim,
     * not `claude` itself — signalling it leaves the real process running,
     * still holding MCP tool calls open against the caller's browser. taskkill
     * `/T` walks the process tree; `/F` makes it unconditional. Elsewhere
     * SIGKILL on the child is enough.
     */
    const killTree = () => {
      if (process.platform === 'win32' && child.pid !== undefined) {
        // taskkill is asynchronous. Signalling the shim ourselves as well races
        // it — the signal tears down cmd.exe's stdio while taskkill is still
        // walking the tree, and the `close` event then does not arrive, which
        // is exactly the hang the grace timer had to paper over. Let taskkill
        // own the kill, and only fall back to a signal if it could not run.
        try {
          const tk = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
          tk.on('error', () => { try { child.kill('SIGKILL'); } catch (_) {} });
          return;
        } catch (_) { /* fall through to the signal below */ }
      }
      try { child.kill('SIGKILL'); } catch (_) {}
    };

    const timer = setTimeout(() => {
      if (settled) return;
      // Rejecting here would hand control back while the CLI is still alive and
      // mid-tool-call, letting the caller tear down its MCP server underneath a
      // running process. Mark the run, kill the tree, and let the normal `close`
      // handler settle once the process is actually gone.
      timedOut = true;
      killTree();
      // A killed process normally closes within milliseconds. If it does not —
      // a wedged shim, a taskkill that failed — settle anyway rather than hang
      // in the very place the timeout exists to prevent.
      const grace = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`claude CLI timed out after ${timeoutMs}ms and did not exit when killed`));
      }, 10000);
      if (grace.unref) grace.unref();
    }, timeoutMs);

    createInterface({ input: child.stdout }).on('line', (line) => {
      const t = line.trim();
      if (!t) return;

      if (!t.startsWith('{')) {
        diagnostics += `\n${t}`;
        return;
      }

      let ev;
      try {
        ev = JSON.parse(t);
      } catch (_) {
        return;
      }

      if (onEvent) {
        try { onEvent(ev); } catch (_) {}
      }

      // Every event carries session_id once the session exists (verified
      // live across 'system'/'assistant'/'result' events) — capture it off
      // whichever arrives first so a fresh (non-resumed) run's id is known
      // for a LATER call to resume, even if this call never reaches 'result'.
      if (!sessionId && typeof ev.session_id === 'string') {
        sessionId = ev.session_id;
      }

      if (ev.type === 'result') {
        // The CLI reports cumulative totals for the whole session here, rather
        // than per-request usage, so these are read straight off this event
        // instead of being summed per iteration.
        const u = ev.usage || (ev.message && ev.message.usage);
        if (u) {
          usage.input_tokens = u.input_tokens || 0;
          usage.output_tokens = u.output_tokens || 0;
          usage.cache_read_input_tokens = u.cache_read_input_tokens || 0;
          usage.cache_creation_input_tokens = u.cache_creation_input_tokens || 0;
        }
        if (ev.is_error) {
          isError = true;
          if (ev.result) diagnostics += `\n${ev.result}`;
        } else if (typeof ev.result === 'string') {
          text = ev.result;
        }
      }

      // The final assistant turn, for runs where `result` carries no text.
      if (ev.type === 'assistant' && ev.message) {
        if (ev.message.model) resolvedModel = ev.message.model;
        if (!text && Array.isArray(ev.message.content)) {
          const blocks = ev.message.content
            .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
            .map((b) => b.text);
          if (blocks.length) text = blocks.join('');
        }
      }
    });

    child.stderr.on('data', (c) => { diagnostics += c.toString(); });

    child.on('error', (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`could not start "${CLI_BIN}": ${e.message}`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`claude CLI timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({
        text,
        usage,
        model: resolvedModel,
        durationMs: Date.now() - startedAt,
        exitCode: code,
        diagnostics: diagnostics.trim(),
        sessionId,
        // Exit code 0 is not proof of success: an auth failure prints to stdout
        // and exits clean, which is why `diagnostics` with no text counts too.
        isError: isError || code !== 0 || !text,
      });
    });
  });
}

/**
 * Compact a resumed session's context before the next real recovery prompt.
 *
 * Verified live: sending the literal text "/compact" as the prompt on a
 * `--resume <id>` call triggers real, non-interactive compaction — the
 * stream carries a `compact_boundary` system event with pre/post token
 * counts, and a summary message that correctly preserved test context
 * ("The secret code word is BANANA77.") across the boundary. No MCP config
 * needed for this call; it does nothing but ask the CLI to summarize.
 *
 * Resolves once compaction finishes; does not return usage/text since
 * nothing here is billed as a real recovery attempt.
 */
async function runClaudeCompact(sessionId, timeoutMs) {
  if (!sessionId) throw new Error('runClaudeCompact: sessionId is required');
  const result = await runClaude({
    prompt: '/compact',
    resumeSessionId: sessionId,
    timeoutMs: timeoutMs || DEFAULT_TIMEOUT_MS,
    disallowedTools: [], // nothing here should touch tools at all
  });
  if (result.isError) {
    throw new Error(`compaction failed: ${result.diagnostics.slice(0, 300) || '(no output)'}`);
  }
}

module.exports = { runClaude, runClaudeCompact, zeroUsage, CLI_BIN, DEFAULT_MODEL };
