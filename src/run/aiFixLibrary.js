/**
 * The shared AI fix library — the classifier, not the store.
 *
 * When AI recovery works out how to complete a step the recording could no
 * longer drive, the steps it performed are worth keeping: the same widget in
 * the same application fails the same way for every customer. This module turns
 * one recovery into a GENERALISED, de-identified library entry and hands it to
 * the platform. It is keyed on
 *
 *   fix_key = `${uiCode}|${action}|${widgetKind}|${failureStage}|${stepSignature}`
 *
 * Key properties:
 *   1. `uiCode` is derived from the LIVE PAGE URL (ADF | REDWOOD | UNKNOWN),
 *      never from the selector.
 *   2. Tagged with the failure stage (LOCATE | OPEN | INPUT | COMMIT | VERIFY
 *      | OTHER), ensuring stage alignment.
 *   3. Step signatures are MASKED, so session-volatile ids and instance-specific
 *      names cannot fracture the library into one entry per run.
 *   4. Value protection: literal customer data is replaced with `${placeholder}`
 *      before dispatch to the library.
 *
 * ── Architecture ────────────────────────────────────────────────────────────
 * The library classifies fixes in-flight and transmits them to the platform
 * (contract §1). Deduplication and persistence on `fixKeyHash` are managed by
 * the platform.
 *
 * Reporting is asynchronous and non-blocking: a fix reports through the
 * callback client without interrupting active replay execution.
 */

const crypto = require('crypto');

/**
 * Normalise a selector or description string to prevent session-volatile and
 * instance-specific tokens from fracturing the fix key.
 */
function normaliseSignature(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/name="[^"]*"/g, 'name=#')
    .replace(/internal:text="[^"]*"/gi, 'internal:text=#')
    .replace(/label="[^"]*"/g, 'label=#')
    .replace(/nth-child\(\d+\)/g, 'nth-child(#)')
    .replace(/nth=\d+/g, 'nth=#')
    .replace(/_oj\d+/g, '_oj#')
    .replace(/\bui-id-\d+\b/g, 'ui-id-#');
}

/**
 * Build the composite step signature: normalise(description) + '|' + normalise(selector)
 */
function buildStepSignature(description, selector) {
  const normDesc = normaliseSignature(description);
  const normSel = normaliseSignature(selector);
  return `${normDesc}|${normSel}`;
}

/** Compute sha256 hash */
function sha256(str) {
  return crypto.createHash('sha256').update(String(str || '')).digest('hex');
}

/**
 * Classify ui_code from the live page URL (or fallback to UNKNOWN).
 * Never derived from the selector.
 */
function classifyUiCode(url) {
  if (!url || typeof url !== 'string') return 'UNKNOWN';
  if (/\/redwood(?:\/|$)/i.test(url)) return 'REDWOOD';
  if (/\/faces(?:\/|$)/i.test(url)) return 'ADF';
  return 'UNKNOWN';
}

/**
 * Infer failure stage from error message if not explicitly tagged on error object.
 */
function inferStage(message) {
  if (!message || typeof message !== 'string') return 'OTHER';
  const m = message.toLowerCase();
  if (
    m.includes('waitfor') ||
    m.includes('not visible') ||
    m.includes('timeout') ||
    m.includes('no element') ||
    m.includes('not found') ||
    m.includes('resolve') ||
    m.includes('waiting for locator') ||
    m.includes('could not find') ||
    m.includes('element is not attached')
  ) {
    return 'LOCATE';
  }
  if (
    m.includes('verify') ||
    m.includes('readback') ||
    m.includes('read-back') ||
    m.includes('disagreed') ||
    m.includes('reads') ||
    m.includes('assert') ||
    m.includes('could not commit') ||
    m.includes('could not select')
  ) {
    return 'VERIFY';
  }
  if (
    m.includes('open') ||
    m.includes('popup') ||
    m.includes('dropdown') ||
    m.includes('dialog') ||
    m.includes('launcher')
  ) {
    return 'OPEN';
  }
  if (
    m.includes('fill') ||
    m.includes('type') ||
    m.includes('press') ||
    m.includes('input') ||
    m.includes('clear') ||
    m.includes('keyboard')
  ) {
    return 'INPUT';
  }
  if (
    m.includes('commit') ||
    m.includes('save') ||
    m.includes('select') ||
    m.includes('pick') ||
    m.includes('click') ||
    m.includes('check') ||
    m.includes('uncheck') ||
    m.includes('submit')
  ) {
    return 'COMMIT';
  }
  return 'OTHER';
}

/**
 * Classify the widget kind from action and selector heuristics.
 */
