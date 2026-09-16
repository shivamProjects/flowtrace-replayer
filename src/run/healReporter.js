/**
 * Report AI step fixes back to the platform.
 *
 * When a recorded step fails and AI recovery works out how to complete it, the
 * steps it actually performed are worth keeping: the next run can replay them
 * instead of paying for recovery again. Two things have to happen before a fix
 * is worth storing, and both of them happen HERE rather than on the platform,
 * because both need the target recorded step:
 *
 *   1. `stabilizeSelector` — an id the application regenerates every session is
 *      already dead by the next run, and the replayer WAITS on it before
 *      falling back, so storing it literally is worse than storing nothing.
 *   2. `reparameterizeValue` — a value the model typed must go back to being a
 *      `${placeholder}`, or one customer's data is frozen into the recording.
 *
 * The replayer reports `{ index, fix }` against the step array it was dispatched,
 * allowing the platform to map the validated fix onto the persistent recording
 * (contract §1: the replayer owns ephemeral execution and reports results back
 * over HTTP).
 *
 * Telemetry delivery is fire-and-forget: fixes report asynchronously without
 * interrupting active replay execution.
 */

const ID_SELECTOR = /^\[id="([^"]+)"\]/;

/**
 * Applications like Oracle regenerate one segment of these ids on every session:
 *
 *   recorded   contact_frag-xtm25gshx-crt_sp_virtual_tableID:1198308245_1
 *   run 2068   contact_frag-2yigqtx29-crt_sp_virtual_tableID:1198308245_1
 *   run 2069   contact_frag-bd24p171y-crt_sp_virtual_tableID:1198308245_0
 *
 * Storing the model's literal id is WORSE than storing nothing: it is already
 * dead by the next run, and the replayer waits on it before falling back.
 * Execution 2069 lost 90s to exactly that.
 *
 * Where the healed id and the recorded id differ in one dash-separated segment,
 * keep the stable head and tail and wildcard the volatile middle — the same
 * `[id^=…][id$=…]` shape the recovery agent uses for its own verification.
 *
 * Returns:
 *   { selector }        rewritten, safe to store
 *   { volatile: true }  differs but cannot be rewritten — refuse to store it
 *   null                nothing id-shaped to reason about; store unchanged
 */
function stabilizeSelector(healSelector, originalSelector) {
  if (typeof healSelector !== 'string' || typeof originalSelector !== 'string') return null;

  const healMatch = healSelector.match(ID_SELECTOR);
  const origMatch = originalSelector.match(ID_SELECTOR);
  if (!healMatch || !origMatch) return null;

  const healId = healMatch[1];
  const origId = origMatch[1];
  if (healId === origId) return null;

  // Split keeping the separators, because the volatile segment is joined with
  // "-" in some ids (contact_frag-xtm25gshx-…) and "_" in others
  // (assetfrag-xtm25gshx_resultTbl_…). Even indices are tokens, odd are joins.
  const healParts = healId.split(/([-_])/);
  const origParts = origId.split(/([-_])/);
  if (healParts.length !== origParts.length || healParts.length < 3) return { volatile: true };

  let d = 0;
  while (d < healParts.length && healParts[d] === origParts[d]) d++;
  if (d === 0) return { volatile: true }; // nothing stable to anchor the prefix on

  // Everything after the volatile segment is taken from the HEAL, not the
  // recording — the agent may also have corrected a row index (…_1 → …_0).
  if (d < healParts.length - 1) {
    const prefix = healParts.slice(0, d).join('');
    const suffix = healParts.slice(d + 1).join('');
    const rest = healSelector.slice(healMatch[0].length); // keep ' >> nth=0'
    return { selector: `[id^="${prefix}"][id$="${suffix}"]${rest}` };
  }

  // The only difference is the very last segment. A number there is a row/column
  // index, not a session id — the rest of the id already matched, so it is safe
  // to store literally. Anything else is unanchorable; refuse it.
  return /^\d+$/.test(healParts[d]) ? null : { volatile: true };
}

/**
 * Put the placeholder back into a value the model typed.
 *
 * The parameter is taken from the ORIGINAL step rather than searched for by
 * value — several parameters share values like "1", and matching on those would
 * bind the fix to the wrong one.
 *
 * A prefix counts as a match: typing "McGrath" filters an autosuggest exactly
 * as "McGrath RentCorp" does, so it should still be stored as ${businessUnit}
 * rather than freezing one customer's name into the recording.
 *
 * @param {Object} parameters  the run's flat `{ name: value }` map, as
 *   dispatched (contract §5), representing resolved runtime parameter values.
 */
