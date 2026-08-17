import { Page } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSACTION NUMBER CAPTURE
 *
 * When a script commits something in Oracle — an AP invoice, a supplier, a
 * receipt — the thing worth reporting back is the identifier that transaction
 * ended up with. Oracle has no single place it puts that, and no single way of
 * producing it:
 *
 *   · generated + shown in a popup   "Transaction 1234567 was created" behind an
 *                                    OK button that the very next recorded step
 *                                    clicks away
 *   · generated + rendered on screen  the page header flips to "Edit Supplier:
 *                                    32510", or an id field on the form fills in
 *   · supplied by the operator        an AP invoice number is TYPED during
 *                                    creation; it is still this transaction's
 *                                    number, just not one Oracle invented
 *
 * All three are handled here, in that order of authority. Everything is
 * best-effort: a capture failure must never affect whether a step passed.
 *
 * The hard part is not finding a number, it is refusing the wrong one. A form
 * is full of digits — a Tax Registration Number, a D-U-N-S, an amount, a date,
 * a year — and reporting one of those back as the transaction number is the
 * most convincing kind of wrong answer, because it looks exactly like a right
 * one. Hence `typedOther` (values we entered into non-id fields, which are
 * refused outright) and `isNotAnIdentifier` (shapes that are never an id
 * however they were matched).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface TransactionInfo {
  /** Where the text came from: dialog | title | input | message | provided. */
  source: string;
  /** How that source was located, for debugging a miss. */
  selector: string;
  /** The raw text the number was parsed out of. */
  text: string;
  transactionNumber: string | null;
  /** 'generated' = Oracle assigned it; 'provided' = this script typed it. */
  numberSource: 'generated' | 'provided' | null;
  /** For a provided number, the field label it was typed into. */
  providedByField: string | null;
  capturedAt: number;
  /** The step that prompted the probe. */
  trigger: string;
}

export interface IdContext {
  /**
   * lowercased value typed into an ID field → the field's label and the value
   * AS TYPED.
   *
   * Keyed lowercase because every comparison against page text has to be
   * case-insensitive, but the original casing is carried alongside: an invoice
   * number the operator typed as "Test dev dee12" must be reported back that
   * way, not as "test dev dee12".
   */
  providedIds: Map<string, { label: string; value: string }>;
  /** lowercased values typed into, or chosen for, every OTHER field. */
  typedOther: Set<string>;
}

/**
 * How many trailing steps count as "the end of the transaction".
 *
 * The generated number only exists once the transaction is committed, which is
 * the last thing a script does. Any dialog before that is something else — a
 * validation warning, a picker, a confirm-to-continue — and reading it can only
 * produce a wrong answer. Five rather than three so a trailing screenshot or
 * close step cannot push the real commit out of range.
 */
const CAPTURE_TAIL_STEPS = parseInt(process.env.CAPTURE_TAIL_STEPS || '5', 10);

/**
 * Entities that actually carry an Oracle-assigned identifier. Deliberately
 * excludes things like "Tax Registration Number" or "Taxpayer ID", which are
 * OUR data — matching those would report an input as if it were generated.
 */
const TXN_ENTITY_RE =
  /(?:Supplier|Invoice|Transaction|Document|Receipt|Order|Requisition|Payment|Journal|Voucher|Confirmation|Reference)/i;

/** Buttons that commit a transaction, so the number exists AFTER the click. */
const COMMIT_BUTTON_RE =
  /^(Save|Save and Close|Save and Create Another|Submit|Submit and Close|OK|Create|Apply|Post|Done|Finish|Yes)$/i;

/** Buttons that dismiss a confirmation, so the number is gone AFTER the click. */
const DISMISS_BUTTON_RE = /^(OK|Close|Done|Yes|Continue)$/i;

/**
 * The visible name of the thing a step clicks.
 *
 * The old replayer had `locator.name` handed to it by the recorder. This spec
 * only keeps the compiled Playwright selector, so the name is parsed back out
 * of it — `internal:role=button[name="Submit"i]` and `internal:text="OK"i` are
 * the two shapes the recorder emits for a button. The recorder's own label and
 * the step description are tried after that, because a click recorded by CSS
 * id has a name in neither selector form.
 */
