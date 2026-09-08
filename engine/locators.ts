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
import { TargetNotPresentError } from './errors';

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
 * The text this step is trying to name, from wherever the recording carries it.
 *
 * `accessibleName` is normalize.ts's reading of the recorded selector — it
 * already digs the name out of `internal:role=option[name="X"i]` — and the
 * explicit locator fields are the schema-v1 route to the same thing.
 */
function wantedNameOf(action: NormalizedAction): string {
  const loc = action.locator || {};
  return String(action.accessibleName || loc.name || action.text || loc.text || '').trim();
}

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
  // The application's own exact key for the wanted item, if it publishes one.
  //
  // Placed here — after the exact accessible-name retry, before the recorded
  // selector — because it only earns its slot when the name has already failed
  // to name one element. What the key IS stays entirely inside the patch; the
  // engine passes the wanted text and takes back a locator.
  const wanted = wantedNameOf(action);
  if (wanted) add('patch-exact', () => patch.exactMatch(scope, action, wanted));

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
/**
 * Say so when a recorded selector named more than one painted element.
 *
 * The ladder still ACTS — it takes the first painted match, which is right far
 * more often than not, and refusing would fail steps that work today. But the
 * choice was ours, not the recording's, and that is worth a line in the log.
 *
 * Oracle repeats a label across a form freely: on Manage Depreciation Methods
 * "Depreciation Method for Poland" is both an <option> inside the Regional
 * Information <select> AND the label of a separate LOV field, and each LOV popup
 * then repeats "Disposable." as a row. When two of those are on screen at once,
 * nothing in the recording distinguishes them — so if the wrong one gets acted
 * on, this log line is the only evidence of why, and re-recording the step to
 * capture a componentId is the actual fix.
 *
 * `count` here is the number of VISIBLE matches, not raw matches: the caller
 * has already filtered. That distinction is the point — several raw matches
 * with one visible is the ordinary ADF case (a hidden pre-render beside the
 * real control) and is not ambiguous at all. Warning on that would fire on
 * nearly every step and train people to ignore the message.
 */
/**
 * Break a tie using the recorded component path, before falling back to order.
 *
 * When a selector matches several painted nodes, taking the first is a guess
 * about DOM order. The recording usually knows better: `componentId` is the
 * ADF component address the recorder captured for THIS step
 * (`pt1:_FOr1:1:_FONSr2:0:MAt2:1:AP1:smc2:_0`), and it names one element on the
 * page. Two same-labelled controls in different regions have different paths,
 * so the path picks the right one where position cannot.
 *
 * Matching is by SUFFIX as well as equality, for the reason
 * `locatorCandidates` already documents: the leading region segments change
 * when the same field is reached by a different navigation route, while the
 * tail stays put. A suffix match is therefore the stable half of the address.
 * An `id` recorded without a componentId is used the same way — it is the same
 * kind of evidence.
 *
 * Returns the winning index, or -1 to mean "the recording does not decide it".
 * Never throws: a page that will not answer an evaluate is a reason to fall
 * back to order, not to fail the step.
 */
async function indexByRecordedPath(
  vis: Locator,
  count: number,
  action: NormalizedAction,
): Promise<number> {
  const wanted = String(action.componentId || action.locator?.componentId || action.locator?.id || '').trim();
  if (!wanted || count <= 1) return -1;

  const ids = await vis
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).id || ''))
    .catch(() => [] as string[]);
  if (!ids.length) return -1;

  // Exact first. `::content` is ADF's inner-input suffix on the same component,
  // so a candidate that already unwrapped to the editable node still counts as
  // the same address.
  const bare = (s: string) => s.replace(/::content$/, '');
  const target = bare(wanted);

  let hit = ids.findIndex((id) => bare(id) === target);
  if (hit >= 0) return hit;

  // Then the stable tail. Require a segment boundary so `…:smc2:_1` cannot be
  // satisfied by `…:smc2:_11`, which is a different checkbox.
  hit = ids.findIndex((id) => {
    const b = bare(id);
    return b.endsWith(`:${target}`) || target.endsWith(`:${b}`);
  });
  return hit;
}

