/**
 * Frame resolution.
 *
 * Oracle ADF renders dialogs, embedded regions and whole subtabs inside
 * iframes, so "was this step recorded in the top document?" is a routine
 * question rather than an exotic one. The engine used to answer it by REFUSING
 * the whole recording, which made a large share of real recordings unreplayable.
 *
 * The rule this module exists to hold, and the reason it throws rather than
 * degrades: a step whose frame cannot be found must NOT fall back to the top
 * frame. The top frame usually contains a control that answers to the same
 * accessible name — the row behind the dialog, the field behind the popup — so
 * the fallback would click the WRONG element, succeed, and report green. A loud
 * "frame not found" is the only honest outcome.
 *
 * What it deliberately does not do: nested frames (`framePath`) and second
 * pages (`pageAlias`). Those are still refused up front in `normalize.ts`. A
 * second page is a different problem — the runner owns exactly one `page` — and
 * conflating the two here would mean silently replaying against the wrong one.
 *
 * KNOWN LIMIT, stated rather than left to be discovered: this scopes LOCATOR
 * RESOLUTION only. The AppPatch hooks that survey the whole document —
 * countListSurfaces, pickListRow, selectFromOpenList, dismissOpenList,
 * collectCommitErrors, scanForOutputs — still run against the top page, because
 * they need `page.evaluate` and a FrameLocator has no evaluate. In practice that
 * is the right frame anyway: ADF paints its LOV popups and its Confirmation
 * dialogs in the TOP document even when the field that opened them is in an
 * iframe. Where it is not, a lovSelect inside a frame will find its field and
 * then fail to prove the pick — which is the safe direction to be wrong in.
 */

import type { FrameLocator, Page } from '@playwright/test';
import type { LocatorScope, LogFn, NormalizedAction, RecordedFrame } from './types';
import { ABSENCE } from './timeouts';

/**
 * How long to wait for a frame to appear.
 *
 * An ADF dialog's iframe is created by the click that opened it and is not in
 * the DOM the instant the next step starts, so a single-shot lookup would fail
 * steps that are merely early. This is the speculative budget, not the full
 * visible budget: a genuinely missing frame should fail fast enough to leave
 * time for the report rather than burn the step's whole allowance.
 */
const FRAME_TIMEOUT = ABSENCE.visibleShort;
const POLL_MS = 200;

/** Every iframe/frame in the top document, in DOM order. */
interface FrameElementInfo {
  name: string;
  id: string;
  title: string;
  /** Absolute — read from the `src` PROPERTY, which the browser resolves. */
  src: string;
}

// A string expression rather than an arrow function, matching how the painted
// predicate in locators.ts is shipped: it keeps the DOM lib out of this file's
// compile surface and the body out of Playwright's function serialisation.
const LIST_FRAME_ELEMENTS = `Array.from(document.querySelectorAll('iframe, frame')).map((el) => ({
  name: el.getAttribute('name') || '',
  id: el.getAttribute('id') || '',
  title: el.getAttribute('title') || '',
  src: el.src || '',
}))`;

