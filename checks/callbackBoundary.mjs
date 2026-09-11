/**
 * Callback boundary invariants (TRACE-18).
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 *
 * Every callback defect found in this codebase has had ONE shape: the sender
 * looks correct, the receiver never gets it, and nothing downstream can tell.
 * `CallbackClient._post` resolves `false` rather than rejecting, and its callers
 * push onto a pending list drained with `allSettled` and discard the result. So
 * a sender posting every single callback to a 404 is, at runtime, indis-
 * tinguishable from one that works.
 *
 * That is not a bug to be fixed once. It is a class of bug that must be made
 * impossible to SHIP GREEN. These checks are the guard.
 *
 * ── Why the existing service check could not catch it ───────────────────────
 *
 * checks/service.mjs already asserted the full callback path. It did this:
 *
 *     const runId = 'outputs-1';
 *     … body: { jobExecutionId: runId, … }
 *     assert(post.path === `/internal/runs/${runId}/outputs`)
 *
 * One value was supplied for BOTH identifiers, so the assertion held whether the
 * sender read `runId` or `jobExecutionId`. The fixture supplied the very thing
 * under test. An invariant that cannot fail is not an invariant, and this file
 * separates the two identifiers precisely so it can.
 *
 * ── The two consumers ───────────────────────────────────────────────────────
 *
 * There are two, and they are NOT a migration of one another (ruled by
 * PLAT-opus5-M1, 2026-09-11). The target is a property of the DISPATCH, not of
 * the deployment:
 *
 *   PLATFORM  /api/internal/replay/{jobExecutionId}/{suffix}
 *             five callbacks, plural suffixes, keyed on the dispatcher's own id.
 *             Source: platform-domain ReplayCallbackController (:58-:100) with
 *             ReplayCallbackAuthFilter.CALLBACK_BASE_PATH (:53).
 *
 *   APP       /api/v1/internal/runs/{runId}/{suffix}
 *             six callbacks, SINGULAR suffixes, keyed on `runs.id` and nothing
 *             else. Source: app/openapi/flowtrace-v1.yaml @
 *             feat/WP0-contracts-and-schema — paths :1564-:1724, and the RunId
 *             parameter at :1883-1895, which says in terms: "`runs.id`, and the
 *             ONLY identifier on any internal callback path… the worker MUST
 *             echo it back unchanged… There is no second identifier."
 *
 * The base URL and the id segment VARY INDEPENDENTLY. That is the whole reason
 * mutation 9 exists: a dispatch carrying the app's base with a jobExecutionId —
 * or the platform's base with a runId — is a silent 404 on every callback, and
 * neither a base-only nor an id-only check catches it.
 *
 * ── What these checks assert, and what they deliberately do not ─────────────
 *
 * They assert what the sender CONSTRUCTS. They do not boot a server; that is
 * service.mjs's job, and it runs these too so there is one entry point. Keeping
 * the URL algebra separate means the nine mutations below can be verified in
 * under a second, which is what makes actually running them realistic.
 */

import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const { CallbackClient } = require(join(ROOT, 'src', 'platform', 'callbackClient.js'));

/* ── The invariants, named ─────────────────────────────────────────────────
 *
 * Declared as data rather than inlined into assertions, so that changing one is
 * a deliberate edit to a named constant and shows up in a diff as such — rather
 * than someone "fixing a failing test" by editing a string literal, which is the
 * documented way this class of defect gets re-introduced.
 */

export const TARGETS = {
  platform: {
    label: 'platform',
    base: 'https://platform.example/api/internal/replay',
    /** The id segment is the dispatcher's own free-form job execution id. */
    idField: 'jobExecutionId',
    /** Exactly these, no more and no fewer. Plural. */
    suffixes: ['steps', 'heals', 'ai-fixes', 'error-types', 'heartbeat'],
  },
  app: {
    label: 'app',
    base: 'https://app.example/api/v1/internal/runs',
    /** `runs.id`. Ruled, and the ONLY identifier on this boundary. */
    idField: 'runId',
    /** Singular. The difference from the platform set is not cosmetic. */
    suffixes: ['step', 'heal', 'error', 'outputs', 'heartbeat', 'complete'],
  },
};

/**
 * I1 — the FULL url, never a suffix and never a substring.
 *
 * Substring matching has already produced both errors in this codebase: a false
 * NEGATIVE on `steps` (`/runs/{runId}/steps` is the public read endpoint, not
 * the callback) and a false POSITIVE on `outputs` (two paths contain it). The
 * asymmetry matters — a false negative gets argued down by whoever found it, a
 * false positive gets filed and believed.
 */