export function clickTargetName(action: {
  selector?: string;
  label?: string;
  description?: string;
}): string {
  const sel = action.selector || '';

  const role = sel.match(/^internal:role=[^\[]+\[name="([^"]+)"[is]?]/);
  if (role) return role[1].trim();

  const text = sel.match(/^internal:text="([^"]+)"[i]?$/);
  if (text) return text[1].trim();

  const label = sel.match(/^internal:label="([^"]+)"[i]?$/);
  if (label) return label[1].trim();

  if (action.label) return action.label.trim();

  // Descriptions read "Click Submit" / "click on Save and Close" — strip the
  // verb so the button-name patterns can match what is left.
  if (action.description) {
    return action.description.replace(/^\s*(?:click(?:ed)?(?:\s+on)?|press(?:ed)?)\s+/i, '').trim();
  }

  return '';
}

/** True when this step commits a transaction, so we probe AFTER it runs. */
export function isCommitTrigger(action: { name?: string; selector?: string; label?: string; description?: string }): boolean {
  if (action.name !== 'click' && action.name !== 'dblclick') return false;
  return COMMIT_BUTTON_RE.test(clickTargetName(action));
}

/**
 * True when this step dismisses a confirmation, so the number it carries has to
 * be read BEFORE the click. Distinct from isCommitTrigger, which fires after.
 */
export function isDismissTrigger(action: { name?: string; selector?: string; label?: string; description?: string }): boolean {
  if (action.name !== 'click' && action.name !== 'dblclick') return false;
  return DISMISS_BUTTON_RE.test(clickTargetName(action));
}

export function inCaptureTail(index: number, total: number): boolean {
  if (!Number.isFinite(total) || total <= 0) return true;
  return index >= total - CAPTURE_TAIL_STEPS;
}

/**
 * Split what this script types into the two groups that mean opposite things
 * for the capture.
 *
 *   · providedIds — values entered into an ID field (Invoice Number, Supplier
 *     Number, …). Often WE supply the number and it then appears at the top of
 *     the form; that is still the transaction number, just a provided one.
 *   · typedOther  — everything else we typed (Tax Registration Number, D-U-N-S,
 *     amounts). These are refused as candidates outright.
 *
 * Only the value this run actually enters counts as a provided id. A recording
 * round-trips `originalValue` / `committedValue` from when it was made, so on a
 * parameterized run those are stale — treating them as ids made one field look
 * like two and would have reported a previous run's number as this one's.
 */
export function buildIdContext(
  steps: Array<{ name?: string; label?: string; text?: string; raw?: any }>
): IdContext {
  const providedIds = new Map<string, { label: string; value: string }>();
  const typedOther = new Set<string>();

  for (const s of steps) {
    // A value CHOSEN from a list is ours just as much as one typed, and the
    // recorder stamps it on the click as `originalValue`. Skipping these was a
    // hole: picking supplier "J J Transport Inc. 32510 92-" on an AP invoice
    // left 32510 looking like an Oracle-assigned number, so a confirmation
    // mentioning the supplier would have been reported as the invoice number.
    // The identifier-shaped tokens inside the row text are refused too — the
    // whole string never appears in a confirmation, but 32510 does.
    if (s.name === 'click' || s.name === 'dblclick') {
      const picked = String((s.raw && s.raw.originalValue) || '').trim();
      if (picked) {
        typedOther.add(picked.toLowerCase());
        for (const token of picked.split(/[\s,]+/)) {
          const t = token.replace(/[^A-Za-z0-9_\-/.]/g, '');
          if (t.length >= 3 && /\d/.test(t)) typedOther.add(t.toLowerCase());
        }
      }
      continue;
    }

    if (s.name !== 'fill' && s.name !== 'type' && s.name !== 'selectOption' && s.name !== 'lovSelect') {
      continue;
    }
    const label = String(s.label || '').trim();

    // Either the label names an entity and an identifier ("Invoice Number",
    // "Supplier Number"), or it is the bare identifier itself — inside an
    // Invoice region Oracle labels the field simply "Number". A label with any
    // OTHER qualifier ("Tax Registration Number", "Taxpayer ID", "D-U-N-S
    // Number") is a different field that merely holds digits.
    const isIdField =
      /^(?:Number|Num|ID|Code|Reference)$/i.test(label) ||
      (TXN_ENTITY_RE.test(label) && /\b(?:Number|Num|ID|Code|Reference)\b|#/i.test(label));

    const typed = String(s.text == null ? '' : s.text).trim();
    const live = typed.toLowerCase();
    if (isIdField && live) providedIds.set(live, { label, value: typed });

    const raw = s.raw || {};
    for (const v of [s.text, raw.originalValue, raw.committedValue]) {
      const t = String(v == null ? '' : v).trim().toLowerCase();
      if (!t || (isIdField && t === live)) continue;
      typedOther.add(t);
    }
  }

  return { providedIds, typedOther };
}

/** Shapes that are never an identifier, however they were matched. */
export function isNotAnIdentifier(v: string): boolean {
  const s = String(v || '').trim();
  if (!s) return true;
  if (!/\d/.test(s)) return true;                                  // must contain a digit
  if (/^(?:19|20)\d{2}$/.test(s)) return true;                     // a year
  if (/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/.test(s)) return true;  // a date
  if (/^\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}$/.test(s)) return true;    // ISO date
  if (/^\d{1,2}:\d{2}/.test(s)) return true;                       // a time
  if (/^[\d,]+[.,]\d+$/.test(s)) return true;                      // an amount
  if (/^0+$/.test(s)) return true;                                 // all zeros
  return false;
}