const eq = (a: string, b: string) => !!a && !!b && a === b;
const eqi = (a: string, b: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

/**
 * Is this recorded frame just the top document?
 *
 * The recorder is documented to emit `frame` only for steps captured OUTSIDE
 * the top frame, but recordings in the wild are not that disciplined — a frame
 * block naming the page's own URL and no iframe is the top frame, and routing
 * it through frameLocator would fail a step that is perfectly fine.
 */
export function isTopFrame(page: Page, frame?: RecordedFrame): boolean {
  if (!frame) return true;
  if (frame.name) return false;
  if (!frame.url) return true; // nothing to address a frame BY
  return sameDocument(frame.url, page.url());
}

/**
 * Compare two frame URLs.
 *
 * Not string equality: a recording is replayed against a different environment
 * (a test pod, a different Oracle POD id) and after a different session, so the
 * host and every session/token query parameter differ from what was recorded.
 * The path is the part that identifies WHICH region this is.
 */
export function sameDocument(recorded: string, live: string): boolean {
  if (eq(recorded, live)) return true;
  let a: URL, b: URL;
  try {
    a = new URL(recorded);
    b = new URL(live);
  } catch {
    return false;
  }
  if (a.pathname === b.pathname) return true;
  // Last resort: the same region mounted under a different context root.
  const tail = (p: string) => p.split('/').filter(Boolean).slice(-2).join('/');
  return !!tail(a.pathname) && tail(a.pathname) === tail(b.pathname);
}

/**
 * Index of the iframe element matching `want`, or -1.
 *
 * Ordered by how specifically each attribute identifies a frame. `name` is what
 * the recorder writes, but it fills it from name, then title, then id depending
 * on what the element carried — so all three are checked against it, exact
 * before case-insensitive so a page carrying both `Main` and `main` picks the
 * one that was actually recorded.
 */
function matchFrame(els: FrameElementInfo[], want: RecordedFrame): number {
  if (want.name) {
    const n = want.name;
    const tests: Array<(e: FrameElementInfo) => boolean> = [
      (e) => eq(e.name, n),
      (e) => eq(e.id, n),
      (e) => eq(e.title, n),
      (e) => eqi(e.name, n),
      (e) => eqi(e.id, n),
      (e) => eqi(e.title, n),
    ];
    for (const t of tests) {
      const i = els.findIndex(t);
      if (i >= 0) return i;
    }
    // A name was recorded and nothing carries it. Do NOT quietly widen to a URL
    // match: the name is the more specific claim, and honouring the weaker one
    // is how the wrong frame gets chosen.
    return -1;
  }

  if (want.url) {
    const u = want.url;
    const i = els.findIndex((e) => eq(e.src, u));
    if (i >= 0) return i;
    return els.findIndex((e) => sameDocument(u, e.src));
  }

  return -1;
}

/** What the page actually had, for an error message that can be acted on. */
function describeAvailable(els: FrameElementInfo[]): string {
  if (!els.length) return 'the page has no iframes at all';
  return `the page has ${els.length} frame(s): ` +
    els
      .slice(0, 6)
      .map((e) => `{name:${JSON.stringify(e.name)}, id:${JSON.stringify(e.id)}, title:${JSON.stringify(e.title)}, src:${JSON.stringify(e.src.slice(0, 80))}}`)
      .join(', ') +
    (els.length > 6 ? `, and ${els.length - 6} more` : '');
}

const describeWanted = (f: RecordedFrame) =>
  f.name ? `named "${f.name}"` : `at URL "${String(f.url).slice(0, 120)}"`;

/**
 * The scope a step's locators must be built against.
 *
 * Returns the `page` itself for a top-frame step — the overwhelming majority,
 * which must pay nothing for this — and a `FrameLocator` otherwise.
 *
 * Throws, naming the frame and listing what the page really had, when the frame
 * is not there. See the module header for why this is not a fallback.
 */
export async function resolveScope(
  page: Page,
  action: NormalizedAction,
  log: LogFn = () => {},
): Promise<LocatorScope> {
  const want = action.frame;
  if (isTopFrame(page, want)) return page;

  const deadline = Date.now() + FRAME_TIMEOUT;
  let els: FrameElementInfo[] = [];

  for (;;) {
    els = (await page
      .evaluate(LIST_FRAME_ELEMENTS)
      .catch(() => [])) as FrameElementInfo[];

    const idx = matchFrame(els, want!);
    if (idx >= 0) {
      log(`frame ${describeWanted(want!)} resolved to iframe #${idx + 1} of ${els.length}`);
      // Addressed BY INDEX rather than by a `[name="…"]` selector on purpose.
      // FrameLocator is strict — a selector matching two iframes throws at use
      // time, one step later and with a message about the control rather than
      // about the frame. An index resolves to exactly one element, and it is
      // still re-queried lazily on every use, so a re-rendered frame is picked
      // up rather than held stale.
      return page.locator('iframe, frame').nth(idx).contentFrame() as FrameLocator;
    }

    if (Date.now() >= deadline) break;
    await page.waitForTimeout(POLL_MS);
  }

  throw new Error(
    `Frame not found: this step was recorded inside the frame ${describeWanted(want!)}, ` +
    `which is not on the page after ${Math.round(FRAME_TIMEOUT / 1000)}s — ${describeAvailable(els)}. ` +
    `Refusing to replay it against the top frame, which commonly holds a control with the ` +
    `same name and would act on the wrong element while reporting success.`,
  );
}
