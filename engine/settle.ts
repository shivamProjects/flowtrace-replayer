/**
 * Adaptive settling — waiting for the page to actually be done, not for a clock.
 *
 * The engine used to pay fixed sleeps: 700ms per step watching for an ADF
 * partial-page refresh to *start*, 500ms for an autosuggest debounce, 400ms
 * generically. Those are worst-case guesses charged to every step regardless of
 * what happened, so a 40-step script burned roughly half a minute doing nothing
 * — and, worse, they are still only guesses: a slow round trip outlasts them
 * and the step proceeds against a page that has not finished changing.
 *
 * Instead, ask the page. A probe installed before navigation tracks two signals:
 *
 *   pending  — in-flight fetch/XHR, by wrapping both APIs
 *   quiet    — milliseconds since the last DOM mutation, via MutationObserver
 *
 * "Settled" is: nothing in flight, and the DOM has stopped changing for a short
 * quiet window. A step that finishes in 80ms returns in 80ms; one that triggers
 * a three-second ADF round trip waits exactly that long. The cap is a backstop
 * for a page that never goes quiet (a spinner animating forever), not the
 * expected cost.
 */

import type { Page } from '@playwright/test';
import { PATIENCE, QUIET } from './timeouts';

export interface SettleOptions {
  /** How long the DOM must be still before the page counts as settled. */
  quietMs?: number;
  /** Backstop. Reaching it is not an error — the caller carries on. */
  maxMs?: number;
  /** How often to ask the page. */
  pollMs?: number;
}

const PROBE_KEY = '__replaySettleProbe';

/**
 * Installed via addInitScript so it survives every navigation, including the
 * SPA-style ones ADF does without a document load.
 */
const PROBE_SOURCE = `(() => {
  if (window.${PROBE_KEY}) return;
  const state = { pending: 0, lastMutation: Date.now() };
  window.${PROBE_KEY} = state;

  // Requests are TIMESTAMPED, not merely counted.
  //
  // A counter only goes down when a request settles, so one that never settles
  // — an ADF long-poll, a notification channel, a connection the load balancer
  // holds open — pinned the counter above zero for the life of the document.
  // Every settle after that burned its full cap: measured at 30,021ms per wait,
  // three waits per fill, which then blew the step budget and marked every
  // remaining step skipped, with a message blaming the page.
  let seq = 0;
  const inflight = new Map();
  const MAX_INFLIGHT_MS = 20000;
  state.sweep = () => {
    const now = Date.now();
    for (const [id, at] of inflight) if (now - at > MAX_INFLIGHT_MS) inflight.delete(id);
    state.pending = inflight.size;
  };
  const start = () => { const id = ++seq; inflight.set(id, Date.now()); state.pending = inflight.size; return id; };
  const done = (id) => { inflight.delete(id); state.pending = inflight.size; };

  const origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (...args) {
      const id = start();
      let p;
      try { p = origFetch.apply(this, args); } catch (e) { done(id); throw e; }
      return p.then(
        (r) => { done(id); return r; },
        (e) => { done(id); throw e; },
      );
    };
  }

  const XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype && XHR.prototype.send) {
    const origSend = XHR.prototype.send;
    XHR.prototype.send = function (...args) {
      const id = start();
      let settled = false;
      const settle = () => { if (!settled) { settled = true; done(id); } };
      this.addEventListener('loadend', settle);
      // loadend does not fire if the request is discarded mid-flight.
      this.addEventListener('abort', settle);
      this.addEventListener('error', settle);
      try {
        return origSend.apply(this, args);
      } catch (e) {
        settle();
        throw e;
      }
    };
  }

  const observe = () => {
    const target = document.documentElement || document.body;
    if (!target) { setTimeout(observe, 10); return; }
    try {
      new MutationObserver(() => { state.lastMutation = Date.now(); }).observe(target, {
        subtree: true, childList: true, attributes: true, characterData: true,
      });
    } catch (_) { /* nothing to observe yet */ }
  };
  observe();
})();`;

/** Install once, before the first navigation. */
export async function installSettleProbe(page: Page): Promise<void> {
  await page.addInitScript(PROBE_SOURCE).catch(() => {});
  // The page may already be open (the runner installs after the fixture is
  // created), so seed the current document too.
  await page.evaluate(PROBE_SOURCE).catch(() => {});
}

