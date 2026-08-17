/**
 * Persist AI step fixes back onto the script.
 *
 * When a recorded step fails and AI recovery works out how to complete it, the
 * steps it actually performed are stored on that step as `ai` inside
 * cus_script.script_json_parameterized. The replayer tries `ai` FIRST on every
 * later run, so a step is only ever paid for once.
 *
 * The recorded step is never overwritten — Oracle pages flip between layouts,
 * and the original selector is often valid again later, so it stays as the
 * fallback behind the stored fix.
 *
 * Only cus_script.script_json_parameterized is written. script_json_parameters
 * is read (to map values back to their placeholders) but never modified, so the
 * parameter list users see never changes behind their backs.
 */

const { pool } = require('../config/database');

/**
 * Mirror of the backend's filter (new_project.controller.js). The execution
 * script drops the recording's browser-launch step when instance login steps
 * are prepended, so the two sides must agree on what counts as one or every
 * index below it is off by one.
 */
function isBrowserLaunchStep(step) {
  if (!step || typeof step !== 'object') return false;
  const code = String(step.code || step.rawCode || '');
  if (code.includes('chromium.launch') || code.replace(/^\s+/, '').startsWith('(async () =>')) return true;
  const action = String(step.action || step.type || '').toLowerCase();
  return action === 'launch' || action === 'browser-launch';
}

function actionOf(step) {
  return String((step && (step.action || step.type)) || '').toLowerCase();
}

function descriptionOf(step) {
  return String((step && step.description) || '').trim().toLowerCase();
}

/** Same step, judged on the two fields substitution never touches. */
function sameStep(a, b) {
  return actionOf(a) === actionOf(b) && descriptionOf(a) === descriptionOf(b);
}

/**
 * The executed script is [...loginSteps, ...businessSteps]. Work out how many
 * steps sit in front of the business ones, and keep a map from a position in
 * that business slice back to its real index in the stored array.
 */
function buildIndexMap(completeLength, parameterizedSteps) {
  const filtered = [];
  const map = [];
  parameterizedSteps.forEach((step, idx) => {
    if (isBrowserLaunchStep(step)) return;
    filtered.push(step);
    map.push(idx);
  });

  const offset = completeLength - filtered.length;
  if (offset < 0) return null;
  return { offset, filtered, map };
}

/**
 * Which step in script_json_parameterized does a replayer step index refer to?
 *
 * Arithmetic first, then confirmed against the step that actually ran. A wrong
 * index silently corrupts the script, so anything ambiguous is dropped rather
 * than guessed at.
 */
function resolveScriptIndex({ replayIndex, executedStep, indexMap }) {
  const { offset, filtered, map } = indexMap;

  // Login steps live in cus_instance_login_steps and are shared by every script
  // on the instance. One script's bad run must not rewrite them.
  if (replayIndex < offset) return { skip: 'step belongs to the instance login, not this script' };

  const pos = replayIndex - offset;
  if (pos >= filtered.length) return { skip: `position ${pos} is past the end of the script` };

  if (sameStep(filtered[pos], executedStep)) return { index: map[pos] };

  // The arithmetic disagreed with the content. Fall back to an exact search,
  // but only accept it when there is exactly one candidate — descriptions like
  // "Click Save" repeat within a script.
  const matches = [];
  filtered.forEach((step, p) => {
    if (sameStep(step, executedStep)) matches.push(map[p]);
  });
  if (matches.length === 1) return { index: matches[0] };

  return {
    skip: matches.length
      ? `"${descriptionOf(executedStep)}" matches ${matches.length} steps — too ambiguous to place`
      : `no step matching "${descriptionOf(executedStep)}" found in the script`,
  };
}

const ID_SELECTOR = /^\[id="([^"]+)"\]/;

