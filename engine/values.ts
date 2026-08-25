/**
 * Reading values back off the page, deciding whether a fill was accepted, and
 * keeping recorded credentials out of everything the run writes.
 */

import type { Locator } from '@playwright/test';
import { ABSENCE } from './timeouts';

const READ_TIMEOUT = ABSENCE.read;

/**
 * What an element currently holds.
 *
 * `inputValue()` throws on anything that is not a form control, and a JET/ADF
 * wrapper keeps its value on a nested `<input>` — so reading the wrapper yields
 * nothing and a perfectly good fill reads back as empty.
 */
export async function readValue(el: Locator): Promise<string> {
  // Ask what this element IS before asking what it holds.
  //
  // `inputValue()` does not fail fast on a non-input — it retries until its
  // timeout and only then throws, so reading a <span> or an ADF wrapper cost a
  // full 10s per call. Measured on a copy step: 10,027ms, all of it waiting to
  // be told something one DOM property answers immediately.
  const tag = await el.evaluate((n: any) => String(n.tagName || '').toLowerCase()).catch(() => '');

  // A <select>'s inputValue() is its VALUE attribute — "2", never "Debit
  // memo". Recordings store the LABEL, so comparing against the value made a
  // correct selection read as a miss. Today that silently mis-logs every
  // selectOption and outright fails every assertValue on a <select>.
  if (tag === 'select') {
    const picked = await el
      .evaluate((n: any) => {
        const o = n.selectedOptions && n.selectedOptions[0];
        return { value: n.value || '', text: o ? (o.textContent || '').trim() : '' };
      })
      .catch(() => null);
    if (picked) return picked.text || picked.value;
  }

  if (tag === 'input' || tag === 'textarea') {
    const v = await el.inputValue({ timeout: READ_TIMEOUT }).catch(() => null);
    if (v !== null) return v;
  } else {
    // A JET/ADF wrapper keeps its value on a nested <input>, so reading the
    // wrapper yields nothing and a correct fill reads back as empty.
    const inner = el.locator('input, textarea').first();
    if ((await inner.count().catch(() => 0)) > 0) {
      const v = await inner.inputValue({ timeout: READ_TIMEOUT }).catch(() => null);
      if (v !== null && v !== '') return v;
    }
  }

  return (await el.innerText({ timeout: READ_TIMEOUT }).catch(() => '')) || '';
}

export const norm = (s: unknown) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * An unresolved parameter placeholder, e.g. `${billToName}`.
 *
 * These reach the executable payload when a script parameter was never bound or
 * never given a value. Measured on the last 400 executions carrying one: 243
 * placeholders sat in a step's `value` — the text the engine TYPES — across 116
 * executions, and 39 of those were recorded SUCCESS. So the old engine typed
 * the literal string "${Search0000591660}" into an Oracle search field and
 * called the run green.
 *
 * Cheap to detect and worth its own error: "parameter was never resolved" tells
 * you where to look, where "value mismatch" sends you hunting the wrong problem.
 */
const PLACEHOLDER_RE = /\$\{\s*([^}\s][^}]{0,63})\s*\}|\{\{\s*([^}\s][^}]{0,63})\s*\}\}/g;

export function unresolvedParameters(value: unknown): string[] {
  const s = String(value ?? '');
  // Dotted, spaced and {{…}} forms all reach the field as literal text if the
  // binding layer emits them, which is precisely what this guard exists to stop.
  return [...new Set(Array.from(s.matchAll(PLACEHOLDER_RE), (m) => (m[1] ?? m[2]).trim()))];
}