/**
 * Pull the identifier out of a piece of text.
 *
 * `ctx.typedOther` holds values we entered into NON-id fields; echoing one of
 * those back would be the most convincing kind of wrong answer, so they are
 * refused. Rules are ordered most-specific first — the last one is bare digits
 * and it only fires against text that both names an entity and says something
 * was created, because without that anchor it cannot tell an id from a year, a
 * row count or a total.
 */
export function extractTransactionNumber(text: string, ctx: IdContext | null): string | null {
  if (!text) return null;
  const typedOther = ctx?.typedOther || null;
  const ENTITY = TXN_ENTITY_RE.source;

  const stripFormType = (s: string) =>
    s.replace(
      /^(?:Credit\s+Memo|Debit\s+Memo|Retainage\s+Release|Invoice|Standard|Prepayment|Receipt|Journal|Voucher|Payment|Transaction|Manual|Auto)\s+/i,
      ''
    ).trim();

  const accept = (v: string | undefined): string | null => {
    const s = String(v == null ? '' : v).trim();
    if (!s || isNotAnIdentifier(s)) return null;
    if (typedOther && typedOther.has(s.toLowerCase())) return null;
    return s;
  };

  // 1. Page header after Oracle re-renders: "Edit Supplier: 32510"
  let m = text.match(/(?:Edit|Manage|View)\s+[A-Za-z ]+:\s*(.+?)\s*$/);
  if (m) { const v = accept(stripFormType(m[1])); if (v) return v; }

  // 2. "<Entity> Number: 98765" / "<Entity> Number 98765" / "<Entity> ID: X".
  //    The entity word is required — a bare "Number:" also matches our own
  //    "Tax Registration Number".
  m = text.match(
    new RegExp(ENTITY + '\\s*(?:Number|ID|Reference)?\\s*[:#]?\\s*([A-Za-z0-9][A-Za-z0-9_\\-/.]{2,})', 'i')
  );
  if (m) { const v = accept(m[1]); if (v) return v; }

  // 3. Confirmation phrasing: "Supplier 12345 was created"
  m = text.match(
    new RegExp(
      ENTITY + '\\s+([A-Za-z0-9][A-Za-z0-9_\\-/.]{2,})\\s+(?:was|has been|is)\\s+(?:created|generated|saved|submitted)',
      'i'
    )
  );
  if (m) { const v = accept(m[1]); if (v) return v; }

  // 4. A distinctive alphanumeric code such as INV-00042.
  m = text.match(/\b([A-Z]{2,}[A-Z0-9]*[_\-]?\d{2,}[A-Z0-9_\-]*)\b/);
  if (m) { const v = accept(m[1]); if (v) return v; }

  // 5. Bare digits — only against text that is unambiguously a confirmation.
  const anchored =
    TXN_ENTITY_RE.test(text) &&
    /\b(?:created|generated|assigned|submitted|saved as|number)\b/i.test(text);
  if (anchored) {
    m = text.match(/\b(\d{4,})\b/);
    if (m) { const v = accept(m[1]); if (v) return v; }
  }

  return null;
}