/**
 * Oracle regenerates one segment of these ids on every session:
 *
 *   recorded   contact_frag-xtm25gshx-crt_sp_virtual_tableID:1198308245_1
 *   run 2068   contact_frag-2yigqtx29-crt_sp_virtual_tableID:1198308245_1
 *   run 2069   contact_frag-bd24p171y-crt_sp_virtual_tableID:1198308245_0
 *
 * Storing the AI's literal id is WORSE than storing nothing: it is already dead
 * by the next run, and the replayer waits on it before falling back. Execution
 * 2069 lost 90s to exactly that.
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
 * Put the placeholder back into a value the AI typed.
 *
 * The parameter is taken from the ORIGINAL step rather than searched for by
 * value — several parameters share values like "1", and matching on those would
 * bind the fix to the wrong one.
 *
 * A prefix counts as a match: typing "McGrath" filters an autosuggest exactly
 * as "McGrath RentCorp" does, so it should still be stored as ${businessUnit}
 * rather than freezing one customer's name into the script.
 */
function reparameterizeValue(typedValue, originalStep, parameters) {
  if (typeof typedValue !== 'string' || typedValue === '') return { value: typedValue };

  const placeholder = String((originalStep && originalStep.value) || '').match(/^\$\{([^}]+)\}$/);
  if (!placeholder) return { value: typedValue }; // the step was never parameterized

  const name = placeholder[1];
  const param = (parameters || []).find((p) => p && p.name === name);
  const runtime = param
    ? String(param.value != null && String(param.value).trim() !== '' ? param.value : (param.originalValue ?? ''))
    : '';

  if (runtime && (runtime === typedValue || runtime.toLowerCase().startsWith(typedValue.toLowerCase()))) {
    return { value: '${' + name + '}' };
  }

  // Unrelated to the parameter this step is bound to. Storing it literally
  // would silently freeze the data, so flag it instead of hiding it.
  return { value: typedValue, needsReview: true };
}

/**
 * Build the `ai` payload: the steps to replay, plus where they came from.
 *
 * Returns { steps } or { volatile: true } when a step's selector is pinned to a
 * session-specific id we cannot generalise — those must not be stored.
 */
function buildAiSteps({ healSteps, originalStep, parameters, executionId, reason }) {
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
      // does not type — keeps the step's intent readable in the script.
      out.value = originalStep.value;
    }

    if (originalStep?.description) out.description = originalStep.description;
    out.healedAt = healedAt;
    out.executionId = executionId;
    out.reason = reason;
    return out;
  });

  return volatile ? { volatile: true } : { steps };
}

/**
 * Write one fix. Re-reads inside a transaction rather than trusting a copy read
 * at the start of the run: up to five executions run at once, and two on the
 * same script would otherwise overwrite each other's fixes.
 */
async function persistHeal({ scriptId, scriptIndex, aiSteps }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT script_json_parameterized FROM cus_script WHERE script_id = ? FOR UPDATE',
      [scriptId]
    );
    if (!rows.length || !rows[0].script_json_parameterized) {
      await conn.rollback();
      return { written: false, reason: 'script has no script_json_parameterized' };
    }

    const raw = rows[0].script_json_parameterized;
    const steps = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(steps) || scriptIndex >= steps.length) {
      await conn.rollback();
      return { written: false, reason: 'script changed since the run started' };
    }

    steps[scriptIndex] = {
      ...steps[scriptIndex],
      ai: aiSteps.length === 1 ? aiSteps[0] : aiSteps,
    };

    await conn.query(
      'UPDATE cus_script SET script_json_parameterized = ?, updated_dt = NOW() WHERE script_id = ?',
      [JSON.stringify(steps), scriptId]
    );
    await conn.commit();
    return { written: true };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Audit row. The PDF's Script Audit Trail already selects exactly this shape
 * (entity_type 'script_step' + action 'UPDATE_STEP'), so the fix shows up in
 * the report with no reporting changes.
 *
 * Never allowed to fail the heal — the fix is already committed by this point.
 */