/**
 * Are these two strings the same date written differently?
 *
 * ADF reformats on commit — "01/01/2026" becomes "1-Jan-2026" — and neither
 * string contains the other, nor is either numeric, so the ordinary comparison
 * rejects a perfectly good fill.
 *
 * Both readings of an ambiguous numeric date are accepted (01/02 as 1 Jan and
 * as 2 Jan), because the recording does not say which locale it was captured
 * under. That is deliberately lenient in one narrow direction: the alternative
 * is failing correct fills on a guess about date order.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function dateParts(raw: string): Array<{ y: number; m: number; d: number }> {
  const s = norm(raw);
  const named = s.match(/(\d{1,2})[\s\-\/]+([a-z]{3,})[\s\-\/]+(\d{4})/);
  if (named) {
    const m = MONTHS.indexOf(named[2].slice(0, 3));
    if (m >= 0) return [{ y: +named[3], m: m + 1, d: +named[1] }];
  }
  const namedFirst = s.match(/([a-z]{3,})[\s\-\/]+(\d{1,2})[,\s\-\/]+(\d{4})/);
  if (namedFirst) {
    const m = MONTHS.indexOf(namedFirst[1].slice(0, 3));
    if (m >= 0) return [{ y: +namedFirst[3], m: m + 1, d: +namedFirst[2] }];
  }
  const numeric = s.match(/^(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{4})$/);
  if (numeric) {
    const a = +numeric[1];
    const b = +numeric[2];
    const y = +numeric[3];
    const out = [];
    if (b >= 1 && b <= 12) out.push({ y, m: b, d: a }); // d/m/y
    if (a >= 1 && a <= 12) out.push({ y, m: a, d: b }); // m/d/y
    return out;
  }
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return [{ y: +iso[1], m: +iso[2], d: +iso[3] }];
  return [];
}

export function datesEquivalent(a: string, b: string): boolean {
  const pa = dateParts(a);
  const pb = dateParts(b);
  if (!pa.length || !pb.length) return false;
  return pa.some((x) => pb.some((y) => x.y === y.y && x.m === y.m && x.d === y.d));
}

const asNumber = (s: string): number | null => {
  if (!/^[-+]?[\d.,\s]+$/.test(s)) return null;
  const n = Number(s.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/**
 * Did the field end up holding what the step intended?
 *
 * Deliberately not an equality test. On a list-of-values the typed text is a
 * SEARCH TERM the widget resolves to something else ("abc " → "ABC Legal
 * Services, Inc."), and ADF reformats plain values on commit ("100" → "100.00").
 *
 * The one thing not tolerated is truncation: `actual.includes(wanted)` is a
 * legitimate resolution, `wanted.includes(actual)` is a partial-page refresh
 * eating keystrokes and leaving "1" where "100" was typed. Only a numeric
 * rewrite is allowed to shrink the value.
 */
export function valueAccepted(actual: string, typed?: string, committed?: string): boolean {
  const a = norm(actual);
  const wanted = [committed, typed].map(norm).filter(Boolean);

  // A recorded fill CAN legitimately be a clear: codegen records `fill` with
  // empty text when an operator empties a defaulted Comments/Description field.
  // Rejecting an empty read-back unconditionally failed those steps — and, being
  // fatal, aborted every step after them.
  const wantsEmpty = (typed !== undefined || committed !== undefined) && !wanted.length;
  if (wantsEmpty) return a === '';

  if (!a) return false;
  if (!wanted.length) return true; // nothing was asked for; anything non-empty is fine

  return wanted.some((w) => {
    if (a === w) return true;
    const na = asNumber(a);
    const nw = asNumber(w);
    if (na !== null && nw !== null) return na === nw;

    // Substring is for LOV RESOLUTION ("abc " -> "ABC Legal Services, Inc.").
    // It must never apply to a numeric expectation: "1000.00".includes("100")
    // is true, which would accept an invoice for ten times the amount. And it
    // must land on a token boundary, or "100" matches "3100".
    if (nw === null && a.includes(w) && onTokenBoundary(a, w)) return true;

    return datesEquivalent(a, w);
  });
}

/** Does `needle` occur in `hay` bounded by non-alphanumerics rather than mid-token? */
function onTokenBoundary(hay: string, needle: string): boolean {
  let from = 0;
  for (;;) {
    const i = hay.indexOf(needle, from);
    if (i < 0) return false;
    const before = i === 0 ? '' : hay[i - 1];
    const after = hay[i + needle.length] ?? '';
    if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return true;
    from = i + 1;
  }
}

/**
 * Exact-enough comparison, with none of the resolution tolerance.
 *
 * `valueAccepted` deliberately accepts a value the widget RESOLVED from what we
 * typed. Two callers must not use it:
 *
 *   - the "field already holds this" pre-check, which runs BEFORE typing, so
 *     nothing has been resolved and any default merely CONTAINING the recorded
 *     value would cause the fill to be skipped;
 *   - `assertValue`, which is the operator's own stated expectation and the last
 *     line of defence for "green means the record is correct".
 *
 * Both were accepting a field holding 1000.00 for a recorded 100.
 */
export function valueMatchesStrict(actual: string, expected?: string): boolean {
  // NO EXPECTATION is not the same as EXPECTING EMPTY. Conflating them meant
  // valueMatchesStrict(field, undefined) returned true for any empty field —
  // so a caller passing an absent committedValue concluded "already correct"
  // and skipped the fill entirely, leaving the field blank and green.
  if (expected == null) return false;
  const a = norm(actual);
  const w = norm(expected);
  if (!w) return a === ''; // an explicit "" asserts the field is empty
  if (a === w) return true;
  const na = asNumber(a);
  const nw = asNumber(w);
  if (na !== null && nw !== null) return na === nw;
  return datesEquivalent(a, w);
}

/**
 * Recorded logins carry the password as a plain `fill` value, and step logs
 * reach stdout, the service log, the SSE stream, the defects table and the PDF.
 * Everything user-visible goes through `redact()`.
 */
/**
 * Field names whose value must never be printed, stored or sent anywhere.
 *
 * The report generator MIRRORS this pattern rather than importing it — it is
 * CommonJS and cannot require a TypeScript module. Keep the two in step. Its
 * own narrower test (`key.includes('password') || key.includes('pwd')`) printed
 * a parameter named `secret`, `credential`, `apiKey`, `otp` or `pin` in
 * cleartext in the customer-facing PDF.
 */
