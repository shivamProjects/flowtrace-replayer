/**
 * Oracle Fusion Cloud (ADF / JET).
 *
 * Everything the replayer knows about Oracle rather than about the web. Kept
 * here so `engine/` stays a generic Playwright driver and this is the single
 * file to open when Oracle changes a skin, a class name or a message.
 *
 * Four concerns:
 *   1. Waiting  — a partial-page refresh is neither navigation nor idle.
 *   2. Lists    — LOVs and dropdowns, and proving one actually opened.
 *   3. Commits  — a Save that Oracle refused looks like one it accepted.
 *   4. Outputs  — the identifier Oracle assigned, never the one we sent.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import type { LocatorScope, LogFn, NormalizedAction } from '../types';
import { GenericPatch, countPainted } from './generic';
import { waitForQuiet, waitUntil } from '../settle';
import { ABSENCE, PATIENCE, QUIET } from '../timeouts';

const T = {
  adfIdle: PATIENCE.settle,      // a PPR round trip, or a heavy tile rendering
  lovOpen: ABSENCE.listOpen,     // launcher click → list on screen
  commit: PATIENCE.commitScan,   // how long to keep reading a refusal dialog
};

// Loading indicators ONLY. `.AFGlassPane` and `[role=progressbar]` stay painted
// for a modal's entire lifetime, so including them burned the full budget on
// every step performed inside an LOV dialog.
const BUSY_SEL =
  '.AFPopUpLoadingIndicator, .af_statusIndicator, .p_AFLoadingIndicator, .AFLoadingIcon, .af_loadingIndicator';

/**
 * A Redwood (Oracle JET) picker list, open.
 *
 * JET renders one as `<ul class="oj-listview-element" role="grid"
 * aria-rowcount="3">` — no dialog, no ADF id shape, nothing the selectors below
 * this were written for. Captured live from ibqwjb-test; see
 * `checks/pages/redwood-picker.html` for the unmodified markup.
 *
 * Deliberately NOT a bare `[role=grid]`: an ADF LOV dialog's results table is
 * also a grid, and matching it here would route ADF picks down the Redwood
 * path, which has no Search button and no OK button to press.
 */
const REDWOOD_LIST_SEL =
  'ul.oj-listview-element[role="grid"], ul[role="grid"][aria-rowcount], ul[role="grid"]:has(> li[role="row"])';

// A row inside one. The `<li role=row>` carries the volatile id; the gridcell
// inside it carries the text, which is what a person actually picked.
const REDWOOD_ROW_SEL = '[role="gridcell"]';

// Every surface ADF can open for a launcher click. Counted, never tested for
// existence: a hidden container per field always exists, so only a RISE over
// the pre-click baseline proves that THIS click opened something.
const LOV_SURFACE_SEL = [
  'div[id$="lovDialogId"]',
  'div[id$="lovPopupId"]',
  '[id$="::dropdownPopup::dropDownContent"]',
  'ul[id$="::_afrautosuggestpopup"]',
  '[id$="::popup-container"]',
  '[id*="_afrPopup"]',
  '[role="dialog"]',
  // Redwood (JET). Every entry above is an ADF shape, so on a JET page this
  // list counted ZERO surfaces however many pickers were open — which made
  // `listOpened` report that a launcher click opened nothing, and left
  // `_openListDialog` with nothing to hand `selectFromOpenList`.
  REDWOOD_LIST_SEL,
].join(', ');

// The autosuggest list specifically — narrower than LOV_SURFACE_SEL, because
// this is asking "did suggestions arrive", not "did any popup open".
// Containers ADF uses for a Search-and-Select dialog. The suffix carries no
// "::" - ADF concatenates it onto the field id, so real dialogs read like
// "batchSourceIdlovPopupId" and requiring "::" matched none of them.
const LOV_DIALOG_SEL = 'div[id$="lovDialogId"], div[id$="lovPopupId"], [role="dialog"]';

// Surfaces ADF puts a refusal on.
const ERROR_SURFACE_SEL =
  '[role="alertdialog"], [role="dialog"], div[id$="::msgDlg"], .af_messages, .AFErrorDialog, .p_AFError';

const COMMIT_BUTTON_RE =
  /^(save|save and close|save and create next|submit|apply|post|confirm|finish)$/i;

/**
 * A commit is REFUSED unless the message says otherwise.
 *
 * The rule below was a list of seven "required field" phrasings, which made
 * refusal detection an allowlist of the ways Oracle says "you left something
 * blank" — and blind to every other way it says no. Measured against real
 * refusals, none of these matched:
 *   "The transaction date is not in an open period."
 *   "Duplicate invoice number for this supplier."
 *   "You are not authorized to perform this action."
 *   "The invoice amount exceeds the tolerance defined for this supplier site."
 * Each one produced [commit] "Save" accepted for a record Oracle had rejected.
 *
 * Inverted: anything painted on a message surface after a commit is a refusal
 * unless it is recognisably a confirmation. That direction fails SAFE — an
 * unrecognised confirmation costs a false red, which is visible and cheap; an
 * unrecognised refusal costs a false green, which is neither.
 */