/**
 * Read the confirmation the step is ABOUT TO DISMISS, by walking up from the
 * button itself.
 *
 * Matching on dialog class names does not work here: Oracle Fusion ships a
 * compressed skin, so `.af_m_fmt` / `.AFNoteWindow` never match, and the real
 * dialog is only identifiable by its id — the OK button in an AP invoice save
 * is `d1::msgDlg::cancel`. Anchoring on the element we already know we are
 * clicking sidesteps the naming entirely.
 */
export async function readDismissDialogText(
  page: Page,
  buttonName: string,
  /** Which containers count as a dialog. From the active patch — see
   *  AppPatch.transactionSurfaces().dismissDialog. */
  dismissDialog: string[] = NEUTRAL_SURFACES.dismissDialog,
): Promise<string> {
  if (!buttonName) return '';
  return page
    .evaluate(({ btnName, dlgSelectors }: { btnName: string; dlgSelectors: string[] }) => {
      const DLG = dlgSelectors.join(',');
      const clickable = document.querySelectorAll(
        'button, a, [role="button"], input[type="button"], input[type="submit"]'
      );
      for (const b of Array.from(clickable)) {
        if ((b as HTMLElement).offsetParent === null) continue;
        const label = (b.textContent || (b as HTMLInputElement).value || '').trim();
        if (label !== btnName) continue;
        const dlg = b.closest(DLG);
        if (!dlg) continue;
        const text = ((dlg as HTMLElement).innerText || dlg.textContent || '').trim();
        if (text) return text.slice(0, 800);
      }
      return '';
    }, { btnName: buttonName, dlgSelectors: dismissDialog })
    .catch(() => '');
}

interface Candidate {
  source: string;
  selector: string;
  text: string;
}

/**
 * Which elements on THIS application carry a transaction number, supplied by the
 * active patch. Vendor-specific class names must never be written here: this
 * module is the neutral driver, and a hardcoded ADF skin would be sent looking
 * for `.fndPageTitle` while replaying SAP.
 */
export interface TransactionSurfaces {
  title: string[];
  message: string[];
  /** Dialog containers a `dismiss` step's button may sit inside. */
  dismissDialog: string[];
  /** Source string, not a RegExp — page context cannot receive a RegExp. */
  generatedIdPattern: string;
  errorExclusion: string;
}

/**
 * Neutral fallback for a call made without a patch. Deliberately role/ARIA only:
 * guessing a vendor's skin here would silently reintroduce the coupling this
 * interface exists to remove.
 */
const NEUTRAL_SURFACES: TransactionSurfaces = {
  title: ['h1', 'h2', '[role="heading"]'],
  message: ['[role="alert"]', '[role="alertdialog"]', '[role="dialog"]', '[role="status"]'],
  dismissDialog: ['[role="dialog"]', '[role="alertdialog"]'],
  generatedIdPattern: '^[A-Z]{1,4}[_\\-]?\\d{4,}|^\\d{5,}$',
  errorExclusion: '[role="alert"][aria-invalid="true"]',
};