export function expectedUrl(target, id, suffix) {
  return `${target.base}/${encodeURIComponent(id)}/${suffix}`;
}

let passed = 0;
let failed = 0;
const failures = [];

export function assert(condition, name, details = '') {
  if (condition) {
    console.log(`pass  ${name}`);
    passed++;
  } else {
    console.error(`FAIL  ${name} — ${details}`);
    failed++;
    failures.push(name);
  }
}

/**
 * The public method for each callback, so the suffix under test is the one the
 * SENDER chooses and never one this file supplied.
 *
 * This mapping is the difference between a real check and a tautology, and I
 * got it wrong on the first pass: the original version called `_url(suffix)`
 * with suffixes read from TARGETS above, which asserted my own table against
 * itself. Mutating `_post('steps' → 'stepz')` left the suite fully green. That
 * is precisely the "the fixture supplied the thing under test" trap this file
 * exists to catch, reproduced here by its author.
 *
 * Driving the public methods instead means a mutation anywhere in the chain —
 * the method's suffix argument, `_post`, or `_url` — moves the observed URL.
 */
const METHOD_FOR = {
  steps: 'postStep',
  heals: 'postHeal',
  'ai-fixes': 'postAiFix',
  'error-types': 'postErrorType',
  outputs: 'postOutputs',
  heartbeat: 'postHeartbeat',
};

/**
 * Build a client the way a dispatch would, invoke each public callback method
 * with its transport stubbed, and return the URL each one actually aimed at.
 *
 * `_post` is left entirely intact — only `fetch` is replaced — so the suffix,
 * the id interpolation and the base-URL normalisation are all still the
 * sender's own code. Nothing about the URL is simulated.
 */
