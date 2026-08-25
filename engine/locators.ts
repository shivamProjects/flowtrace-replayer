/**
 * Selector parsing and element resolution.
 *
 * Two rules carry almost all of the reliability here:
 *
 *   1. Resolve to a VISIBLE element. ADF and JET pre-render closed popups and
 *      dropdown contents into the page, so a locator that merely *exists* is
 *      routinely a node nobody could click. `filter({ visible: true })` before
 *      `.first()` is the difference between clicking the control and clicking
 *      its hidden pre-render — a bare `.first()` takes DOM order, which is the
 *      hidden copy.
 *
 *   2. Try an EXACT accessible-name match before a fuzzy one. Playwright's
 *      default name match is a case-insensitive substring, so a recorded "Save"
 *      also matches "Save and Close" and "Save and Create Next" — and on the
 *      Oracle toolbar those come first in DOM order.
 */

import type { Locator, Page } from '@playwright/test';
import type { AppPatch, LocatorScope, LogFn, NormalizedAction } from './types';
import { ABSENCE } from './timeouts';
import { resolveScope } from './frames';

export const escapeRegExp = (s: string) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cssEscapeValue = (v: string) => String(v).replace(/["\\]/g, '\\$&');
const unescape = (s: string) => s.replace(/\\(.)/g, '$1');
const ci = (s: string) => new RegExp(escapeRegExp(s), 'i');

/** How long to wait for an element that is not on screen yet. */
export const VISIBLE_TIMEOUT = ABSENCE.visible;

/**
 * Is this element the one a person could actually act on?
 *
 * `filter({ visible: true })` is NOT enough, which is worth stating plainly
 * because it is the assumption this engine used to be built on. Measured
 * against a page carrying four "Save" buttons — one at `left:-9999px`, one in a
 * `height:0;overflow:hidden` wrapper, one under `opacity:0`, and the real one —
 * `getByRole('button', { name: 'Save', exact: true })` matched all four, and
 * `.filter({ visible: true })` removed NONE of them. Playwright's `visible`
 * only means "has a box and is not `visibility:hidden`", so an off-canvas or
 * fully transparent node sails through, and `.first()` takes DOM order, which
 * on a pre-rendered ADF page is the hidden copy.
 *
 * Three tests, each one earning its place against that fixture:
 *   • checkVisibility  — catches `opacity:0`, including on an ancestor
 *   • off-canvas       — catches `left:-9999px`, WITHOUT rejecting a control
 *                        that is merely below the fold (compared against the
 *                        document, not the viewport, so scrolling is still fine)
 *   • ancestor clip    — catches `height:0; overflow:hidden`, the wrapper ADF
 *                        collapses a closed region into
 *
 * Every test is deliberately SCROLL-INDEPENDENT. An earlier version hit-tested
 * with `elementFromPoint`, which reads correctly only while the element is on
 * screen — so once a preceding step scrolled the page, every decoy that
 * scrolled out of view was auto-accepted and the wrong node was chosen. Rect
 * intersection moves with the page; point-hit testing does not.
 *
 * The predicate is passed to `evaluateAll` as a REAL FUNCTION, and its body must
 * stay self-contained (no references to anything in this module's scope).
 * Playwright serialises it and injects it over CDP, which is not subject to the
 * page's Content-Security-Policy. It used to be a string that the evaluated
 * function ran through `eval()` — and that `eval` is ordinary page-context eval,
 * blocked by any `script-src` without `unsafe-eval`. On such a page every call
 * threw, `firstPaintedIndex` returned -1 for every candidate, and EVERY step
 * failed to resolve with a message blaming the locators.
 *
 * Index of the first genuinely painted match, or -1.
 */
async function firstPaintedIndex(locator: Locator): Promise<number> {
  return locator
    .evaluateAll((els) =>
      els.findIndex((el) => {
        if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) return false;

        const absL = r.left + window.scrollX;
        const absT = r.top + window.scrollY;
        const docW = document.documentElement.scrollWidth;
        const docH = document.documentElement.scrollHeight;
        if (absL + r.width <= 0 || absT + r.height <= 0 || absL >= docW || absT >= docH) return false;

        // Any ancestor that clips its overflow must actually contain this element.
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const st = getComputedStyle(p);
          if (st.overflow === 'visible' && st.overflowX === 'visible' && st.overflowY === 'visible') continue;
          const pr = p.getBoundingClientRect();
          const overlapW = Math.min(r.right, pr.right) - Math.max(r.left, pr.left);
          const overlapH = Math.min(r.bottom, pr.bottom) - Math.max(r.top, pr.top);
          if (overlapW <= 1 || overlapH <= 1) return false;
        }
        return true;
      }),
    )
    .catch(() => -1);
}

