/**
 * Replaying a control that MOVES rather than one that ARRIVES.
 *
 * Some applications page a strip of links sideways with a pair of arrows. The
 * arrows are RELATIVE moves: clicking one does not reach a destination, it
 * shifts what is on screen by one page. A recording stores N clicks on the
 * arrow followed by a click on whatever the operator was heading for, and that
 * N is only true for the window the recording was made in — how many entries
 * fit per page is a function of viewport width, and replay rarely runs at the
 * recorder's width.
 *
 * The count is wrong in BOTH directions, and measurably so. In the saved jobs
 * of the Oracle deployment this was written for, one destination sits behind
 * two arrow clicks in three recordings, three in four others, and five in two
 * more — and two of those groups were recorded at the SAME window size. Some
 * recordings overshoot and correct with a click on the opposite arrow.
 *
 * So the count is not replayed at all. This module ignores it and asks the only
 * question that is stable: is the destination reachable yet? If not, move one
 * page and ask again. That removes surplus clicks (overshoot) and adds missing
 * ones (undershoot) with a single mechanism.
 *
 * Nothing here knows what application it is driving. Which steps are arrows,
 * which arrow is the opposite one, and how to read the strip's current contents
 * are all asked of the AppPatch; the default patch says "no such control" and
 * this module then never engages.
 */

import type { Locator, Page } from '@playwright/test';
import type { AppPatch, LogFn, NormalizedAction } from './types';
import { ABSENCE } from './timeouts';
import { TargetNotPresentError } from './errors';

/**
 * What to do with the arrow step that triggered this.
 *
 *   skip     — the destination is reachable; this arrow has nothing left to do
 *   recorded — hand back to the ordinary path and click it as recorded
 *
 * There is no third "failed" verdict: exhaustion throws, because it is a
 * finding about the environment rather than an outcome of this step.
 */
export type RailVerdict = 'skip' | 'recorded';

/**
 * How many pages of the strip to walk before giving up on a direction.
 *
 * 25 is chosen as a number no real strip can exceed rather than as a measured
 * limit: the widest springboard observed carries about a dozen entries, and at
 * a viewport narrow enough to show ONE entry per page that is a dozen pages.
 * 25 leaves better than a 2x margin over the worst case while still bounding
 * the walk to a few seconds of clicking. It is a backstop, not the working
 * termination condition — the arrow disabling itself and the no-change check
 * below are what normally stop the walk, and if this cap is ever the thing that
 * fires, one of those two has a bug.
 */
const MAX_PAGES = 25;

/** Budget for one "is the destination clickable yet" probe. */
const PROBE_MS = 1_500;

/**
 * A plain CSS address for a step, or null when it has none.
 *
 * Recordings carry the destination either as a full selector string or as a
 * bare element id on the locator object; both are usable, anything else is not.
 * A step this cannot address is left entirely alone — see the caller.
 */
function probeSelector(action: NormalizedAction | null | undefined): string | null {
  if (!action) return null;
  if (action.selector && typeof action.selector === 'string') return action.selector;
  const id = (action as any)?.locator?.id;
  // CSS.escape is a DOM API and this runs in Node, so it is normally absent —
  // the manual escape is the real implementation, not the fallback.
  if (id && typeof id === 'string') {
    return `#${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/([^\w-])/g, '\\$1')}`;
  }
  return null;
}

/**
 * The step a run of arrows is heading for.
 *
 * The whole run is walked rather than assuming the very next step is the
 * target, because recordings hold several arrows in a row — and where one
 * overshot and was corrected, the step after the first arrow is another arrow
 * pointing the OTHER way. Taking that as the destination would make the
 * mechanism chase its own scrolling.
 *
 * Returns null at the end of the script, and null for a destination this cannot
 * address, both of which leave the run on the recorded path.
 */
export function railDestination(
  actions: NormalizedAction[],
  from: number,
  patch: AppPatch,
): { action: NormalizedAction; selector: string } | null {
  let j = from;
  while (j < actions.length && patch.isRelativeNavStep(actions[j])) j++;
  if (j >= actions.length) return null;
  const selector = probeSelector(actions[j]);
  return selector ? { action: actions[j], selector } : null;
}

/**
 * Is the destination clickable right now?
 *
 * `trial: true` runs Playwright's full actionability check — attached, visible,
 * stable, enabled, receiving pointer events — and then returns WITHOUT
 * clicking, so asking costs the probe timeout and changes nothing on the page.
 *
 * Deliberately not `.first()`. An ambiguous selector raises a strict-mode
 * violation, which lands in the catch and reads as "not reachable", which sends
 * the caller down the recorded path. Every failure in here has to mean that:
 * this probe is allowed to remove work and to add work, but never to invent a
 * new way for a step to fail.
 */
async function reachable(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).click({ trial: true, timeout: PROBE_MS });
    return true;
  } catch {
    return false;
  }
}

/** The arrow itself: visible copies only, first one. */
function arrowLocator(page: Page, action: NormalizedAction): Locator | null {
  const sel = probeSelector(action);
  if (!sel) return null;
  return page.locator(sel).filter({ visible: true }).first();
}

/** Can this arrow still be pressed? */
async function arrowLive(arrow: Locator): Promise<boolean> {
  if ((await arrow.count().catch(() => 0)) === 0) return false;
  return arrow.isEnabled().catch(() => false);
}

/**
 * Walk one direction until the destination is reachable or the rail runs out.
 * Returns true only when the destination became reachable.
 */