async function logHeal({ scriptId, scriptIndex, executionId, reason, stepCount }) {
  try {
    await pool.query(
      `INSERT INTO application_logs (
         user_id, username, method, endpoint, ip_address, location, user_agent,
         action, entity_type, entity_id, status, status_code,
         message, error_message, request_body, response_body,
         metadata, execution_time
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null, 'AI Recovery', 'INTERNAL', '/replay/ai-heal', null, null, null,
        'UPDATE_STEP', 'script_step', scriptId, 'success', 200,
        `Step ${scriptIndex} fixed by AI during execution ${executionId}`,
        null, null, null,
        JSON.stringify({ healedBy: 'ai', scriptId, stepIndex: scriptIndex, executionId, reason, stepCount }),
        0,
      ]
    );
  } catch (err) {
    console.log(`[Heal] audit log failed (fix itself is saved): ${err.message}`);
  }
}

/**
 * Entry point used by the queue worker, called the moment a step is recovered
 * rather than at the end of the run — a stopped or killed run must not lose a
 * fix that has already been proven to work.
 *
 * Returns a short outcome string for the log. Never throws.
 */
async function saveHeal({ heal, context, executionId }) {
  const tag = `[Execution ${executionId}][Heal]`;
  try {
    if (!context || !context.scriptId) return `${tag} skipped — no cus_script row for this execution`;
    if (!context.indexMap) return `${tag} skipped — could not line the script up with what ran`;
    if (!Array.isArray(heal.steps) || !heal.steps.length) return `${tag} skipped — recovery produced no replayable steps`;

    const executedStep = context.executedSteps[heal.index];
    const placed = resolveScriptIndex({
      replayIndex: heal.index,
      executedStep,
      indexMap: context.indexMap,
    });
    if (placed.skip) return `${tag} skipped — ${placed.skip}`;

    const originalStep = context.parameterizedSteps[placed.index];

    const built = buildAiSteps({
      healSteps: heal.steps,
      originalStep,
      parameters: context.parameters,
      executionId,
      reason: heal.reason,
    });
    if (built.volatile) {
      return `${tag} not stored — the fix is pinned to a session-specific id that will be dead next run`;
    }
    const aiSteps = built.steps;

    const result = await persistHeal({
      scriptId: context.scriptId,
      scriptIndex: placed.index,
      aiSteps,
    });
    if (!result.written) return `${tag} skipped — ${result.reason}`;

    await logHeal({
      scriptId: context.scriptId,
      scriptIndex: placed.index,
      executionId,
      reason: heal.reason,
      stepCount: aiSteps.length,
    });

    const review = aiSteps.some((s) => s.needsReview) ? ' (value needs review)' : '';
    const widened = aiSteps.some((s) => s.stabilized) ? ' (id wildcarded)' : '';
    return `${tag} saved to cus_script ${context.scriptId} step ${placed.index}: "${heal.description}"${review}${widened}`;
  } catch (err) {
    // A failed write-back must never be worse than not having the feature.
    return `${tag} failed to save: ${err.message}`;
  }
}

/** Everything saveHeal needs, worked out once when an execution starts. */
function buildHealContext({ scriptId, parameterizedRaw, parametersRaw, executedSteps }) {
  if (!scriptId || !parameterizedRaw) return null;

  let parameterizedSteps;
  try {
    parameterizedSteps = typeof parameterizedRaw === 'string' ? JSON.parse(parameterizedRaw) : parameterizedRaw;
  } catch (_) {
    return null;
  }
  if (!Array.isArray(parameterizedSteps) || !parameterizedSteps.length) return null;

  let parameters = [];
  try {
    const parsed = typeof parametersRaw === 'string' ? JSON.parse(parametersRaw) : parametersRaw;
    if (Array.isArray(parsed)) parameters = parsed;
  } catch (_) { /* parameters are optional */ }

  return {
    scriptId,
    parameterizedSteps,
    parameters,
    executedSteps,
    indexMap: buildIndexMap(executedSteps.length, parameterizedSteps),
  };
}

module.exports = {
  saveHeal,
  buildHealContext,
  // exported for tests
  buildIndexMap,
  resolveScriptIndex,
  reparameterizeValue,
  buildAiSteps,
  stabilizeSelector,
  isBrowserLaunchStep,
};