export const SECRET_FIELD_RE =
  /pass(word|wd|phrase)?|pwd|secret|token|pin\b|pincode|credential|otp\b|api[-_ ]?key|auth|private[-_ ]?key/i;

/**
 * Below this length a secret is replaced only where it stands as a WHOLE TOKEN,
 * not as a blind substring.
 *
 * A blind `split/join` over every secret is right on secrecy and unusable in
 * practice at the short end: a PIN field holding `1` rewrote every `1` anywhere
 * in every log line, error message, step description and PDF entry — step
 * numbers, timings, amounts — to `«redacted:1»`. The value is still redacted
 * where it appears as a value; it no longer eats the digits of unrelated text.
 * Steps carrying a short secret are flagged secret exactly as before, so AI
 * recovery still refuses them.
 */
const BLIND_REDACT_MIN_LEN = 4;

/** Local copy — importing locators.ts here would make values.ts depend on the DOM layer. */
const escapeForRegExp = (s: string) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class Redactor {
  private secrets: string[] = [];
  /** Indices of steps whose value is a secret — AI recovery must skip these. */
  private secretSteps = new Set<number>();

  /**
   * Register a secret that was never in the recording.
   *
   * `collect` scans the RECORDED values, which is everything it can see — but a
   * credential resolved from `credentialRef` is decrypted at run time and never
   * appears in the recording at all. Without this the one value most worth
   * masking is the one value the redactor does not know about, and it would
   * reach stdout, the service log, the SSE stream and the PDF.
   *
   * Idempotent, and re-sorts so a longer secret still masks whole.
   */
  addSecret(value: string): void {
    const t = String(value ?? '');
    if (!t || this.secrets.includes(t)) return;
    this.secrets.push(t);
    this.secrets.sort((a, b) => b.length - a.length);
  }

  /** Scan a recording for values belonging to password-ish fields. */
  collect(entries: any[], normalize: (e: any) => any): void {
    this.secrets = [];
    this.secretSteps.clear();
    (entries || []).forEach((entry: any, index: number) => {
      if (!entry || typeof entry !== 'object') return;
      const a = normalize(entry);
      // Everything the recording says about the field, not just two of them.
      // Looking only at selector+description missed a legacy step carrying
      // `{selector:'#pswd', label:'Password'}` — the label names it plainly and
      // was not being read, so the password was printed verbatim to stdout,
      // the service log, the SSE stream and the PDF.
      const loc = a.locator || {};
      const haystack = [
        a.selector, a.description, a.accessibleName,
        loc.label, loc.name, loc.title, loc.placeholder, loc.id, loc.sourceTag,
      ].filter(Boolean).join(' ');
      const isPasswordInput = String(loc.type || loc.sourceTag || '').toLowerCase() === 'password';
      // Schema v1 states it outright rather than leaving it to be inferred from
      // a field name. Honoured IN ADDITION to the heuristics, never instead of
      // them: a v1 recording that forgets the flag must still be caught.
      const declared = a.sensitive === true || !!a.credentialRef;
      if (!declared && !isPasswordInput && !SECRET_FIELD_RE.test(haystack)) return;
      this.secretSteps.add(index);
      for (const v of [a.text, a.committedValue, loc.value]) {
        const t = String(v == null ? '' : v);
        // Every non-empty value, not just those of 3+ characters. A 4-digit PIN
        // survived the old threshold, but a 2-character value did not, and the
        // length of a secret is not a measure of how bad it is to print it.
        // How short values are masked is redact()'s problem, not this one's —
        // see BLIND_REDACT_MIN_LEN.
        if (t.length >= 1) this.secrets.push(t);
      }
    });
    // Longest first, so a password that contains a shorter one still redacts whole.
    this.secrets.sort((a, b) => b.length - a.length);
  }

  /**
   * Does step `index` carry a credential?
   *
   * Used to keep AI recovery away from login steps entirely. Redacting what we
   * LOG is not enough there: recovery sends the target value, the element's
   * outerHTML and a page dump to a third-party API, and no amount of log
   * masking undoes having transmitted it.
   */
  isSecretStep(index: number): boolean {
    return this.secretSteps.has(index);
  }

  redact(message: unknown): string {
    let out = String(message ?? '');
    for (const s of this.secrets) {
      if (s.length >= BLIND_REDACT_MIN_LEN) {
        out = out.split(s).join(`«redacted:${s.length}»`);
      } else {
        // Whole-token only — see BLIND_REDACT_MIN_LEN.
        out = out.replace(
          new RegExp(`(?<![A-Za-z0-9])${escapeForRegExp(s)}(?![A-Za-z0-9])`, 'g'),
          `«redacted:${s.length}»`,
        );
      }
    }
    return out;
  }

  get count(): number {
    return this.secrets.length;
  }
}