function reparameterizeValue(typedValue, originalStep, parameters) {
  if (typeof typedValue !== 'string' || typedValue === '') return { value: typedValue };

  const placeholder = String((originalStep && originalStep.value) || '').match(/^\$\{([^}]+)\}$/);
  if (!placeholder) return { value: typedValue }; // the step was never parameterized

  const name = placeholder[1];
  const supplied = parameters && Object.prototype.hasOwnProperty.call(parameters, name)
    ? parameters[name]
    : undefined;
  const runtime = supplied == null ? '' : String(supplied);

  if (runtime && (runtime === typedValue || runtime.toLowerCase().startsWith(typedValue.toLowerCase()))) {
    return { value: '${' + name + '}' };
  }

  // Unrelated to the parameter this step is bound to. Storing it literally
  // would silently freeze the data, so flag it instead of hiding it.
  return { value: typedValue, needsReview: true };
}

/**
 * Build the fix payload: the steps to replay, plus where they came from.
 *
 * Returns { steps } or { volatile: true } when a step's selector is pinned to a
 * session-specific id that cannot be generalised — those must not be stored.
 */
function buildAiSteps({ healSteps, originalStep, parameters, jobExecutionId, reason }) {
  const healedAt = new Date().toISOString();
  const originalSelector = originalStep && originalStep.locator && originalStep.locator.selector;
  let volatile = false;

  const steps = healSteps.map((step) => {
    const out = { ...step };

    if (out.locator && out.locator.selector) {
      const stable = stabilizeSelector(out.locator.selector, originalSelector);
      if (stable && stable.volatile) {
        volatile = true;
      } else if (stable && stable.selector) {
        out.locator = { ...out.locator, selector: stable.selector };
        out.stabilized = true;
      }
    }

    if (out.value !== undefined) {
      const { value, needsReview } = reparameterizeValue(out.value, originalStep, parameters);
      out.value = value;
      if (needsReview) out.needsReview = true;
    } else if (typeof originalStep?.value === 'string' && /^\$\{[^}]+\}$/.test(originalStep.value)) {
      // A selection click carries its placeholder even though the click itself
      // does not type — keeps the step's intent readable in the recording.
      out.value = originalStep.value;
    }

    if (originalStep?.description) out.description = originalStep.description;
    out.healedAt = healedAt;
    out.jobExecutionId = jobExecutionId;
    out.reason = reason;
    return out;
  });

  return volatile ? { volatile: true } : { steps };
}

/**
 * Report one fix, the moment the engine proves it — not at the end of the run.
 *
 * A stopped or killed run must not lose a fix that has already been verified to
 * work. That was true when the destination was a database and it is still true
 * now that it is an HTTP callback.
 *
 * @returns {Promise<{ log: string, record: Object|null }>} — never throws
 */
async function reportHeal({ heal, dispatchedSteps, parameters, callbacks, jobExecutionId }) {
  const tag = `[heal ${jobExecutionId}]`;
  try {
    if (!Array.isArray(heal.steps) || !heal.steps.length) {
      // DECLINED, not silence. Recovery ran and produced nothing replayable —
      // a real fact about this step that the operator is entitled to see.
      const { log } = await reportHealSkipped({
        index: heal.index,
        category: SKIP_DECLINED,
        reason: 'recovery produced no replayable steps',
        stepLabel: heal.description || null,
        errorClass: heal.failureStage || null,
        callbacks,
        jobExecutionId,
      });
      return { log, record: null };
    }

    // The step the engine was DISPATCHED, at the index the engine reports. No
    // offset arithmetic: platform sent this array, so platform can map the index
    // back onto the recording without the replayer guessing at it.
    const originalStep = Array.isArray(dispatchedSteps) ? dispatchedSteps[heal.index] : null;

    const built = buildAiSteps({
      healSteps: heal.steps,
      originalStep,
      parameters,
      jobExecutionId,
      reason: heal.reason,
    });
    if (built.volatile) {
      // REJECTED, not DECLINED — and the distinction is the whole point of the
      // two categories. A candidate DID exist here and it did work on this run;
      // it is refused because it is pinned to a session-specific id that is
      // already dead by the next run, so storing it is worse than storing
      // nothing (execution 2069 lost 90s to exactly that).
      //
      // `from`/`to` are deliberately NOT populated: the rejected selector is the
      // volatile id itself, and putting it in `heal_to` would hand the UI a dead
      // locator to render beside a live one. The reason says what happened; the
      // selector that must not be reused is not re-published to say it.
      const { log } = await reportHealSkipped({
        index: heal.index,
        category: SKIP_REJECTED,
        reason: 'the fix is pinned to a session-specific id that will be dead next run',
        stepLabel: heal.description || null,
        errorClass: heal.failureStage || null,
        heal: { method: heal.model ? 'ai-recovery' : null, confidence: null },
        callbacks,
        jobExecutionId,
      });
      return { log, record: null };
    }

    const record = {
      index: heal.index,
      // Already redacted by the engine before it reached the event stream.
      stepLabel: heal.description || null,
      errorClass: heal.failureStage || null,
      reason: heal.reason || null,
      fix: { steps: built.steps },
      needsReview: built.steps.some((s) => s.needsReview) || undefined,
      stabilized: built.steps.some((s) => s.stabilized) || undefined,
    };

    const ok = callbacks ? await callbacks.postHeal(record) : false;
    const review = record.needsReview ? ' (value needs review)' : '';
    const widened = record.stabilized ? ' (id wildcarded)' : '';

    return {
      log: ok
        ? `${tag} reported fix for step ${heal.index}: "${heal.description}"${review}${widened}`
        : `${tag} could not report fix for step ${heal.index} — the fix is lost, the run is not`,
      record: built.steps,
    };
  } catch (err) {
    // A failed write-back must never be worse than not having the feature.
    return { log: `${tag} failed to report: ${err.message}`, record: null };
  }
}