// ── Selector syntax ────────────────────────────────────────────────────────

function parseSegment(scope: any, selector: string): Locator {
  const sel = String(selector).trim();
  let m: RegExpMatchArray | null;

  if ((m = sel.match(/^nth=(-?\d+)$/))) return scope.nth(parseInt(m[1], 10));

  if ((m = sel.match(/^internal:role=([\w-]+)\[name="((?:[^"\\]|\\.)*)"([is]?)\]$/))) {
    const name = unescape(m[2]);
    return m[3] === 's'
      ? scope.getByRole(m[1], { name, exact: true })
      : scope.getByRole(m[1], { name: ci(name) });
  }

  if ((m = sel.match(/^internal:role=([\w-]+)$/))) return scope.getByRole(m[1]);

  if ((m = sel.match(/^internal:(?:has-)?text="((?:[^"\\]|\\.)*)"([is]?)$/))) {
    const v = unescape(m[1]);
    // Substring by default: ADF concatenates descriptions onto list-row values.
    return scope.getByText(m[2] === 's' ? v : ci(v));
  }

  if ((m = sel.match(/^internal:label="((?:[^"\\]|\\.)*)"([is]?)$/))) {
    const v = unescape(m[1]);
    return scope.getByLabel(m[2] === 's' ? v : ci(v));
  }

  if ((m = sel.match(/^internal:attr=\[([\w-]+)="((?:[^"\\]|\\.)*)"([is]?)\]$/))) {
    // Keep the i flag — Oracle's label casing varies by release and translation.
    const flag = m[3] === 'i' ? ' i' : '';
    return scope.locator(`[${m[1]}="${cssEscapeValue(unescape(m[2]))}"${flag}]`);
  }

  if ((m = sel.match(/^internal:testid=\[[\w-]+="((?:[^"\\]|\\.)*)"\]$/))) {
    return scope.getByTestId(unescape(m[1]));
  }

  return scope.locator(sel); // plain CSS / XPath
}

export function buildLocator(scope: LocatorScope, selector: string): Locator {
  const parts = String(selector).split(/\s*>>\s*/).filter(Boolean);
  return parts.reduce<Locator>(
    (loc, part, i) => (i === 0 ? parseSegment(scope, part) : parseSegment(loc, part)),
    null as unknown as Locator,
  );
}

// ── Candidates ─────────────────────────────────────────────────────────────

/**
 * Every way this step's target might be addressable, best first.
 *
 * A codegen recording gives one selector, so on the face of it there is nothing
 * to choose between. But the recorded selector is frequently a chain that ADF
 * no longer renders the same way, while the role+name it encodes still
 * resolves — so re-deriving those as separate candidates recovers steps that a
 * single-shot lookup drops.
 */