export interface SettleResult {
  settled: boolean;
  waitedMs: number;
  /** Why it stopped waiting — useful when a step is unexpectedly slow. */
  reason: 'quiet' | 'cap' | 'no-probe' | 'navigating';
  /** Present on 'cap': the evidence that distinguishes the two causes. */
  detail?: string;
}

/**
 * Return as soon as the page is quiet, or when `maxMs` is spent.
 *
 * Never throws: a page mid-navigation makes `evaluate` fail, which is itself
 * evidence that something is happening, and the caller's own actionability
 * waits cover what follows.
 */
export async function waitForQuiet(page: Page, opts: SettleOptions = {}): Promise<SettleResult> {
  const quietMs = opts.quietMs ?? QUIET.general;
  const maxMs = opts.maxMs ?? PATIENCE.settle;
  const pollMs = opts.pollMs ?? 40;
  const started = Date.now();
  const deadline = started + maxMs;

  // Give a navigation triggered by the just-performed action a moment to be
  // observable; without this the first probe can read the OLD document as quiet.
  let sawActivity = false;

  while (Date.now() < deadline) {
    const snapshot = await page
      .evaluate((key) => {
        const s = (window as any)[key];
        if (!s) return null;
        s.sweep?.(); // drop requests that will never settle
        return { pending: s.pending as number, since: Date.now() - (s.lastMutation as number) };
      }, PROBE_KEY)
      .catch(() => undefined);

    if (snapshot === undefined) {
      // Execution context destroyed — a real navigation is in progress.
      sawActivity = true;
      await page.waitForTimeout(pollMs);
      continue;
    }
    if (snapshot === null) {
      // Not "the page is quiet" — "we cannot tell". Returning settled:true in
      // silence degraded adaptive waiting to no waiting at all on any page the
      // probe never reached, and looked exactly like a fast page in the log.
      return { settled: true, waitedMs: Date.now() - started, reason: 'no-probe' };
    }

    if (snapshot.pending > 0 || snapshot.since < quietMs) {
      sawActivity = true;
      await page.waitForTimeout(pollMs);
      continue;
    }

    return { settled: true, waitedMs: Date.now() - started, reason: 'quiet' };
  }

  // Say WHY the cap was hit. `cap` alone cannot distinguish a stuck request from
  // a DOM that never stops changing, and those have opposite remedies.
  const last = await page
    .evaluate((key) => {
      const s = (window as any)[key];
      return s ? { pending: s.pending as number, since: Date.now() - (s.lastMutation as number) } : null;
    }, PROBE_KEY)
    .catch(() => null);
  return {
    settled: false,
    waitedMs: Date.now() - started,
    reason: 'cap',
    detail: last ? `pending=${last.pending}, last DOM change ${last.since}ms ago` : 'probe unreachable',
  };
}

/**
 * Wait for a condition, checking as fast as it is cheap to do so.
 *
 * The point of having this rather than a bare `waitForTimeout` is that a
 * condition met in 120ms costs 120ms. Returns whether it was met.
 */
export async function waitUntil(
  page: Page,
  probe: () => Promise<boolean>,
  { maxMs = 10_000, pollMs = 50 }: { maxMs?: number; pollMs?: number } = {},
): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  for (;;) {
    if (await probe().catch(() => false)) return true;
    if (Date.now() >= deadline) return false;
    await page.waitForTimeout(pollMs);
  }
}

/**
 * Wait until the page has actually rendered something.
 *
 * `waitForLoadState` reports on the document that is current WHEN IT IS CALLED.
 * A click that starts a navigation therefore satisfies both 'domcontentloaded'
 * and 'networkidle' against the outgoing document — or against the new one
 * before Oracle has painted a pixel — and the step moves on while the viewport
 * is still white.
 *
 * Polling for content handles both cases without having to detect whether a
 * navigation happened at all. A page that has already painted passes the first
 * check, so a click that navigates nowhere pays nothing for this.
 */
export async function waitForPaint(page: Page, timeout = 15000): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    // evaluate() throws while a navigation is committing ("execution context was
    // destroyed") — that is itself a sign the page is mid-flight, so treat it as
    // not-yet-painted and look again.
    const painted = await page
      .evaluate(() => {
        if (document.readyState === 'loading') return false;
        const body = document.body;
        if (!body) return false;
        const box = body.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) return false;
        return (
          (body.innerText || '').trim().length > 0 ||
          document.querySelectorAll('img, svg, canvas, input, button').length > 0
        );
      })
      .catch(() => false);

    if (painted) return true;
    await page.waitForTimeout(250);
  }

  return false;
}

