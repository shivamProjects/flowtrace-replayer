/**
 * Fixture library — every recorded-step shape we have ever seen, replayed
 * against the REAL Oracle HTML it came from.
 *
 * ── why this exists ─────────────────────────────────────────────────────────
 * A locator bug in this engine is invisible in the worst way: the ladder falls
 * back to something that resolves, the click lands on inert text, and the step
 * is reported as a PASS while nothing happened. Diagnosing those from a live
 * run is slow (a replay is minutes, and the pod is often unreachable) and the
 * temptation is to reason about markup from memory — which produced a confident
 * wrong diagnosis at least once: a fix was written for `<label>` without `for`,
 * when the real Oracle label HAS `for` and behaves differently.
 *
 * So: never diagnose from imagined markup again. Every case here is HTML copied
 * verbatim off the live application, and the assertions state what the recorded
 * step is supposed to do to it.
 *
 * ── how to add a case ───────────────────────────────────────────────────────
 *   1. Copy the element's outerHTML out of devtools into checks/cases/<name>.html
 *      (a fragment is fine — the runner wraps it in a document).
 *   2. Describe the recorded step and its expected outcome in
 *      checks/cases/<name>.cases.json.
 *   3. `npm run test:fixtures`.
 *
 * A case that fails is either a real engine bug or a fixture that no longer
 * matches the application. Both are worth knowing before a live run.
 *
 * ── what it does NOT cover ──────────────────────────────────────────────────
 * Static HTML cannot reproduce ADF's timing: partial-page refreshes, a popup
 * that renders 3s late, a field that is disabled until its parent commits.
 * A green run here means the LOCATORS are right, not that the flow replays.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ported from the client repo, where the replayer was one big
// action-replayer.spec.ts and this imported three functions from it. flowtrace
// split that file into modules, so the imports move — and two of them collapse
// into one:
//
//   normalizeAction   -> engine/normalize.ts, unchanged apart from an optional
//                        schemaVersion argument that defaults to legacy.
//   locateForAction   -> engine/resolve(), which additionally takes the active
//                        patch (the candidate ladder is patch-aware now).
//   unwrapToControl   -> engine/locators.ts unwrapLabel(), now PRIVATE because
//                        resolve() already applies it to whatever it returns.
//                        So there is nothing left to call here: resolve() hands
//                        back the control itself, not the caption wrapping it.
//
// GenericPatch is used rather than OraclePatch so these stay honest DOM checks:
// a fixture that only passes because a vendor patch rescued it is testing the
// patch, not the ladder. The address-purpose cases in particular must pass on
// the generic path — that is the whole point of the sibling-unwrap fix.
import { normalizeAction } from '../engine/normalize';
import { resolve } from '../engine/locators';
import { GenericPatch } from '../engine/patches/generic';

const CASES_DIR = path.join(__dirname, 'cases');

interface ExpectBlock {
  /** "TAG#id" the step must resolve to — the single most useful assertion. */
  resolvesTo?: string;
  /** id → expected checked state after the action. */
  checked?: Record<string, boolean>;
  /** id → expected value after the action. */
  value?: Record<string, string>;
  /** ids that must NOT have changed state. */
  unchanged?: string[];
}

interface Case {
  name: string;
  action: any;
  expect: ExpectBlock;
  /** State to establish before acting (e.g. a box Oracle defaults on). */
  pre?: { check?: string[] };
  /** Set when the CURRENT engine is known to fail this — see the note below. */
  knownFailure?: string;
}

interface CaseFile {
  fixture: string;
  source?: string;
  cases: Case[];
}

/** `:` and `.` are CSS combinators, so an ADF id only works when escaped. */
const byId = (page: Page, id: string) =>
  page.locator(`[id="${id.replace(/["\\]/g, '\\$&')}"]`);

async function describeEl(locator: any): Promise<string> {
  return locator.evaluate((el: any) => `${el.tagName}#${el.id || '(no id)'}`);
}

/**
 * Apply the action the way executeAction does, but without the page-settling,
 * screenshotting and Oracle-error plumbing a live run needs. The parts under
 * test — candidate ladder, disambiguation, label unwrapping, checkbox
 * idempotence — are the real exported functions.
 */
async function applyAction(page: Page, raw: any): Promise<string> {
  const action = normalizeAction(raw);
  // resolve() returns the CONTROL, already unwrapped from any label/caption —
  // so unlike the client version there is no separate unwrap step below.
  const control = await resolve(page, action, new GenericPatch(), { timeout: 5_000 });
  if (!control) throw new Error(`no candidate resolved for: ${action.description || action.name}`);

  if (action.name === 'fill') {
    await control.fill('');
    if (action.text) await control.pressSequentially(String(action.text), { timeout: 5_000 });
    return describeEl(control);
  }

  // click
  const state = await control
    .evaluate((n: any) => {
      const t = String(n.type || '').toLowerCase();
      if (n.tagName !== 'INPUT' || (t !== 'checkbox' && t !== 'radio')) return null;
      return Boolean(n.checked);
    })
    .catch(() => null);

  if (state !== null) {
    if (!state) await control.check({ timeout: 5_000 });
    return describeEl(control);
  }

  await control.click({ timeout: 5_000 });
  return describeEl(control);
}

const caseFiles = fs.existsSync(CASES_DIR)
  ? fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.cases.json'))
  : [];

if (caseFiles.length === 0) {
  test('fixture library is empty', () => {
    console.log(`No *.cases.json under ${CASES_DIR} — nothing to check.`);
  });
}

for (const file of caseFiles) {
  const spec: CaseFile = JSON.parse(fs.readFileSync(path.join(CASES_DIR, file), 'utf8'));
  const html = fs.readFileSync(path.join(CASES_DIR, spec.fixture), 'utf8');

  test.describe(spec.fixture, () => {
    for (const c of spec.cases) {
      test(c.name, async ({ page }) => {
        if (c.knownFailure) test.fail(true, c.knownFailure);

        // Served over a route rather than setContent so the page has a real
        // origin — some ADF markup behaves differently on about:blank.
        await page.route('**/fixture', (r) =>
          r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body>${html}</body></html>` }));
        await page.goto('http://fixture.local/fixture');

        for (const id of c.pre?.check ?? []) {
          await byId(page, id).check();
        }

        const before: Record<string, boolean> = {};
        for (const id of c.expect.unchanged ?? []) {
          before[id] = await byId(page, id).isChecked().catch(() => false);
        }

        const resolved = await applyAction(page, c.action);
        console.log(`  resolved -> ${resolved}`);

        if (c.expect.resolvesTo) expect(resolved).toBe(c.expect.resolvesTo);

        for (const [id, want] of Object.entries(c.expect.checked ?? {})) {
          expect(await byId(page, id).isChecked(), `checked state of ${id}`).toBe(want);
        }
        for (const [id, want] of Object.entries(c.expect.value ?? {})) {
          expect(await byId(page, id).inputValue(), `value of ${id}`).toBe(want);
        }
        for (const id of c.expect.unchanged ?? []) {
          expect(await byId(page, id).isChecked(), `${id} must not have changed`).toBe(before[id]);
        }
      });
    }
  });
}
