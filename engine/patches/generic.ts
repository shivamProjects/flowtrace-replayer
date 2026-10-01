/**
 * The no-op patch.
 *
 * Two jobs. It is the fallback for an application nobody has written a patch
 * for yet — a plain web app replays fine without vendor knowledge. And it is
 * the base class for every real patch, so a new one starts by overriding only
 * the behaviour that actually differs instead of reimplementing the interface.
 *
 * Adding an application:
 *   1. `class SapPatch extends GenericPatch { … }`
 *   2. override what differs (usually waitForIdle + the list hooks)
 *   3. register it in `patches/index.ts`
 * Nothing under `engine/` changes.
 */

import type { Locator, Page } from '@playwright/test';
import type { AppPatch, LocatorScope, LogFn, NormalizedAction } from '../types';
import { waitForQuiet } from '../settle';
import { ABSENCE, PATIENCE, QUIET } from '../timeouts';

/**
 * Shared page-side visibility test — `offsetParent` lies inside popups.
 *
 * Declared INLINE inside every `page.evaluate` body that needs it, rather than
 * shipped across as a string and revived with `eval()`. That `eval` is ordinary
 * page-context eval, blocked by any `script-src` without `unsafe-eval`; see the
 * long note above `firstPaintedIndex` in `engine/locators.ts` for the full
 * account. Duplication at each call site is what the CSP constraint costs.
 *
 * The test itself is the same one `firstPaintedIndex` applies, and deliberately
 * so. It used to be weaker here — own-element `display`/`visibility`/`opacity`
 * plus a size check, nothing more — which accepted two decoys the locator layer
 * had already learned to reject: a surface scrolled entirely off the document,
 * and a surface inside a collapsed `height:0; overflow:hidden` ancestor. ADF
 * keeps exactly such a wrapper around LOV dialogs, so `countListSurfaces` and
 * the commit-error/output scans could all count a phantom and act on it. Any
 * change here must be mirrored at every inlined copy.
 */

/** Count elements matching `sel` that are actually painted. */
export function countPainted(page: Page, sel: string): Promise<number> {
  return page
    .evaluate((s: string) => {
      // Inlined painted test — see the note in this module's header.
      const painted = (el: Element) => {
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
      };
      return [...document.querySelectorAll(s)].filter(painted).length;
    }, sel)
    .catch(() => 0);
}

export class GenericPatch implements AppPatch {
  readonly name: string = 'generic';

  /** No product to name — prompts read "this application" instead. */
  readonly productName: string = 'this application';

  /** Last resort — the registry only falls back to this, never matches it. */
  matches(_url: string): boolean {
    return false;
  }

  async waitForIdle(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded', { timeout: PATIENCE.settle }).catch(() => {});
    // Returns the moment the DOM stops changing and nothing is in flight —
    // typically single-digit milliseconds on a page that did not react.
    await waitForQuiet(page, { quietMs: QUIET.general, maxMs: PATIENCE.settle });
  }

  async settleAutosuggest(page: Page): Promise<void> {
    // A suggestion list is fetched, so there IS network and DOM activity to
    // wait for. Waiting for it beats sleeping through a guess at its duration.
    await waitForQuiet(page, { quietMs: QUIET.autosuggest, maxMs: PATIENCE.settle });
  }

  isListLauncher(_action: NormalizedAction): boolean {
    return false;
  }

  async countListSurfaces(page: Page): Promise<number> {
    return countPainted(page, '[role="dialog"], [role="listbox"]');
  }

  async listOpened(page: Page, baseline: number, _retry = false): Promise<boolean> {
    return (await this.countListSurfaces(page)) > baseline;
  }

  fieldOfLauncher(_action: NormalizedAction): string | null {
    return null;
  }