export function candidatesFor(
  /**
   * The document to build against — the page, or the FrameLocator for a step
   * recorded inside an iframe. Every candidate below is scope-relative, so the
   * ladder is identical in a frame and out of it; nothing here knows which.
   */
  scope: LocatorScope,
  action: NormalizedAction,
  patch: AppPatch,
): Array<{ name: string; locator: Locator }> {
  const out: Array<{ name: string; locator: Locator }> = [];
  const add = (name: string, build: () => Locator | null) => {
    try {
      const l = build();
      if (l) out.push({ name, locator: l });
    } catch (_) { /* a malformed candidate must not sink the rest */ }
  };

  // Vendor-specific candidates address the editable node rather than the
  // wrapper Oracle put the recorded id on, so they lead when the recorder
  // actually captured a component id. When the patch merely GUESSED one by
  // scraping the selector, they go after the recorded selector instead: the
  // recorder's own capture is evidence, a scrape is inference, and inference
  // must not outrank it. Ordering only — no candidate is dropped either way.
  const vendor: Array<{ name: string; locator: Locator }> = [];
  if (patch.componentCandidates) {
    try { vendor.push(...patch.componentCandidates(scope, action)); } catch (_) { /* ignore */ }
  }
  const vendorLeads = Boolean(action.componentId);
  if (vendorLeads) out.push(...vendor);

  const { role, accessibleName } = action;
  const loc = action.locator || {};
  const byId = (id: string) => scope.locator(`[id="${cssEscapeValue(id)}"]`);

  // Ordered strongest → weakest. An id or a component address identifies ONE
  // node; a name identifies a role; a bare text match identifies whatever
  // happens to read that way, including the field's own <label>.
  if (loc.id) add('id', () => byId(loc.id!));

  if (role && accessibleName) {
    // Exact BEFORE fuzzy — see the header note about "Save".
    add('role+name-exact', () => scope.getByRole(role as any, { name: accessibleName, exact: true }));
  }
  if (loc.attrSelector) add('attrSelector', () => scope.locator(loc.attrSelector!));
  if (action.selector) add('selector', () => buildLocator(scope, action.selector!));
  // Scraped-guess vendor candidates: still tried, but only once the recorded
  // selector has had its turn.
  if (!vendorLeads) out.push(...vendor);
  if (role && accessibleName) {
    add('role+name', () => scope.getByRole(role as any, { name: ci(accessibleName) }));
  }
  if (loc.label) add('label', () => scope.getByLabel(ci(loc.label!)));
  if (loc.placeholder) add('placeholder', () => scope.getByPlaceholder(loc.placeholder!));
  if (loc.title) add('title', () => scope.locator(`[title="${cssEscapeValue(loc.title!)}"]`));
  if (loc.text) add('text', () => scope.getByText(ci(loc.text!)));
  if (accessibleName && !role) add('name-as-text', () => scope.getByText(ci(accessibleName)));

  // Last: vendor fallbacks for a list launcher whose recorded address matched
  // nothing. These are alternatives to the recording rather than refinements of
  // it, so everything the recorder actually captured is tried first.
  if (patch.launcherCandidates) {
    try { out.push(...patch.launcherCandidates(scope, action)); } catch (_) { /* ignore */ }
  }

  return out;
}

/**
 * A text or label match lands on the field's `<label>` as often as on the field
 * itself. Clicking a label dispatches cleanly and does nothing — which is how
 * "Click Business Unit" passed without ever opening the dropdown.
 */
async function unwrapLabel(scope: LocatorScope, el: Locator): Promise<Locator> {
  const forId = await el
    .evaluate((n: any) => (n.tagName === 'LABEL' ? n.htmlFor || '' : null))
    .catch(() => null);

  if (forId) {
    // Scope-relative: `for` points at an id in the SAME document, so on a step
    // recorded in an iframe this must not escape to the top one.
    const target = scope.locator(`[id="${cssEscapeValue(forId)}"]`).filter({ visible: true });
    if ((await target.count().catch(() => 0)) > 0) return target.first();
  }

  const nested = el.locator("input, textarea, select, [role='combobox']").filter({ visible: true });
  if ((await nested.count().catch(() => 0)) > 0) return nested.first();

  // A caption that neither points at its control nor contains it.
  //
  // ADF renders a checkbox as `<span><input><label>Ordering</label></span>`,
  // frequently with NO `for` attribute — and a text-recorded step lands on that
  // caption, or on a plain <span>/<td> that is not a <label> at all. Clicking it
  // dispatches cleanly and toggles nothing, so "Select Ordering Purpose" passed
  // while the purpose was never selected. Look sideways for the control that
  // this caption labels, staying inside the nearest wrapper so a neighbouring
  // checkbox in the next cell is never picked up.
  const sibling = el
    .locator('xpath=ancestor-or-self::*[self::td or self::span or self::div][1]')
    .locator("input[type='checkbox'], input[type='radio']")
    .filter({ visible: true });
  if ((await sibling.count().catch(() => 0)) === 1) return sibling.first();

  return el;
}