/** Everything on the current page that could plausibly carry the number. */
async function probePage(page: Page, surfaces: TransactionSurfaces): Promise<Candidate[]> {
  return page
    .evaluate((s0: TransactionSurfaces) => {
      const found: Array<{ source: string; selector: string; text: string }> = [];
      // Playwright's evaluate takes ONE argument, so the surfaces arrive bundled.
      const titleSels = s0.title;
      const msgSels = s0.message;
      // Rebuilt here rather than passed in: a RegExp does not survive the hop
      // into page context.
      const generatedIdRe = new RegExp(s0.generatedIdPattern);
      const errorExclusion = s0.errorExclusion;

      // ── The page header. The application re-renders it as "Edit Supplier:
      //    32510" once the record exists, so a title in create/new form is
      //    worth nothing.
      for (const s of titleSels) {
        const el = document.querySelector(s);
        if (!el) continue;
        const text = (el.textContent || '').trim();
        if (!text) continue;
        if (/^(Sign In|Welcome|Search)/i.test(text)) continue;
        if (/^(Create|New)\s+/i.test(text)) continue;
        const isEditMode = /^(Edit|Manage|View)\s+[A-Za-z ]+:/i.test(text);
        const hasColonAndDigit = text.includes(':') && /\d/.test(text);
        if (isEditMode || hasColonAndDigit) {
          found.push({ source: 'title', selector: s, text: text.substring(0, 500) });
          break;
        }
      }

      // ── An id field on the form that the application filled in for us. The value has
      //    to LOOK assigned; a field we typed into is handled separately, by
      //    the providedIds path, which knows the label it came from.
      const labelKeywordRe =
        /^(Document\s+Number|Transaction\s+Number|Number|Receipt\s+Number|Invoice\s+Number|Supplier\s+Number|Order\s+Number|Reference\s+Number|Reference)$/i;
      for (const lbl of Array.from(document.querySelectorAll('label'))) {
        const labelText = (lbl.textContent || '').trim();
        if (!labelKeywordRe.test(labelText)) continue;

        let input: HTMLInputElement | null = null;
        const forId = lbl.getAttribute('for');
        if (forId) input = document.getElementById(forId) as HTMLInputElement | null;
        if (!input) {
          const wrapper = lbl.closest('div, td, span') || lbl.parentElement;
          if (wrapper) {
            input = wrapper.querySelector('input[type="text"], input:not([type])') as HTMLInputElement | null;
          }
        }
        if (!input) continue;

        const val = (input.value || '').trim();
        if (!val) continue;
        if (!generatedIdRe.test(val)) continue;

        found.push({ source: 'input', selector: `label='${labelText}'`, text: `${labelText}: ${val}` });
      }

      // ── A message / alert surface still on screen.
      for (const s of msgSels) {
        for (const el of Array.from(document.querySelectorAll(s))) {
          if (!el || (el as HTMLElement).offsetParent === null) continue;
          const text = (el.textContent || '').trim();
          if (!text || text.length < 3 || text.length > 800) continue;

          // A create-confirmation is exactly what we are looking for, so let it
          // through the generic prefix filters below.
          const isCreateConfirmation =
            /\b(was|has been|successfully)\s+created\b|\bcreated\s+successfully\b/i.test(text);
          if (!isCreateConfirmation && /^(Sign In|Welcome|Search|Cancel|Close|Help)\b/i.test(text)) continue;
          if (!isCreateConfirmation && /^(Error|Warning|Caution|Notice|Required)/i.test(text)) continue;
          if (/value is required|must enter a value|cannot be empty|invalid value|please enter|please correct|please specify/i.test(text)) continue;
          if (errorExclusion && el.closest(errorExclusion)) continue;

          found.push({ source: 'message', selector: s, text: text.substring(0, 500) });
          break;
        }
      }

      return found.slice(0, 8);
    }, surfaces)
    .catch(() => [] as Candidate[]);
}

/**
 * Probe for the transaction number and return what was found, or null.
 *
 * `presetText` is the dialog we are about to dismiss — the most authoritative
 * source there is, so it is tried before anything scraped off the page behind
 * it. `skipSettle` goes with it: that dialog is already on screen, and waiting
 * would only give it time to be closed by something else.
 *
 * Never throws. Every failure path is logged rather than raised, because a
 * capture that goes wrong must not turn a passing step red.
 */
