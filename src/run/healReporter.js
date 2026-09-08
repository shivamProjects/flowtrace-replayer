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
      return { log: `${tag} skipped — recovery produced no replayable steps`, record: null };
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
      return {
        log: `${tag} not reported — the fix is pinned to a session-specific id that will be dead next run`,
        record: null,
      };
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

module.exports = {
  reportHeal,
  // exported for the checks suite
  reparameterizeValue,
  buildAiSteps,
  stabilizeSelector,
};