/**
 * Resolve to ONE VISIBLE element, or null.
 *
 * Fast pass first so a step that is already on screen pays no wait at all, then
 * a single shared deadline raced across every candidate — slicing the budget
 * per candidate wasted most of it on the ones that were never going to match.
 *
 * The step's FRAME is resolved here, once, before any candidate is built. Doing
 * it at this single choke point is why every caller — click, fill, lov, copy,
 * every assertion — became frame-aware without changing its call. Note that a
 * missing frame THROWS out of here rather than returning null: "not found in
 * the frame" and "the frame is not there" are different failures and only the
 * second one is safe to state as such.
 */
export async function resolve(
  page: Page,
  action: NormalizedAction,
  patch: AppPatch,
  opts: { timeout?: number; log?: LogFn } = {},
): Promise<Locator | null> {
  const timeout = opts.timeout ?? VISIBLE_TIMEOUT;
  const log = opts.log ?? (() => {});
  const scope = await resolveScope(page, action, log);
  const cands = candidatesFor(scope, action, patch);
  if (!cands.length) return null;

  // Fast pass: most steps are already on screen and should pay no wait at all.
  for (const { name, locator } of cands) {
    const vis = locator.filter({ visible: true });
    try {
      const count = await vis.count();
      if (count === 0) continue;
      const idx = await firstPaintedIndex(vis);
      if (idx < 0) {
        log(`${name} matched ${count} node(s), none painted — skipping`);
        continue;
      }
      log(`resolved via ${name}${count > 1 ? ` (painted match ${idx + 1} of ${count})` : ''}`);
      return await unwrapLabel(scope, vis.nth(idx));
    } catch (_) { /* candidate is not queryable — try the next */ }
  }

  // Nothing on screen yet. Race every candidate on ONE shared deadline —
  // slicing the budget per candidate spent most of it on the ones that were
  // never going to match.
  const winner = await Promise.any(
    cands.map(({ name, locator }) =>
      locator.filter({ visible: true }).first()
        .waitFor({ state: 'visible', timeout })
        .then(() => name),
    ),
  ).catch(() => null);

  if (winner) {
    const vis = cands.find((c) => c.name === winner)!.locator.filter({ visible: true });
    const idx = await firstPaintedIndex(vis);
    // `Math.max(idx, 0)` quietly undid the whole point of the painted predicate:
    // waitFor({state:'visible'}) is satisfied by an off-canvas or transparent
    // node — which is why the fast pass screens with firstPaintedIndex — so
    // falling back to nth(0) handed back the hidden pre-render, in DOM order.
    if (idx < 0) {
      log(`${winner} became visible but no match is painted — treating as unresolved`);
      return null;
    }
    log(`resolved via ${winner} (waited)`);
    return await unwrapLabel(scope, vis.nth(idx));
  }

  log(`unresolved — tried ${cands.map((c) => c.name).join(', ')}`);
  return null;
}

/** Resolve or throw, with a message that names the step rather than the DOM. */
export async function mustResolve(
  page: Page,
  action: NormalizedAction,
  patch: AppPatch,
  kind: string,
  log: LogFn,
  opts: { timeout?: number } = {},
): Promise<Locator> {
  const el = await resolve(page, action, patch, { ...opts, log: (m) => log(`  [${kind}] ${m}`) });
  if (!el) {
    throw new Error(
      `${kind} target not found: ${action.selector || action.accessibleName || '(no locator)'}`,
    );
  }
  return el;
}