export async function captureTransactionInfo(
  page: Page,
  reason: string,
  ctx: IdContext | null,
  opts: { skipSettle?: boolean; presetText?: string; surfaces?: TransactionSurfaces } = {}
): Promise<TransactionInfo | null> {
  try {
    // Omitted surfaces fall back to role/ARIA only, NOT to any one vendor's
    // skin: a wrong-vendor selector list finds nothing at best and the wrong
    // element at worst.
    const surfaces = opts.surfaces || NEUTRAL_SURFACES;

    if (!opts.skipSettle) {
      // The application writes the number during a partial-page refresh that lands after
      // the click resolves, so the page needs a moment before it is worth
      // reading. networkidle covers the PPR; the fixed pause covers the render.
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(2_000);
    }

    const preset: Candidate[] = opts.presetText
      ? [{ source: 'dialog', selector: 'dismissed-dialog', text: String(opts.presetText).slice(0, 500) }]
      : [];
    const allSources = preset.concat(await probePage(page, surfaces));

    // Prefer whichever source actually yields a number. A confirmation that
    // only says "the form has been submitted" must not stop us reading the
    // number off the page header or an id field on the form itself.
    let captured: Candidate | null = null;
    let txnNumber: string | null = null;
    for (const c of allSources) {
      const n = extractTransactionNumber(c.text, ctx);
      if (n) { captured = c; txnNumber = n; break; }
    }

    // Keep the best text even when no number parsed — otherwise a dialog we DID
    // read gets reported as "probes all empty" and its wording, the one thing
    // needed to add a rule for it, never reaches the log.
    if (!captured && allSources.length) captured = allSources[0];

    // Nothing on screen yielded a number, but the script may have supplied one
    // itself — for an AP invoice the number is ours, not Oracle's, so it is
    // still this transaction's identifier.
    if (!txnNumber && ctx && ctx.providedIds.size) {
      const entries = [...ctx.providedIds.entries()].filter(([v]) => !isNotAnIdentifier(v));

      // Several fields can share a label — an AP invoice has a header "Number"
      // and a line "Number". If any text on screen names one of them, that is
      // the record's identifier; otherwise take the first, because Oracle forms
      // are filled header-first, and say so plainly in the log.
      const seen = allSources.map((c) => String(c.text || '').toLowerCase()).join(' | ');
      let chosen = entries.find(([v]) => seen.includes(v));
      if (!chosen && entries.length) {
        chosen = entries[0];
        if (entries.length > 1) {
          console.log(
            `[Transaction] ${entries.length} id fields supplied (` +
            entries.map(([, e]) => `${e.label}="${e.value}"`).join(', ') +
            `) — none named on screen, using the first`
          );
        }
      }
      if (chosen) {
        // The value as the operator typed it, not the lowercased lookup key.
        txnNumber = chosen[1].value;
        captured = captured || {
          source: 'provided',
          selector: `field='${chosen[1].label}'`,
          text: `${chosen[1].label}: ${chosen[1].value}`,
        };
      }
    }

    if (!captured || !captured.text) {
      // Log misses too. Silence here is why a log could never distinguish
      // "never triggered" from "triggered and found nothing".
      console.log(`[Transaction] ${reason}: no match — dialog/title/input/message probes all empty`);
      return null;
    }

    const provided = !!(txnNumber && ctx && ctx.providedIds.has(txnNumber.toLowerCase()));
    console.log(
      `[Transaction] ${captured.source} via ${reason}: ${captured.text.substring(0, 120)}` +
      (txnNumber ? ` | number: ${txnNumber} (${provided ? 'provided' : 'generated'})` : ' | no number parsed')
    );

    return {
      source: captured.source,
      selector: captured.selector,
      text: captured.text,
      transactionNumber: txnNumber,
      numberSource: txnNumber ? (provided ? 'provided' : 'generated') : null,
      providedByField: provided ? ctx!.providedIds.get(txnNumber!.toLowerCase())!.label : null,
      capturedAt: Date.now(),
      trigger: reason,
    };
  } catch (err: any) {
    console.log(`[Transaction] ${reason}: failed — ${(err?.message || '').slice(0, 80)}`);
    return null;
  }
}

/**
 * Which of two captures to keep.
 *
 * A later probe that found only text must never displace an earlier one that
 * found an actual number — the confirmation dialog is read first and is usually
 * the only place the number ever appears.
 */
export function bestCapture(
  prev: TransactionInfo | null,
  next: TransactionInfo | null
): TransactionInfo | null {
  if (!next) return prev;
  if (prev && prev.transactionNumber && !next.transactionNumber) return prev;
  return next;
}
