/**
 * Patch registry.
 *
 * The one place that knows which applications are supported. To add another
 * ERP: write the patch, import it, and put it in `PATCHES` ahead of the
 * fallback. No file under `engine/` changes.
 *
 * Selection order:
 *   1. APP_PATCH=<name>  — explicit override, for a recording whose URL lies
 *      (a reverse proxy, a vanity domain) or for testing a patch in isolation.
 *   2. First patch whose `matches(url)` accepts the recording's opening URL.
 *   3. GenericPatch — replays a plain web app with no vendor knowledge.
 */

import type { AppPatch, NormalizedAction } from '../types';
import { GenericPatch } from './generic';
import { OraclePatch } from './oracle';

const PATCHES: AppPatch[] = [
  new OraclePatch(),
  // new SapPatch(),
  // new WorkdayPatch(),
];

const FALLBACK = new GenericPatch();

export function listPatches(): string[] {
  return PATCHES.map((p) => p.name);
}

/**
 * Pick the patch for this recording.
 *
 * The URL comes from the recording rather than the live page because the
 * decision has to be made before the browser has navigated anywhere — the
 * patch governs how the very first step is executed.
 */
export function selectPatch(actions: NormalizedAction[]): AppPatch {
  const forced = (process.env.APP_PATCH || '').trim();
  if (forced) {
    const hit = PATCHES.find((p) => p.name === forced) || (forced === FALLBACK.name ? FALLBACK : null);
    if (hit) {
      console.log(`[patch] forced by APP_PATCH: ${hit.name}`);
      return hit;
    }
    console.log(`[patch] APP_PATCH="${forced}" is not a known patch (have: ${listPatches().join(', ')}) — auto-detecting`);
  }

  // Scan every step, not just the first: recordings routinely open on a bare
  // hostname that carries none of the markers a patch matches on.
  for (const action of actions) {
    if (!action?.url) continue;
    const hit = PATCHES.find((p) => p.matches(action.url!));
    if (hit) {
      console.log(`[patch] ${hit.name} (matched ${action.url.slice(0, 80)})`);
      return hit;
    }
  }

  console.log(`[patch] no application matched — using ${FALLBACK.name}`);
  return FALLBACK;
}