/**
 * Break a tie on an EXACT name, before falling back to document order.
 *
 * A recorded role+name is replayed as a case-insensitive SUBSTRING match — that
 * is what the recorder's trailing `i` flag means, and it is right far more often
 * than not, because ADF concatenates extra columns onto a row's text. The cost
 * is that a recorded name which is a strict PREFIX of another item names both:
 *
 *   getByRole('option', { name: /United States/i })
 *     → <li …>United States</li>
 *     → <li …>United States Minor Outlying Islands</li>
 *
 * Taking the first painted match is then a bet on DOM order, and the bet is lost
 * silently — the wrong country is selected and the step reports green, because
 * the recorded name IS a substring of what got picked, so every read-back check
 * downstream agrees with it too. That is the worst failure shape this engine
 * has: a passing run carrying wrong master data.
 *
 * So: when several elements match, ask which of them the name describes
 * EXACTLY. If exactly one does, it is the one the recording meant. If none does
 * — or several do, which means the name genuinely does not distinguish them —
 * this decides nothing and the caller falls back as before. Deliberately NOT a
 * failure: refusing here would break steps that work today.
 *
 * Compared case-insensitively and whitespace-normalised, matching how the rest
 * of the engine reads text; only the substring tolerance is removed.
 *
 * Returns the winning index, or -1. Never throws.
 */
async function indexByExactName(vis: Locator, count: number, wanted: string): Promise<number> {
  const want = wanted.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!want || count <= 1) return -1;

  // Every string a person could reasonably call this element's name. An <input>
  // has no text at all, so its value and placeholder stand in for one.
  const names: string[][] = await vis
    .evaluateAll((els) =>
      els.map((el) => {
        const n = el as HTMLElement;
        const norm = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();
        return [
          norm(n.innerText || n.textContent),
          norm(n.getAttribute('aria-label')),
          norm(n.getAttribute('title')),
          norm((n as HTMLInputElement).value),
        ].filter(Boolean);
      }),
    )
    .catch(() => [] as string[][]);
  if (!names.length) return -1;

  const hits: number[] = [];
  names.forEach((forEl, i) => {
    if (forEl.some((n) => n.toLowerCase() === want)) hits.push(i);
  });
  return hits.length === 1 ? hits[0] : -1;
}

function warnIfAmbiguous(
  how: string,
  count: number,
  idx: number,
  action: NormalizedAction,
  log: LogFn,
): void {
  if (count <= 1) return;
  const label = action.description || action.accessibleName || action.selector || '(unnamed step)';
  log(
    `"${label}" matched ${count} visible node(s) via ${how} — using painted match ${idx + 1}. ` +
    `If the wrong one is acted on, re-record this step: a componentId would make it unambiguous.`,
    'warn',
  );
}

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
      const painted = await firstPaintedIndex(vis);
      if (painted < 0) {
        log(`${name} matched ${count} node(s), none painted — skipping`);
        continue;
      }
      // Ask the recording, then the name, before falling back to document order.
      const byPath = await indexByRecordedPath(vis, count, action);
      const byName = byPath >= 0 ? -1 : await indexByExactName(vis, count, wantedNameOf(action));
      const decided = byPath >= 0 ? byPath : byName;
      const idx = decided >= 0 ? decided : painted;
      if (byPath >= 0 && byPath !== painted) {
        log(`${name} matched ${count} node(s) — recorded component path names match ${byPath + 1}, not ${painted + 1}`);
      }
      if (byName >= 0 && byName !== painted) {
        log(`${name} matched ${count} node(s) — only match ${byName + 1} is named "${wantedNameOf(action)}" exactly, not ${painted + 1}`);
      }
      log(`resolved via ${name}${count > 1 ? ` (match ${idx + 1} of ${count})` : ''}`);
      if (decided < 0) warnIfAmbiguous(name, count, idx, action, log);
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
    const waitedCount = await vis.count().catch(() => 1);
    const byPath = await indexByRecordedPath(vis, waitedCount, action);
    const byName = byPath >= 0 ? -1 : await indexByExactName(vis, waitedCount, wantedNameOf(action));
    const decided = byPath >= 0 ? byPath : byName;
    const chosen = decided >= 0 ? decided : idx;
    if (byPath >= 0 && byPath !== idx) {
      log(`${winner} matched ${waitedCount} node(s) — recorded component path names match ${byPath + 1}, not ${idx + 1}`);
    }
    if (byName >= 0 && byName !== idx) {
      log(`${winner} matched ${waitedCount} node(s) — only match ${byName + 1} is named "${wantedNameOf(action)}" exactly, not ${idx + 1}`);
    }
    log(`resolved via ${winner} (waited)`);
    if (decided < 0) warnIfAmbiguous(winner, waitedCount, chosen, action, log);
    return await unwrapLabel(scope, vis.nth(chosen));
  }

  log(`unresolved — tried ${cands.map((c) => c.name).join(', ')}`);
  return null;
}