  async selectFromOpenList(page: Page, wanted: string, log: LogFn): Promise<boolean> {
    if (await this.pickListRow(page, wanted, log)) return true;

    // If no option was currently visible, try opening visible comboboxes/dropdown controls
    const openables = page.locator('[class*="-control"], [role="combobox"], input[id*="react-select"], div[id="city"], div[id="state"]').filter({ visible: true });
    const count = await openables.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const candidate = openables.nth(i);
      await candidate.click({ timeout: 1000 }).catch(() => {});
      await this.waitForIdle(page);
      if (await this.pickListRow(page, wanted, log)) {
        log(`  [select] selected "${wanted}" after opening combobox`);
        return true;
      }
    }
    return false;
  }

  /** A plain combobox filters on the label as recorded. No ladder needed. */
  lovProbes(wanted: string): string[] {
    return [wanted];
  }

  /**
   * The standard listbox contract: rows are `role="option"`. `getByText` is the
   * fallback for widgets built out of divs with no roles at all, which is most
   * hand-rolled autocompletes.
   */
  async pickListRow(page: Page, wanted: string, _log: LogFn): Promise<boolean> {
    const candidates = [page.getByRole('option', { name: wanted }), page.getByText(wanted)];
    for (const row of candidates) {
      const target = row.filter({ visible: true }).first();
      if ((await target.count().catch(() => 0)) === 0) continue;
      // Report only a click that LANDED. Returning true for a click that threw
      // is what let a failed pick be read as a successful one.
      const clicked = await target.click({ timeout: ABSENCE.action }).then(() => true, () => false);
      await this.waitForIdle(page);
      if (clicked) return true;
    }
    return false;
  }

  async commitTypedValue(page: Page, input: Locator): Promise<void> {
    await input.press('Tab', { timeout: ABSENCE.action }).catch(() => {});
    await this.waitForIdle(page);
  }

  async dismissOpenList(page: Page, _log: LogFn = () => {}): Promise<void> {
    await page.keyboard.press('Escape').catch(() => {});
  }

  async sessionExpired(_page: Page): Promise<boolean> {
    return false;
  }

  async fieldDisabled(el: Locator): Promise<boolean> {
    return el
      .evaluate((n: any) => {
        if (!/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)) return false;
        return !!(n.disabled || n.readOnly || n.getAttribute('aria-disabled') === 'true');
      })
      .catch(() => false);
  }

  isCommitStep(_action: NormalizedAction): boolean {
    return false;
  }

  async collectCommitErrors(_page: Page): Promise<string[]> {
    return [];
  }

  async scanForOutputs(_page: Page): Promise<Record<string, string>> {
    return {};
  }

  /** A plain web app keeps no session state in the URL. */
  /** Nothing to strip — a recorded URL is replayed exactly as captured. */
  rewriteNavigation(
    url: string,
    _currentUrl?: string,
    _sessionOrigin?: string,
    _isFirstNavigate?: boolean,
  ): string | null {
    return url;
  }

  /** Nothing vendor-specific to say — the neutral prompt stands alone. */
  recoveryHints(): string[] {
    return [];
  }

  /**
   * Vendor-neutral surfaces: standard HTML headings and ARIA message roles only.
   *
   * A patch for a real application overrides this with the class names its
   * framework actually paints. The id pattern stays deliberately strict — a bare
   * run of five or more digits — because a loose one turns every amount, date
   * and year on the form into a candidate identifier.
   */
  transactionSurfaces() {
    return {
      title: ['h1', 'h2', '[role="heading"]'],
      message: ['[role="alert"]', '[role="alertdialog"]', '[role="dialog"]', '[role="status"]'],
      dismissDialog: ['[role="dialog"]', '[role="alertdialog"]'],
      generatedIdPattern: '^[A-Z]{1,4}[_\\-]?\\d{4,}|^\\d{5,}$',
      errorExclusion: '[role="alert"][aria-invalid="true"]',
    };
  }

  /**
   * A plain web app publishes no exact key beyond the accessible name itself,
   * and the engine has already retried the name exactly by the time it asks.
   * Returning null means "the name is all there is" — which is the honest
   * answer, and it leaves the engine's own exact-name retry as the whole fix.
   */
  exactMatch(_scope: LocatorScope, _action: NormalizedAction, _wanted: string): Locator | null {
    return null;
  }

  /**
   * A plain web page has no paged strip: every link is either on the page or it
   * is not, and an out-of-view one is reached by scrolling. Saying "no" here is
   * what keeps the relative-nav loop from engaging on applications that do not
   * need it — it is the whole opt-in.
   */
  isRelativeNavStep(_action: NormalizedAction): boolean {
    return false;
  }

  /** No paging control, so no opposite one. */
  reverseNavStep(_action: NormalizedAction): NormalizedAction | null {
    return null;
  }

  /** Nothing to read. '' is "unreadable", which the engine treats as no signal. */
  async navStripSignature(_page: Page): Promise<string> {
    return '';
  }
}

/** Is this element's box inside the visible window right now? */
export async function inViewport(el: Locator): Promise<boolean> {
  return el
    .evaluate((n: any) => {
      const r = n.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false;
      return r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight;
    })
    .catch(() => false);
}