async function walk(
  page: Page,
  patch: AppPatch,
  arrowStep: NormalizedAction,
  selector: string,
  log: LogFn,
): Promise<boolean> {
  const arrow = arrowLocator(page, arrowStep);
  if (!arrow) return false;

  for (let moved = 0; moved < MAX_PAGES; moved++) {
    // TERMINATION 1 — the control is gone or has disabled itself. This is how a
    // well-behaved strip announces it has reached its end, and it is the
    // condition that fires on a healthy page.
    if (!(await arrowLive(arrow))) {
      log(`  [rail] ${arrowStep.selector || 'arrow'} is at the end of its travel after ${moved} page(s)`);
      return false;
    }

    const before = await patch.navStripSignature(page).catch(() => '');
    if (!(await arrow.click({ timeout: ABSENCE.visibleShort }).then(() => true, () => false))) {
      // The arrow was live a moment ago and now will not take a click. That is
      // the end of this direction, not a reason to fail the step.
      log(`  [rail] ${arrowStep.selector || 'arrow'} would not accept a click — stopping here`, 'warn');
      return false;
    }
    await patch.waitForIdle(page);

    if (await reachable(page, selector)) return true;

    // TERMINATION 2 — the arrow is enabled and takes clicks but moves nothing.
    // Without this an application that never disables its arrow (or one whose
    // strip is already fully scrolled) would burn the whole page budget on a
    // control that cannot help. Only trusted when the patch actually produced a
    // signature: an empty one means "I cannot read this strip", and treating
    // that as "nothing changed" would stop the walk on its first move.
    const after = await patch.navStripSignature(page).catch(() => '');
    if (before && after && before === after) {
      log(`  [rail] paging changed nothing on the strip — ${arrowStep.selector || 'arrow'} is a no-op here`, 'warn');
      return false;
    }
  }

  // TERMINATION 3 — the backstop. See MAX_PAGES.
  log(`  [rail] gave up after ${MAX_PAGES} pages without reaching the destination`, 'warn');
  return false;
}

/**
 * Replace a recorded run of arrow clicks with a search for the destination.
 *
 * Throws only for the deliberate verdict in the last paragraph. Every other
 * problem — a destination this cannot address, an ambiguous selector, a probe
 * that times out, an arrow that will not click — resolves to `'recorded'`, so
 * the step is performed exactly as the recording asked and fails, or succeeds,
 * on its own merits.
 *
 * The verdict: when the whole rail has been walked in both directions and the
 * destination is not merely unreachable but ABSENT FROM THE DOM, the step fails
 * with a message saying the element is not present on this instance. That
 * distinction is the point of the exercise. Seven of nineteen scripts in one
 * batch failed on a task link that the pod simply did not have provisioned, and
 * every one of them was reported as an 80-second `locator.waitFor` timeout —
 * which reads as a selector bug and sent people looking for one for days. A
 * strict `count() === 0` after a full scan cannot be a selector that drifted or
 * a page that was still loading; it is a feature that is not there.
 *
 * Note what is NOT the verdict: a destination that exists exactly once but was
 * never actionable. That is a real element in a bad state, so it goes back on
 * the recorded path and is allowed to produce its own, accurate error.
 */
export async function resolveRelativeNav(
  page: Page,
  actions: NormalizedAction[],
  index: number,
  patch: AppPatch,
  log: LogFn,
): Promise<RailVerdict> {
  const dest = railDestination(actions, index, patch);
  if (!dest) return 'recorded';

  const name = dest.action.description || dest.action.accessibleName || dest.selector;

  if (await reachable(page, dest.selector)) {
    log(`  [rail] "${name}" is already reachable — this paging click is surplus at this viewport`);
    return 'skip';
  }

  if (await walk(page, patch, actions[index], dest.selector, log)) {
    log(`  [rail] paged the strip until "${name}" was reachable`);
    return 'skip';
  }

  // The destination may be behind us — a recording that overshot and corrected
  // leaves the strip past the target, and a run that has already been paged by
  // an earlier step starts there. Scanning back is cheap relative to failing a
  // whole script, and it is the only way an overshoot that started outside this
  // run can be undone.
  const back = patch.reverseNavStep(actions[index]);
  if (back) {
    log(`  [rail] end of the rail — scanning back the other way for "${name}"`);
    if (await walk(page, patch, back, dest.selector, log)) {
      log(`  [rail] found "${name}" by paging back`);
      return 'skip';
    }
  }

  const present = await page.locator(dest.selector).count().catch(() => -1);
  if (present === 0) {
    // A TYPED error, not a plain one. The wording below is unchanged — it was
    // tuned against real reports and is pinned by checks/run.mjs — but the
    // category now travels WITH it, so main.ts does not have to re-derive
    // "environment, not selector" from prose it might one day reword.
    const err: any = new TargetNotPresentError(name, {
      scope: dest.selector,
      message:
        `"${name}" is NOT PRESENT ON THIS INSTANCE. The whole navigation strip was ` +
        `paged from end to end and ${dest.selector} matched nothing in the page at any ` +
        `point, so this is not a timeout and not a stale selector — the feature the ` +
        `script needs is not provisioned on this environment, or the signed-in user ` +
        `has no access to it. Recorded paging clicks were ignored deliberately; ` +
        `their count is viewport-dependent and cannot be replayed.`,
    });
    // Kept: 'ABSENT' is a wider vocabulary than FailureStage and is already
    // written into results.json and the heal records. Removing it would change
    // a field the report generator reads.
    err.failureStage = 'ABSENT';
    throw err;
  }

  // Present but never actionable, or unreadable (count threw), or ambiguous.
  // None of those are ours to judge — replay the click as recorded.
  log(`  [rail] "${name}" is in the page but was not reachable from any page of the strip — replaying the recorded click`, 'warn');
  return 'recorded';
}