/**
 * Is the step's target ABSENT, as opposed to merely unresolved?
 *
 * resolve() asks "can I act on this"; three different worlds answer no — the
 * element is hidden, it is off-canvas, or it does not exist. Only the third is
 * a statement about the ENVIRONMENT, and it is the one that matters: a task
 * link a pod never had is not a selector bug, however much a timeout reads like
 * one.
 *
 * The question asked here is the strict one. Every candidate locator is counted
 * WITHOUT the visible filter, so a hidden or off-screen node — anything the DOM
 * actually holds — answers "present" and this returns null. Only a document in
 * which not one candidate matches at all is called absent.
 *
 * It costs milliseconds: count() resolves immediately either way and never
 * waits. It is therefore run AFTER the ordinary locate budget has already been
 * spent, not instead of it — bailing early would trade a correct verdict for a
 * fast wrong one on any page still painting.
 *
 * Nothing here knows what application it is driving; the candidate list comes
 * from the patch.
 */
export async function proveAbsent(
  page: Page,
  action: NormalizedAction,
  patch: AppPatch,
  log?: LogFn,
): Promise<{ absent: boolean; searched: number }> {
  let scope: LocatorScope;
  try {
    scope = await resolveScope(page, action, () => {});
  } catch (_) {
    // The frame the step wanted is gone. That is not evidence of absence.
    return { absent: false, searched: 0 };
  }
  const cands = candidatesFor(scope, action, patch);
  if (!cands.length) return { absent: false, searched: 0 };

  let searched = 0;
  for (const { name, locator } of cands) {
    // -1 on a throw, deliberately: an unqueryable candidate is UNKNOWN, and
    // unknown must never be reported as absent.
    const n = await locator.count().catch(() => -1);
    if (n !== 0) {
      log?.(`present in the DOM via ${name} (${n} node(s)) — not an absence`);
      return { absent: false, searched };
    }
    searched++;
  }
  return { absent: true, searched };
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
    const target = action.accessibleName || action.description || action.selector || '(no locator)';
    const { absent, searched } = await proveAbsent(page, action, patch, (m) => log(`  [${kind}] ${m}`));
    if (absent) {
      const err: any = new TargetNotPresentError(target, {
        searched,
        scope: action.selector || '',
        message:
          `"${target}" is NOT PRESENT ON THIS INSTANCE. After the full locate budget ` +
          `every one of the ${searched} candidate locator(s) matched nothing in the ` +
          `document — not hidden, not off-screen, absent — so this is not a timeout ` +
          `and not a stale selector: the feature the script needs is not provisioned ` +
          `on this environment, or the signed-in user has no access to it.`,
      });
      err.failureStage = 'ABSENT';
      throw err;
    }
    const err: any = new Error(
      `${kind} target not found: ${action.selector || action.accessibleName || '(no locator)'}`,
    );
    err.failureStage = 'LOCATE';
    throw err;
  }
  return el;
}