const COMMIT_BENIGN_RE =
  /\b(?:has been|have been|was|were|successfully)\s+(?:saved|created|submitted|updated|applied|completed|processed)\b|\bsaved successfully\b|\bno results\b|\bno data\b/i;

// Kept only to RANK which message to quote first — never to decide.
const COMMIT_ERROR_RE =
  /you must enter a value|messages for this page are listed below|a value is required|is required\b|must be entered|cannot be blank|please enter a value/i;

// Where Oracle tends to put a confirmation. Deliberately wider than the ADF
// class names — its Information dialog carries none of them.
const OUTPUT_SURFACE_SEL = [
  '.af_m_fmt', '.AFNoteWindow', '.af_dialog_body-content', '.AFMessageText',
  '[role="alert"]', '[role="alertdialog"]', '[role="dialog"]',
  'div[id$="::msgDlg"]', '.AFPopupSelector', '.oj-dialog', '.oj-messages',
].join(', ');

const OUTPUT_PATTERNS = [
  { name: 'Invoice Number', re: /invoice\s+([A-Za-z0-9\-\/]{3,})\s+(?:was|has been)\s+(?:created|saved)/i },
  { name: 'Transaction Number', re: /transaction\s+([A-Za-z0-9\-\/]{3,})\s+(?:was|has been)\s+(?:created|saved)/i },
  { name: 'Order Number', re: /order\s+([A-Za-z0-9\-\/]{3,})\s+(?:was|has been)\s+(?:created|submitted)/i },
  { name: 'Confirmation', re: /\b(?:confirmation|reference)\s*(?:number|#)?\s*[:\-]?\s*([A-Za-z0-9\-\/]{4,})/i },
];

export class OraclePatch extends GenericPatch {
  readonly name = 'oracle-fusion';

  readonly productName = 'Oracle Fusion Cloud';

  matches(url: string): boolean {
    return /oraclecloud\.com|\/fscmUI\/|\/hcmUI\/|\/crmUI\/|_afrLoop|_afrWindowMode/i.test(url || '');
  }

  // ── 1. Waiting ───────────────────────────────────────────────────────────

  /**
   * A partial-page refresh is neither a navigation nor `networkidle`. Polling
   * immediately is a no-op — it runs a few ms after the click, before ADF has
   * even issued the request — so watch for one to START, then wait it out.
   */
  async waitForIdle(page: Page): Promise<void> {
    const t0 = Date.now();

    // Settle on evidence, not on a clock.
    //
    // This used to spend a flat 700ms per step watching for an ADF loading
    // indicator to APPEAR, on the theory that polling immediately would run
    // before ADF had issued its request. That cost was charged to every step,
    // including the majority that trigger no round trip at all.
    //
    // The DOM probe removes the need for the guess: a partial-page refresh
    // mutates the DOM and issues an XHR, and both are visible to the probe the
    // instant they happen. So wait for quiet first — it returns in a few
    // milliseconds when nothing happened, and covers the whole round trip when
    // something did.
    const quiet = await waitForQuiet(page, { quietMs: QUIET.general, maxMs: T.adfIdle });

    // Then confirm ADF's own indicator is clear. A spinner animating on a
    // canvas or a CSS transform need not mutate the DOM, so the probe can read
    // quiet while ADF is still working — this is the belt to its braces, and it
    // costs one DOM query when nothing is spinning.
    if ((await countPainted(page, BUSY_SEL)) > 0) {
      const cleared = await expect
        .poll(async () => (await countPainted(page, BUSY_SEL)) === 0, {
          timeout: Math.max(T.adfIdle - quiet.waitedMs, 2_000),
          intervals: [100],
        })
        .toBe(true)
        .then(() => true, () => false);
      if (!cleared) console.log(`  [adf] still busy after ${Date.now() - t0}ms — continuing`);
    }

    const ms = Date.now() - t0;
    if (ms > 2000) console.log(`  [adf] settled in ${ms}ms (${quiet.reason})`);
  }

  /**
   * ADF debounces an autosuggest ~300-500ms and then makes a server round trip.
   * Committing inside that window hands it an unresolved term — and on an LOV
   * that is exactly when Enter or Tab opens Search-and-Select instead of
   * accepting the value. A human never hits it; their reaction time covers it.
   */
  async settleAutosuggest(page: Page): Promise<void> {
    // One adaptive wait, sized to outlast the debounce.
    //
    // The sequence after typing is: ~300-500ms of silence while ADF debounces,
    // THEN an XHR, THEN the list renders. A short quiet window would return
    // during the silence and commit an unresolved term — so the window has to
    // be longer than the debounce. Beyond that there is nothing to guess at:
    // the XHR is counted and the render mutates the DOM, so both extend the
    // wait automatically and exactly as far as they actually take.
    await waitForQuiet(page, { quietMs: QUIET.autosuggest, maxMs: T.adfIdle });
    if ((await countPainted(page, BUSY_SEL)) > 0) await this.waitForIdle(page);
  }

  // ── 2. Lists ─────────────────────────────────────────────────────────────

  /**
   * A click whose only purpose is to open a list. Oracle titles the search
   * icons "Search: X" / "Search and Select: X" and ids them `::lovIconId`; a
   * dropdown arrow is instead recorded as a chain into the combobox. Either
   * way the step has exactly one job, so it can be checked — "Click Business
   * Unit" used to pass while opening nothing.
   */
  isListLauncher(action: NormalizedAction): boolean {
    const loc = action.locator || {};
    // The recorder states both of these outright after looking at the live DOM,
    // so they beat anything inferred from the selector text.
    if (loc.hasLovIcon) return true;
    if (String(loc.containerRole || '').toLowerCase() === 'combobox') return true;

    const label = String(action.accessibleName || action.description || '');
    const sel = String(action.selector || '') + String(loc.attrSelector || '') + String(loc.id || '');
    return (
      /^Search(\s+and\s+Select)?\s*:/i.test(label) ||
      /::lovIconId/.test(sel) ||
      /combobox[^>]*>>\s*a\s*$/i.test(String(action.selector || ''))
    );
  }

  async countListSurfaces(page: Page): Promise<number> {
    return countPainted(page, LOV_SURFACE_SEL);
  }

  async listOpened(page: Page, baseline: number, retry = false): Promise<boolean> {
    return expect
      .poll(async () => (await this.countListSurfaces(page)) > baseline, {
        timeout: retry ? ABSENCE.listOpenRetry : T.lovOpen,
        intervals: [150],
      })
      .toBe(true)
      .then(() => true, () => false);
  }

  /**
   * The field a trigger belongs to: the recorded chain minus its trailing step.
   * ADF renders the arrow as a SIBLING of the combobox, so a recorded `>> a`
   * resolves nothing and the step falls through to whatever else matched the
   * label text — historically the `<label>`, which clicks harmlessly.
   */
  fieldOfLauncher(action: NormalizedAction): string | null {
    const sel = String(action.selector || '');
    const base = sel.replace(/\s*>>\s*a\s*$/i, '');
    return base && base !== sel ? base : null;
  }

  /**
   * An ADF LOV grid is VIRTUALISED: the table declares `_rowcount="253"` and
   * renders about 25. A recorded row click therefore replays only while the
   * wanted row happens to be among those drawn — "United States" sits ~230 rows
   * down and is not in the DOM at all, so no amount of waiting finds it.
   *
   * Recover the way the field is meant to be used: type into the dialog's own
   * search box, which filters server-side, then pick the row. This matters
   * beyond the one step — the dialog is modal, so a row that is never picked
   * leaves it open and every later step acts on a blocked page.
   */
  /**
   * The LOV dialog a person would actually be looking at.
   *
   * `.last()` was wrong, and the comment calling it "the topmost" was wrong
   * with it: that is DOM order, not stacking order. ADF renders ONE container
   * per LOV field on the page, most of them empty and unpainted, and a stale
   * one from an earlier step stays visible — so DOM order routinely lands on an
   * empty or stale container while the real dialog sits on top, untouched.
   *
   * Three filters, each earning its place:
   *   - painted           the shared visibility test
   *   - ancestor DISPLAY  display:none only, NOT the ancestor's box: ADF
   *                       positions popup content absolutely, leaving a
   *                       zero-height wrapper, so a box test rejects real ones
   *   - has something to  discards the empty per-field containers that exist
   *     interact with     for every LOV on the page
   *
   * Then the topmost survivor by hit test, because comparing z-index by hand is
   * wrong across stacking contexts.
   */
  private async _openListDialog(page: Page): Promise<Locator | null> {
    const idx: number = await page
      .evaluate((sel: string) => {
        // Painted test inlined, not `eval`ed from a string: page-context eval is
        // blocked by any CSP without `unsafe-eval`. See `engine/locators.ts`.
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
        const all = [...document.querySelectorAll(sel)];
        const live: number[] = [];
        for (let i = 0; i < all.length; i++) {
          const d = all[i];
          if (!painted(d)) continue;
          let hidden = false;
          for (let p = d.parentElement; p; p = p.parentElement) {
            if (getComputedStyle(p).display === 'none') { hidden = true; break; }
          }
          if (hidden) continue;
          const usable = [...d.querySelectorAll('input, button, [role="row"], tr')].some(painted);
          if (!usable) continue;
          live.push(i);
        }
        if (!live.length) return -1;
        for (let k = live.length - 1; k >= 0; k--) {
          const d = all[live[k]];
          const r = d.getBoundingClientRect();
          const cx = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
          const cy = Math.min(Math.max(r.top + 10, 1), window.innerHeight - 1);
          const hit = document.elementFromPoint(cx, cy);
          if (hit && d.contains(hit)) return live[k];
        }
        return live[live.length - 1];
      }, LOV_DIALOG_SEL)
      .catch(() => -1);

    return idx < 0 ? null : page.locator(LOV_DIALOG_SEL).nth(idx);
  }

  /**
   * Close a list dialog that is still open.
   *
   * A Search-and-Select dialog is MODAL: left open, every remaining step acts
   * on a blocked page, and the report blames whichever step ran next instead of
   * the one that failed to pick a row. Escalation matters — Escape alone is
   * swallowed when focus is trapped inside the LOV grid.
   */
  async dismissOpenList(page: Page, log: LogFn = () => {}): Promise<void> {
    const stillOpen = async () => !!(await this._openListDialog(page));
    if (!(await stillOpen())) return;

    await page.keyboard.press('Escape').catch(() => {});
    await this.waitForIdle(page);
    if (!(await stillOpen())) { log('  [lov] dialog dismissed (Escape)'); return; }

    await page.keyboard.press('Tab').catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    await this.waitForIdle(page);
    if (!(await stillOpen())) { log('  [lov] dialog dismissed (Tab+Escape)'); return; }

    // Last resort, and deliberately kept: it is the difference between one
    // failed step and every step after it failing too.
    await page
      .evaluate((sel) => {
        for (const d of document.querySelectorAll(sel as string)) {
          (d as HTMLElement).style.display = 'none';
          d.remove();
        }
      }, LOV_DIALOG_SEL)
      .catch(() => {});
    log('  [lov] dialog force-removed - Escape did not close it', 'warn');
  }

  /**
   * ADF LOV recordings capture a grid row's whole concatenated text — "MANUAL
   * OTHER  Manual Order" is three columns run together, not a label. Typing all
   * of it filters the list to nothing, so fall back to progressively shorter
   * prefixes and let the engine's evidence check decide which attempt took.
   */
  lovProbes(wanted: string): string[] {
    const words = String(wanted || '').trim().split(/\s+/);
    const probes = [wanted];
    if (words.length > 2) probes.push(words.slice(0, 2).join(' '));
    if (words.length > 1) probes.push(words[0]);
    return probes;
  }

  /**
   * ADF renders suggestion rows three different ways depending on the widget:
   * an inline `role="option"` popup, or a table whose cells carry `gridcell` /
   * `cell`. A Search-and-Select LOV is a modal grid instead, handled by
   * `selectFromOpenList` — which is why that is the last resort here.
   */
  async pickListRow(page: Page, wanted: string, log: LogFn): Promise<boolean> {
    const candidates = [
      page.getByRole('option', { name: wanted }),
      page.getByRole('gridcell', { name: wanted }),
      page.getByRole('cell', { name: wanted }),
      page.getByText(wanted),
    ];
    for (const row of candidates) {
      const target = row.filter({ visible: true }).first();
      if ((await target.count().catch(() => 0)) === 0) continue;
      const clicked = await target.click({ timeout: ABSENCE.action }).then(() => true, () => false);
      await this.waitForIdle(page);
      if (clicked) return true;
    }
    return await this.selectFromOpenList(page, wanted, log);
  }

  async selectFromOpenList(page: Page, wanted: string, log: LogFn): Promise<boolean> {
    const want = String(wanted || '').trim();
    if (!want) return false;

    // Redwood first. Its list is not a dialog, so `_openListDialog` returns null
    // for it and the whole ADF path below is unreachable — which is why a
    // Business Unit row recorded as `[id$="table:1250645336_0"]` had no recovery
    // at all once that id stopped resolving.
    if (await this._selectFromRedwoodList(page, want, log)) return true;

    const dialog = await this._openListDialog(page);
    if (!dialog) return false;

    const search = dialog
      .locator('input[type="text"], input:not([type])')
      .filter({ visible: true })
      .first();
    if ((await search.count().catch(() => 0)) === 0) return false;

    log(`  [lov] filtering the open dialog for "${want}"`);
    await search.fill(want, { timeout: ABSENCE.action }).catch(() => {});

    // Prefer the dialog's own Search button. Enter fires the dialog's DEFAULT
    // button where there is one, which on some skins is Cancel.
    const searchBtn = dialog
      .locator('button[id$="::search"], button[id$="::Search"]')
      .filter({ visible: true })
      .first();
    if ((await searchBtn.count().catch(() => 0)) > 0) {
      await searchBtn.click({ timeout: ABSENCE.visibleShort }).catch(() => {});
    } else {
      await search.press('Enter').catch(() => {});
    }
    await this.waitForIdle(page);

    if (await this._pickShortestMatch(page, dialog, want, log)) return true;

    // Some pickers only HIGHLIGHT on a row click and close on OK - and ADF
    // often renders that button in a sibling toolbar OUTSIDE the dialog
    // subtree, sometimes as <a role="button"> rather than <button>. Narrow ids
    // only: a page-wide "Save" search would commit the half-filled form behind.
    const okById = page
      .locator('button[id$="::dc_cb3"], button[id$="::cb1"], button[id$="::btnOk"], button[id$="::okBtn"]')
      .filter({ visible: true })
      .first();
    const okByRole = page
      .getByRole('button', { name: /^(ok|select|apply|done)$/i })
      .filter({ visible: true })
      .first();
    for (const candidate of [okById, okByRole]) {
      if ((await candidate.count().catch(() => 0)) === 0) continue;
      await candidate.click({ timeout: ABSENCE.visibleShort }).catch(() => {});
      await this.waitForIdle(page);
      if (!(await this._openListDialog(page))) {
        log(`  [lov] confirmed "${want}"`);
        return true;
      }
    }
    return false;
  }

  /**
   * Pick a row out of an open Redwood (JET) picker, BY ITS TEXT.
   *
   * This is the half the tail rewrite could not supply. A recorder that stores
   * `[id$="table:1250645336_0"]` gives the replay a stable address for the row,
   * but that address means nothing to an operator: in the UI they type a
   * business unit NAME, and it is the name that ends up in the parameter map and
   * gets overridden per run. So when the recorded id no longer resolves — a
   * different data set, a filtered list, a row that moved index — recovery has
   * to work from the value, exactly as a person would.
   *
   * Two shapes are handled, in order:
   *   1. The row is already rendered — click it. A short list (Sales Channel has
   *      three) never needs filtering, and typing into it would only narrow a
   *      list that already contains the answer.
   *   2. It is not — type the value into the combobox that owns the list, let
   *      JET filter server-side, then click. This is the virtualised case, the
   *      Redwood equivalent of the ADF dialog's search box.
   *
   * Ranking is shared with the ADF path (`_rankRows`), so "MANUAL" cannot select
   * "MANUAL ADJUSTMENT" here either.
   */
  private async _selectFromRedwoodList(page: Page, want: string, log: LogFn): Promise<boolean> {
    const list = page.locator(REDWOOD_LIST_SEL).filter({ visible: true }).first();
    if ((await list.count().catch(() => 0)) === 0) return false;

    if (await this._clickRedwoodRow(page, list, want, log)) return true;

    // Not on screen. Filter the way the field is meant to be used.
    //
    // The input is NOT inside the list — JET renders the popup as a sibling of
    // the combobox, or reparents it to <body> entirely — so it is found through
    // the list's `aria-labelledby`, which points at the field's own label. That
    // keeps the typing pinned to the field this list belongs to; a page-wide
    // "first visible combobox" would type into whichever one painted first.
    const input = await this._redwoodFilterInput(page, list);
    if (!input) return false;

    log(`  [lov] filtering the Redwood picker for "${want}"`);
    await input.fill(want, { timeout: ABSENCE.action }).catch(() => {});
    await this.settleAutosuggest(page);

    return await this._clickRedwoodRow(
      page,
      page.locator(REDWOOD_LIST_SEL).filter({ visible: true }).first(),
      want,
      log,
    );
  }

  /** The combobox input feeding an open JET listview, or null. */
  private async _redwoodFilterInput(page: Page, list: Locator): Promise<Locator | null> {
    const labelledBy = await list.getAttribute('aria-labelledby').catch(() => null);
    if (labelledBy) {
      // `oj-selectsingle-12-labelled-by` — the id of the field's label element.
      // Its owning component is the combobox we want to type into.
      const owned = page
        .locator(`[aria-labelledby~="${labelledBy.replace(/["\\]/g, '\\$&')}"]`)
        .locator('input:not([type="hidden"])')
        .filter({ visible: true })
        .first();
      if ((await owned.count().catch(() => 0)) > 0) return owned;
    }

    // Fall back to the focused input. Opening a JET picker focuses its search
    // field, so this is right far more often than it looks — and it is only
    // reached when the list declares no label to pin to.
    const active = page.locator('input:focus').filter({ visible: true }).first();
    return (await active.count().catch(() => 0)) > 0 ? active : null;
  }

  /** Click the best text match among a JET listview's rows. */
  private async _clickRedwoodRow(page: Page, list: Locator, want: string, log: LogFn): Promise<boolean> {
    if ((await list.count().catch(() => 0)) === 0) return false;
    const rows = list.locator(REDWOOD_ROW_SEL);
    const texts: string[] = await rows
      .evaluateAll((els) => els.map((e) => ((e as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim()))
      .catch(() => [] as string[]);

    const best = this._rankRows(texts, want);
    if (!best) return false;

    if (best.t.toLowerCase() !== want.toLowerCase()) {
      log(`  [lov] "${want}" -> closest Redwood row "${best.t.slice(0, 60)}"`);
    }
    const clicked = await rows
      .nth(best.i)
      .click({ timeout: ABSENCE.action })
      .then(() => true, () => false);
    if (!clicked) return false;

    await this.waitForIdle(page);
    log(`  [lov] selected "${best.t.slice(0, 60)}"`);
    return true;
  }

  /**
   * The SHORTEST matching row, not the first in DOM order.
   *
   * Substring matching plus `.first()` is how "MANUAL" selects "MANUAL
   * ADJUSTMENT", "United States" selects "United States Minor Outlying
   * Islands", and "Invoice" selects "Invoice Correction". The wrong value then
   * lands - and because the typed term IS a prefix of it, the read-back check
   * ACCEPTS it. A green step carrying the wrong master data is worse than a
   * failed one. Ranking exact > prefix > contains, then by length, is the fix.
   *
   * Shared by both list shapes: a Redwood picker offers exactly the same way to
   * pick the wrong row, and it would be a poor trade to fix it in one place.
   */
  private _rankRows(texts: string[], want: string): { i: number; t: string; n: number } | null {
    const target = want.toLowerCase();
    const rank = (t: string): number => {
      const v = t.toLowerCase();
      if (!v) return -1;
      if (v === target) return 0;
      if (v.startsWith(target)) return 1;
      if (v.includes(target)) return 2;
      return -1;
    };

    const matches = texts
      .map((t, i) => ({ i, t, r: rank(t) }))
      .filter((m) => m.r >= 0)
      .sort((a, b) => a.r - b.r || a.t.length - b.t.length);
    if (!matches.length) return null;
    return { i: matches[0].i, t: matches[0].t, n: matches.length };
  }

  private async _pickShortestMatch(
    page: Page,
    dialog: Locator,
    want: string,
    log: LogFn,
  ): Promise<boolean> {
    const rows = dialog.locator('[role="cell"], [role="gridcell"], [role="option"], td');
    const texts: string[] = await rows
      .evaluateAll((els) => els.map((e) => ((e as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim()))
      .catch(() => [] as string[]);
    if (!texts.length) return false;

    const best = this._rankRows(texts, want);
    if (!best) return false;

    if (best.t.toLowerCase() !== want.toLowerCase()) {
      log(`  [lov] "${want}" -> closest row "${best.t.slice(0, 60)}"` +
          (best.n > 1 ? ` (${best.n} matched)` : ''));
    }
    await rows.nth(best.i).click({ timeout: ABSENCE.action }).catch(() => {});
    await this.waitForIdle(page);
    if (!(await this._openListDialog(page))) {
      log(`  [lov] selected "${best.t.slice(0, 60)}"`);
      return true;
    }
    return false;
  }

  /**
   * Are we looking at an Oracle sign-in screen?
   *
   * A session that expires mid-run bounces every later step to IDCS, where
   * they all fail "target not found". Left unclassified that costs twice: the
   * report blames the locator instead of the session, and AI recovery spends a
   * model call trying to find a Save button on a login page.
   *
   * URL first because it is free and decisive; page text only as a fallback.
   */
  async sessionExpired(page: Page): Promise<boolean> {
    const url = page.url() || '';
    if (/idcs-|\/ui\/v1\/signin|\/oam\/|\/sso\/|\/adfs\/|login\.|\/signin/i.test(url)) return true;
    return page
      .evaluate(() => {
        const t = (document.title || '').toLowerCase();
        const b = ((document.body && document.body.innerText) || '').slice(0, 400).toLowerCase();
        return /sign in|sign-in|log in|authenticate/.test(t) ||
               /sign in to oracle|please sign in|session (?:has )?expired|your session has timed out/.test(b);
      })
      .catch(() => false);
  }

  /**
   * Is this field disabled in a way Playwright cannot see?
   *
   * Playwright's actionability honours the `disabled` PROPERTY on form controls
   * and an ancestor <fieldset disabled>. It does not look at `aria-disabled`,
   * and it knows nothing about ADF's `.p_AFDisabled` wrapper class - which is
   * how Fusion soft-disables a dependent field until the field it depends on
   * commits (Tax Registration Number stays disabled until Tax Country lands).
   *
   * Without this the keystrokes are silently swallowed and the blank-field
   * guard fails the step, one to three seconds before the partial refresh would
   * have enabled it.
   */
  async fieldDisabled(el: Locator): Promise<boolean> {
    return el
      .evaluate((n: any) => {
        if (!/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)) return false;
        if (n.disabled || n.readOnly) return true;
        if (n.getAttribute('aria-disabled') === 'true') return true;
        return !!n.closest('.p_AFDisabled');
      })
      .catch(() => false);
  }

  // ── 3. Commits ───────────────────────────────────────────────────────────

  isCommitStep(action: NormalizedAction): boolean {
    return COMMIT_BUTTON_RE.test(String(action.accessibleName || action.description || '').trim());
  }

  /**
   * A Save that Oracle REFUSED still dispatches cleanly, so the click alone
   * proves nothing: a run could report every step green while the record it was
   * supposed to create never existed. Read the refusal off the page.
   */
  async collectCommitErrors(page: Page): Promise<string[]> {
    const scan = () => this._scanCommitErrors(page);

    // An accepted Save is the common case and must not be charged for the
    // rejected one. This used to poll for a flat 6s before concluding "no
    // errors", so every successful commit cost six seconds of pure waiting.
    //
    // doClick has already awaited waitForIdle, so the page is settled and a
    // validation dialog would already be painted: look once. Only if a dialog
    // surface is present but has not yet rendered its text is a short grace
    // poll worth paying.
    const first = await scan();
    if (first.length) return first;

    const surfaced = await waitUntil(
      page,
      async () => (await countPainted(page, ERROR_SURFACE_SEL)) > 0,
      { maxMs: ABSENCE.commitAppear, pollMs: 60 },
    );
    if (!surfaced) return [];

    const deadline = Date.now() + T.commit;
    while (Date.now() < deadline) {
      const found = await scan();
      if (found.length) return found;
      await page.waitForTimeout(120);
    }
    return [];
  }

  /** One pass over the message surfaces ADF uses to refuse a commit. */
  /** One pass over the message surfaces the app uses to refuse a commit. */
  private async _scanCommitErrors(page: Page): Promise<string[]> {
    return page
      .evaluate(([rankSrc, benignSrc, sel]) => {
        const rank = new RegExp(rankSrc as string, 'i');
        const benign = new RegExp(benignSrc as string, 'i');
        // Painted test inlined, not `eval`ed from a string: page-context eval is
        // blocked by any CSP without `unsafe-eval`. See `engine/locators.ts`.
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
        const strong: string[] = [];
        const weak: string[] = [];
        for (const s of document.querySelectorAll(sel as string)) {
          if (!painted(s)) continue;
          const text = ((s as HTMLElement).innerText || '').trim();
          // A confirmation is not a refusal. ANYTHING ELSE painted on a message
          // surface after a commit is treated as one.
          if (!text || benign.test(text)) continue;
          const links = [...s.querySelectorAll('a, label, .af_messages_label')]
            .map((a) => ((a as HTMLElement).innerText || '').trim())
            .filter((t) => t && t.length < 60);
          const entries = links.length ? links : [text.slice(0, 200)];
          if (rank.test(text)) strong.push(...entries);
          else weak.push(...entries);
        }
        // Prefer a recognised phrasing when quoting, but an unrecognised
        // message still counts — that is the whole point of the inversion.
        return [...new Set(strong.length ? strong : weak)];
      }, [COMMIT_ERROR_RE.source, COMMIT_BENIGN_RE.source, ERROR_SURFACE_SEL] as [string, string, string])
      .catch(() => [] as string[]);
  }

  // ── 4. Outputs ───────────────────────────────────────────────────────────

  /**
   * Identifiers Oracle assigned during this run.
   *
   * The surface list is a hint, not a contract. Measured against a real Create
   * Transaction run, the confirmation ADF actually showed — "Transaction
   * CT21987 has been saved." in an Information dialog — matched NONE of the
   * class/role selectors this used to rely on, so the identifier was on screen
   * and captured nothing. Any downstream script binding a parameter to it got
   * an empty value, silently.
   *
   * So: try the known surfaces first (cheap, and keeps the text tightly
   * scoped), then fall back to the visible body text. The patterns themselves
   * are specific enough — "Transaction <id> has been saved" does not appear by
   * accident — that widening the haystack costs precision nothing.
   */
  /**
   * ADF's surfaces, and the shape of an Oracle-assigned identifier.
   *
   * `x11n` / `x12i` / `x4y` are generated ADF style classes — obfuscated and
   * version-dependent, which is why the lists are long and ordered
   * most-specific-first rather than clever.
   */
  /**
   * ADF puts per-session state in the URL (`_adf.ctrl-state`, `_afrLoop`).
   * Strip those and navigate to the recorded PAGE — Oracle reissues fresh
   * tokens on arrival and the session is untouched.
   *
   * This used to skip the navigation outright, on the theory that a stale token
   * logs the run out. Probing the live app disproved that: navigating to the
   * recorded URL verbatim, with the tokens stripped, and to the bare path all
   * three landed on the page while staying logged in. Meanwhile the skip left
   * the run on Oracle's *new* post-login home (`AtkHomePageWelcome`) instead of
   * the recorded `FuseWelcome`, and every selector recorded against the latter —
   * starting with `#clusters-right-nav` — became unresolvable. Losing the
   * destination was the greater harm, and it was the harm actually occurring.
   *
   * The tokens are still stripped rather than replayed: they are the volatile
   * part, they are meaningless by the time a recording is replayed, and dropping
   * them costs nothing since Oracle mints new ones.
   */
  rewriteNavigation(url: string): string | null {
    if (!url) return url;
    if (!/\/(fscm|hcm|crm)UI\/faces\//i.test(url)) return url;
    try {
      const u = new URL(url);
      for (const p of ['_adf.ctrl-state', '_afrLoop', '_adf.no-new-window-redirect']) {
        u.searchParams.delete(p);
      }
      return u.toString();
    } catch {
      // Not parseable as a URL — replay it as recorded rather than dropping the
      // step; assertNavigable() upstream has already vetted the scheme.
      return url;
    }
  }

  recoveryHints(): string[] {
    return [
      // Not "this is Oracle Fusion Cloud" — the prompt heading already says so,
      // from productName. This adds the part the name alone does not imply.
      'It is built on Oracle ADF with some Oracle JET pages.',
      'Oracle list-of-values fields look like dropdowns but are search boxes: their options do ' +
        'not exist in the page until you TYPE into the input. If clicking a dropdown arrow does ' +
        "nothing, use type_into on the field's <input>, then pick the row that appears, or " +
        'commit with Tab.',
    ];
  }

  transactionSurfaces() {
    return {
      title: [
        'h1', '.fndPageTitle', '.af_panelHeader_title-text0', '.AFPanelHeaderTitle',
        '[class*="panelHeader"] span', '.x11n', '.pageTitleText',
      ],
      message: [
        '.af_m_fmt', '.AFNoteWindow', '.af_dialog_body-content',
        '[role="alert"]', '[role="alertdialog"]', '[role="dialog"]',
        '.AFMessageText', '.p_InlineMessage', '.AFDialog', '.AFPopup',
        '[id$="::wd"]', '[id*="dialog"]',
      ],
      // ADF's popup skins, plus the id shapes it generates for message dialogs.
      dismissDialog: [
        '[role="dialog"]', '[role="alertdialog"]',
        '[id*="msgDlg"]', '[id*="::popup-container"]', '[id*="_afrPopup"]',
        '.AFPopup', '.AFDialog', '.AFNoteWindow', '.AFPopupSelector',
      ],
      // "CT21987", "INV_10023", or a bare long run of digits. Anchored, so a
      // date or an amount elsewhere on the form cannot match.
      generatedIdPattern: '^[A-Z]{1,4}[_\\-]?\\d{4,}|^\\d{5,}$',
      // `.AFErrorMessage` / `.x12i` / `.x4y` are the ADF inline-error skins. An
      // id-shaped run of digits inside one of those is part of a validation
      // message, never the new record's number.
      errorExclusion: '[role="alert"][aria-invalid="true"], .AFErrorMessage, .x12i, .x4y',
    };
  }

  async scanForOutputs(page: Page): Promise<Record<string, string>> {
    const texts: string[] = await page
      .evaluate((surfaces: string) => {
        // Painted test inlined, not `eval`ed from a string: page-context eval is
        // blocked by any CSP without `unsafe-eval`. See `engine/locators.ts`.
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
        const out: string[] = [];
        for (const e of document.querySelectorAll(surfaces)) {
          if (!painted(e)) continue;
          const t = ((e as HTMLElement).innerText || '').trim();
          if (t && t.length < 800) out.push(t);
        }
        if (!out.length) {
          const body = (document.body && (document.body as HTMLElement).innerText) || '';
          if (body) out.push(body.slice(0, 6000));
        }
        return out;
      }, OUTPUT_SURFACE_SEL)
      .catch(() => [] as string[]);

    const found: Record<string, string> = {};
    for (const text of texts) {
      for (const p of OUTPUT_PATTERNS) {
        const m = text.match(p.re);
        if (m && m[1] && !found[p.name]) found[p.name] = m[1].trim();
      }
    }
    return found;
  }

  /**
   * A recorded component id addresses an Oracle WRAPPER, not the editable node,
   * and the two shapes differ:
   *   ADF  `<input id="X::content">` inside a wrapper carrying `id="X"`
   *   JET  `<oj-input-text id="X">`  with a plain `<input>` nested inside
   * The bare id resolves to the wrapper, which cannot be filled and whose
   * `inputValue()` throws — the keystrokes land but read back as "".
   */
  // `scope`, not `page`: on a step recorded inside an ADF dialog's iframe this
  // is that frame, and a component id is only unique WITHIN its document.
  componentCandidates(scope: LocatorScope, action: NormalizedAction) {
    // The recorder supplies componentId directly; only fall back to digging it
    // out of a selector string when it is absent.
    let id = action.componentId || null;
    if (!id) {
      const m = String(action.selector || '').match(/\[id="([^"]+)"\]|#([\w:$-]+)/);
      // Only a COLON-delimited id is an ADF component address (`pt1:_FOr1:1:…`).
      // Without this check a plain semantic CSS id like `#clusters-right-nav`
      // was scraped and given ADF treatment, manufacturing two candidates that
      // can never exist (`…::content`, and an <input> inside a nav toggle) and
      // — because patch candidates are tried first — burning the ladder's early
      // slots on them. The recorder's own `componentId` is authoritative and is
      // trusted as-is above; this shape check guards only the scraped fallback.
      const scraped = m ? (m[1] || m[2]) : null;
      id = scraped && scraped.includes(':') ? scraped : null;
    }
    if (!id || id.endsWith('::content')) return [];

    const byId = (v: string) => scope.locator(`[id="${v.replace(/["\\]/g, '\\$&')}"]`);
    return [
      { name: 'componentId::content', locator: byId(`${id}::content`) },
      { name: 'componentId>input', locator: byId(id).locator('input, textarea').first() },
    ];
  }

  /**
   * Extra ways to reach an LOV search icon when the recorded ones miss.
   *
   * The recorder captures these icons as `[title="Search: X"]`, which is how
   * ADF renders them on the main form — steps 16 and 30 of the invoice flow
   * resolve that way every run. Inside the Distribution Combination popup the
   * SAME widget carries the label on `aria-label` instead, with no `title` at
   * all, so the recorded selector matches zero nodes and the step fails on a
   * control that is plainly on screen.
   *
   * Rather than guess which attribute a given release uses, try the others.
   * These run only for a step already identified as a list launcher, and only
   * after the recorded selector has had its turn, so a form where `title` works
   * never reaches them.
   */
  launcherCandidates(scope: LocatorScope, action: NormalizedAction) {
    if (!this.isListLauncher(action)) return [];

    const loc = action.locator || {};
    // The "Search: X" label, from wherever the recording carries it.
    const label = String(loc.title || action.accessibleName || action.description || '').trim();
    if (!/^Search(\s+and\s+Select)?\s*:/i.test(label)) return [];

    const esc = (v: string) => v.replace(/["\\]/g, '\\$&');
    // Every candidate is pinned to THIS field's label. A bare
    // `[id$="::lovIconId"]` would match every LOV icon on the page and click
    // whichever painted first — on this popup, the wrong segment.
    return [
      { name: 'lovIcon[aria-label]', locator: scope.locator(`[aria-label="${esc(label)}" i]`) },
      { name: 'lovIcon[title*]', locator: scope.locator(`[title*="${esc(label)}" i]`) },
      { name: 'lovIcon[role=link][name]', locator: scope.getByRole('link', { name: label }) },
    ];
  }
}