/* ── Skipped heals (C4) ───────────────────────────────────────────────────── */

/**
 * The two categories a skipped heal can fall into. They are NOT one event.
 *
 *   DECLINED  No candidate was ever produced. The gate refused before spending
 *             anything: there is no method, no confidence, no before/after.
 *   REJECTED  A candidate existed, passed its own check, and FAILED an
 *             independent re-check. All four heal fields are populatable.
 *
 * Collapsing them would tell a user the same thing about a step nobody looked at
 * and a step where a model proposed a fix that was caught being wrong. Those
 * carry opposite trust signals — the first says "out of scope", the second says
 * "our verification worked", which is the strongest claim this product makes.
 */
const SKIP_DECLINED = 'DECLINED';
const SKIP_REJECTED = 'REJECTED';

/**
 * Report that a heal was deliberately NOT applied.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * Design principle P3: report when healing was SKIPPED, not only when it fired.
 * `run_steps.heal_skipped_reason` has existed since the first migration, whose
 * own comment calls it "the trust artifact" — and nothing has ever been able to
 * write it, because every path that declines a heal composes a precise reason
 * and then discards it into a log line on a deployed worker nobody reads.
 *
 * A skip is NOT a heal and must never be reported as one: `reportHeal` posts
 * an applied fix, this posts the absence of one. They go to different callbacks
 * precisely so the UI cannot confuse them.
 *
 * ── Contract ────────────────────────────────────────────────────────────────
 *
 * Never throws, exactly like `reportHeal` — a failed write-back must never be
 * worse than not having the feature. Returns `{ log, posted }` so the caller can
 * say what happened without inspecting the transport.
 *
 * `reason` is REQUIRED. A skip with no reason is the thing this closes: it
 * reports that we declined without saying why, which is a null column wearing a
 * different hat.
 *
 * @returns {Promise<{ log: string, posted: boolean }>} — never throws
 */
async function reportHealSkipped({
  index,
  category,
  reason,
  stepLabel = null,
  errorClass = null,
  heal = null,
  callbacks,
  jobExecutionId,
}) {
  const tag = `[heal ${jobExecutionId}]`;
  try {
    if (category !== SKIP_DECLINED && category !== SKIP_REJECTED) {
      return { log: `${tag} skip not reported — unknown category "${category}"`, posted: false };
    }
    if (typeof reason !== 'string' || !reason.trim()) {
      return { log: `${tag} skip not reported — no reason given for step ${index}`, posted: false };
    }

    // The four heal fields are populated ONLY on REJECTED, where a candidate
    // genuinely existed. On DECLINED they are null because nothing was
    // attempted — and a null here means "we did not try", which is a different
    // fact from "we tried and it produced nothing". Defaulting them to a
    // placeholder would erase that distinction.
    const rejected = category === SKIP_REJECTED;
    const record = {
      index,
      category,
      reason,
      stepLabel,
      errorClass,
      healMethod: rejected ? heal?.method ?? null : null,
      healConfidence: rejected ? heal?.confidence ?? null : null,
      healFrom: rejected ? heal?.from ?? null : null,
      healTo: rejected ? heal?.to ?? null : null,
    };

    const ok = callbacks ? await callbacks.postHealSkipped(record) : false;
    return {
      log: ok
        ? `${tag} reported ${category} for step ${index}: ${reason}`
        : `${tag} could not report ${category} for step ${index} — the reason is lost, the run is not`,
      posted: ok,
    };
  } catch (err) {
    return { log: `${tag} failed to report skip: ${err.message}`, posted: false };
  }
}

module.exports = {
  SKIP_DECLINED,
  SKIP_REJECTED,
  reportHealSkipped,
  reportHeal,
  // exported for the checks suite
  reparameterizeValue,
  buildAiSteps,
  stabilizeSelector,
};