function urlsFor(dispatch, suffixes) {
  const client = new CallbackClient(dispatch, () => {});
  const seen = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    return { ok: true, status: 204, text: async () => '' };
  };
  try {
    for (const s of suffixes) {
      const method = METHOD_FOR[s];
      if (!method || typeof client[method] !== 'function') {
        seen.push(`<no sender method for ${s}>`);
        continue;
      }
      // Bodies are irrelevant here; the URL is what is under test.
      client[method]({});
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  return suffixes.map((s, i) => ({ suffix: s, url: seen[i] ?? '<not posted>' }));
}

export function runBoundaryChecks() {
  /* ── I2. Id provenance — the check the old fixture could not make ────────
   *
   * The two identifiers are given DIFFERENT values. Any assertion that passes
   * under both readings is vacuous, and this is the one that was.
   */
  const RUN_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'; // a uuid, as `runs.id` is
  const JOB_ID = 'job-exec-77'; // free-form, as the dispatcher chooses

  {
    // The platform boundary, as the sender is built for it today.
    const urls = urlsFor(
      {
        jobExecutionId: JOB_ID,
        callbackUrl: TARGETS.platform.base,
        callbackToken: 't',
      },
      TARGETS.platform.suffixes
    );

    for (const { suffix, url } of urls) {
      assert(
        url === expectedUrl(TARGETS.platform, JOB_ID, suffix),
        `boundary/platform/full-url-for-${suffix}`,
        `built ${url}`
      );
    }

    // I3 — the prefix is the ruled one, not whatever the fixture passed. Without
    // this, a full-URL assertion still passes while every callback posts under a
    // wrong prefix, because the fixture supplied the prefix itself.
    assert(
      urls.every((u) => u.url.startsWith(`${TARGETS.platform.base}/`)),
      'boundary/platform/every-url-carries-the-ruled-prefix',
      urls.map((u) => u.url).join(' ')
    );

    // I4 — enumeration. Not "the ones we remembered to check".
    assert(
      JSON.stringify(urls.map((u) => u.suffix).sort()) ===
        JSON.stringify([...TARGETS.platform.suffixes].sort()),
      'boundary/platform/posts-exactly-the-contracted-set'
    );

    // `outputs` is the ONE suffix both targets spell identically, and it is the
    // C1.2 callback — the only one with no platform receiver (grep of
    // ReplayCallbackController returns zero for it), which is exactly why
    // captured values were being lost. It is therefore pinned HERE as well as on
    // the app side.
    //
    // Without this, mutating `outputs` moved nothing: its only other assertion
    // lives on the app boundary, where every check already fails for the id
    // reason, so a second defect hid inside the first. A mutation that moves no
    // check means the suffix is unguarded, not that the mutation is harmless.
    const outputsUrl = urlsFor(
      { jobExecutionId: JOB_ID, callbackUrl: TARGETS.platform.base, callbackToken: 't' },
      ['outputs']
    )[0];
    assert(
      outputsUrl.url === expectedUrl(TARGETS.platform, JOB_ID, 'outputs'),
      'boundary/platform/full-url-for-outputs',
      `built ${outputsUrl.url}`
    );
  }

  {
    /* ── The app boundary. THIS IS THE ONE THAT FAILS TODAY. ────────────────
     *
     * A dispatch aimed at the app, carrying BOTH identifiers. The contract says
     * the path must carry `runId`. The sender has no `runId` field at all — its
     * constructor accepts only `jobExecutionId` and `_url` interpolates that —
     * so every URL below is built from the wrong value.
     *
     * Against the real receiver
     * (flowtrace-app app/src/app/api/v1/internal/runs/[runId]/outputs/route.ts)
     * a run id it cannot find returns a clean 404, deliberately indistinguish-
     * able from a cross-org run. The sender discards that. Result: every
     * captured value lost, suite green. That is the defect this ticket exists
     * to make visible, and this assertion is how it becomes visible.
     */
    const urls = urlsFor(
      {
        runId: RUN_ID,
        jobExecutionId: JOB_ID,
        callbackUrl: TARGETS.app.base,
        callbackToken: 't',
      },
      TARGETS.app.suffixes
    );

    for (const { suffix, url } of urls) {
      assert(
        url === expectedUrl(TARGETS.app, RUN_ID, suffix),
        `boundary/app/id-segment-is-sourced-from-runId-for-${suffix}`,
        `built ${url} — expected the path to carry runId ${RUN_ID}, ` +
          `not jobExecutionId ${JOB_ID}. flowtrace-v1.yaml:1883-1895 rules ` +
          `runs.id the ONLY identifier on an internal callback path.`
      );
    }

    assert(
      urls.every((u) => !u.url.includes(JOB_ID)),
      'boundary/app/no-callback-url-leaks-the-job-execution-id',
      `a worker's internal id must stay internal; built: ${urls.map((u) => u.url).join(' ')}`
    );
  }

  /* ── I-cross. Base and id vary independently. ─────────────────────────────
   *
   * Mutation 9. Asserted as an invariant rather than only as a mutation,
   * because a crossed pair is the single most likely way this boundary breaks
   * once the target becomes configurable per dispatch: someone wires the base
   * through and forgets that the id source travels WITH it.
   */
  {
    const crossed = urlsFor(
      { jobExecutionId: JOB_ID, callbackUrl: TARGETS.app.base, callbackToken: 't' },
      ['outputs']
    )[0];

    // Stated POSITIVELY, as "the id segment is not the job execution id".
    //
    // The first version of this assertion was written negatively — url !==
    // expectedUrl(...) || !startsWith(base) — and mutation 6 exposed it as
    // worthless: breaking the SUFFIX made the URL differ from the expected one,
    // so the check passed, and the suite got GREENER under an injected defect.
    // It was asking "is this URL unusual?" when the invariant is "where did the
    // id come from?". A mutation that raises the pass count is always a bug in
    // the assertion, never a fact about the code.
    const idSegment = crossed.url.slice(TARGETS.app.base.length + 1).split('/')[0];
    assert(
      crossed.url.startsWith(`${TARGETS.app.base}/`) && idSegment !== encodeURIComponent(JOB_ID),
      'boundary/crossed/app-base-with-a-job-execution-id-is-not-a-valid-pairing',
      `built ${crossed.url} — id segment is "${idSegment}", the job execution ` +
        `id. The app base REQUIRES a runId segment; base and id vary ` +
        `independently and a crossed pair 404s on every callback, reporting nothing.`
    );
  }

  return { passed, failed, failures };
}

/* Run standalone when invoked directly; service.mjs imports and runs it too. */
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const r = runBoundaryChecks();
  console.log(`\n${r.passed} passed, ${r.failed} failed`);
  if (r.failed) {
    console.error(`\nFailing invariants:\n  ${r.failures.join('\n  ')}`);
  }
  process.exit(r.failed ? 1 : 0);
}