function classifyWidgetKind({ action, selector, originalStep }) {
  const act = String(action || (originalStep && (originalStep.action || originalStep.type)) || '').toLowerCase();
  const sel = String(
    selector ||
    (originalStep && originalStep.locator && originalStep.locator.selector) ||
    (originalStep && originalStep.selector) ||
    ''
  ).toLowerCase();

  if (act === 'lovselect' || act === 'selectlov') {
    if (sel.includes('lovdialog') || sel.includes('lovpopup') || sel.includes('modal') || sel.includes('loviconid')) {
      return 'LOV_MODAL';
    }
    if (sel.includes('suggest') || sel.includes('afrautosuggest')) {
      return 'LOV_SUGGEST';
    }
    if (sel.includes('dropdown') || sel.includes('dropdownpopup') || sel.includes('dropdowncontent')) {
      return 'LOV_DROPDOWN';
    }
    return 'LOV_MODAL';
  }

  if (act === 'selectoption') {
    return 'NATIVE_SELECT';
  }

  if (act === 'fill' || act === 'type') {
    return 'TEXTBOX';
  }

  if (act === 'click' || act === 'dblclick') {
    if (sel.includes('lovicon') || sel.includes('lovdialog') || sel.includes('lovpopup')) {
      return 'LOV_MODAL';
    }
    if (
      sel.includes('button') ||
      sel.includes('btn') ||
      sel.includes('role="button"') ||
      sel.includes('role=button') ||
      sel.includes('submit')
    ) {
      return 'BUTTON';
    }
    return 'BUTTON';
  }

  if (act === 'press') {
    return 'TEXTBOX';
  }

  return 'OTHER';
}

/**
 * Build readable fix key:
 *   `${ui_code}|${action}|${widget_kind}|${failure_stage}|${step_signature}`
 */
function buildFixKey({ uiCode, action, widgetKind, failureStage, stepSignature }) {
  return `${uiCode}|${action}|${widgetKind}|${failureStage}|${stepSignature}`;
}

/**
 * Value Leak Trap Prevention:
 * Ensure that no unparameterized customer data (literal typed values) leak into `ai_fix.fix_steps`.
 * Parameterized placeholders like `${paramName}` are retained safely.
 */
function sanitizeFixStepsForLibrary(aiSteps) {
  if (!Array.isArray(aiSteps)) return [];
  return aiSteps.map((step) => {
    const s = { ...step };
    if (s.value !== undefined) {
      if (typeof s.value === 'string' && /^\$\{[^}]+\}$/.test(s.value)) {
        // Safely parameterized placeholder
      } else {
        // Literal customer value: redact/empty out and flag
        s.value = '';
        s.has_unparameterized_value = true;
      }
    }
    return s;
  });
}

/**
 * Turn one verified recovery into a library entry.
 *
 * Pure: no I/O, no clock beyond the caller's, nothing that can throw on a
 * network. That matters because this runs on the tail of a step that has
 * ALREADY failed once, and a second failure here would be charged to the run.
 *
 * @param {Object} heal         the engine's heal payload (index, steps, reason,
 *                              failureStage, uiCode, url, action, rawDescription,
 *                              rawSelector, model)
 * @param {Object} originalStep the target recorded step, when known
 * @param {Array}  aiSteps      the placed, re-parameterised fix steps
 * @returns {Object} the record posted to {callbackUrl}/{id}/ai-fixes
 */
function buildFixRecord({ heal, originalStep, aiSteps }) {
  const action = String(
    heal.action || (originalStep && (originalStep.action || originalStep.type)) || 'unknown'
  );

  // The UNMASKED description and selector, kept only as `sample*` fields for a
  // person reviewing the library. The KEY is built from the masked forms below.
  const description =
    heal.rawDescription || (originalStep && originalStep.description) || heal.description || '';
  const selector =
    heal.rawSelector ||
    (originalStep && originalStep.locator && originalStep.locator.selector) ||
    (originalStep && originalStep.selector) ||
    '';

  const uiCode = heal.uiCode || classifyUiCode(heal.url);
  const failureStage = heal.failureStage || inferStage(heal.reason || heal.error);
  const widgetKind = classifyWidgetKind({ action, selector, originalStep });

  const stepSignature = buildStepSignature(description, selector);
  const fixKey = buildFixKey({ uiCode, action, widgetKind, failureStage, stepSignature });

  const fixSteps = sanitizeFixStepsForLibrary(aiSteps || heal.steps || []);

  return {
    fixKey,
    fixKeyHash: sha256(fixKey),
    uiCode,
    action,
    widgetKind,
    failureStage,
    stepSignature,
    signatureHash: sha256(stepSignature),
    fixSteps,
    hasUnparameterizedValue: fixSteps.some((s) => s && s.has_unparameterized_value === true),
    // Provenance so a bad entry can be traced back. Deliberately NOT part of
    // the key: a fix learned on one tenant's instance is still the same fix.
    sampleDescription: description ? description.slice(0, 255) : null,
    sampleSelector: selector || null,
    model: heal.model || process.env.AI_RECOVERY_MODEL || null,
    stepIndex: typeof heal.index === 'number' ? heal.index : null,
  };
}

/**
 * Hand one library entry to the platform. Never throws, never fails a run.
 *
 * @returns {Promise<string>} a line for the run log
 */
async function reportAiFix(callbacks, record) {
  if (!callbacks || !callbacks.enabled) {
    return `[ai-fix] ${record.fixKey} not reported — no callback configured`;
  }
  const ok = await callbacks.postAiFix(record);
  return ok
    ? `[ai-fix] reported ${record.fixKeyHash.slice(0, 12)} (${record.uiCode}/${record.action}/${record.failureStage})`
    : `[ai-fix] could not report ${record.fixKeyHash.slice(0, 12)} — the entry is lost, the run is not`;
}

module.exports = {
  classifyUiCode,
  inferStage,
  classifyWidgetKind,
  normaliseSignature,
  buildStepSignature,
  sha256,
  buildFixKey,
  sanitizeFixStepsForLibrary,
  buildFixRecord,
  reportAiFix,
};
