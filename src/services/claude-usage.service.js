/**
 * Claude usage logging — one row per Claude API attempt in claude_usage_log.
 *
 * Ported from pg-final/Back/services/claude.service.js so both apps price and
 * log identically against the same table. The pricing map and the "cost is NULL
 * when the model is unknown" rule are that file's decisions, kept deliberately
 * in step — if one side changes a rate, change both.
 *
 * What is NOT ported: that file's sendMessage() gateway. It performs a single
 * request/response, and this service's only caller drives a multi-iteration
 * tool loop through the Anthropic SDK, which the gateway cannot express. So
 * replay reuses the accounting half and keeps its own transport.
 *
 * Rows written here carry feature='ai_recovery' and ref_type='execution'; the
 * pg-final callers use 'parameterize'/'config_impact' with 'recording'/'release'.
 */

const { query } = require('../config/database');

/**
 * USD per 1,000,000 tokens, per model. Mirrors the PRICING map in pg-final.
 *
 * cacheRead / cacheWrite are the 5-minute-TTL rates (0.1x and 1.25x of input).
 * Nothing in replay caches yet, but the API reports those counts and they must
 * be priced correctly the day a prompt starts using them.
 */
const PRICING = {
  'claude-fable-5':    { input: 10, output: 50, cacheRead: 1.0, cacheWrite: 12.5 },
  'claude-opus-5':     { input: 5,  output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-8':   { input: 5,  output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-7':   { input: 5,  output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-6':   { input: 5,  output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-sonnet-5':   { input: 3,  output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-4-6': { input: 3,  output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-4-5': { input: 3,  output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5':  { input: 1,  output: 5,  cacheRead: 0.1, cacheWrite: 1.25 },
};

/** Models seen without a PRICING entry, so the warning is logged once each. */
const warnedModels = new Set();

/**
 * Cost of one call in USD, or null when the model has no price on file.
 * Null rather than 0 — a zero would quietly under-report the month.
 */
function priceUsage(model, usage) {
  const rate = PRICING[model];
  if (!rate) {
    if (!warnedModels.has(model)) {
      warnedModels.add(model);
      console.warn(`[claude] no pricing for model "${model}" — cost will be logged as NULL`);
    }
    return null;
  }
  const u = usage || {};
  const per = (tokens, price) => ((Number(tokens) || 0) / 1e6) * price;
  return (
    per(u.input_tokens, rate.input) +
    per(u.output_tokens, rate.output) +
    per(u.cache_read_input_tokens, rate.cacheRead) +
    per(u.cache_creation_input_tokens, rate.cacheWrite)
  );
}

/**
 * Resolve who a run belongs to, for the attribution columns.
 *
 * The replay child process only knows its execution id — customer, instance and
 * user live three joins away. Returns nulls rather than throwing: a usage row
 * with missing attribution is still worth having, an exception here is not.
 */
async function resolveExecutionContext(executionId) {
  const empty = { customerId: null, instanceId: null, userId: null };
  if (!executionId) return empty;
  try {
    const rows = await query(
      `SELECT aeh.user_id            AS userId,
              cs.customer_id          AS customerId,
              cs.customer_instance_id AS instanceId
         FROM api_execution_history aeh
         LEFT JOIN api_project_item api ON aeh.project_item_id = api.project_item_id
         LEFT JOIN cus_script       cs  ON api.cus_script_id   = cs.script_id
        WHERE aeh.id = ?`,
      [executionId]
    );
    const r = rows[0];
    if (!r) return empty;
    return {
      customerId: r.customerId ?? null,
      instanceId: r.instanceId ?? null,
      userId: r.userId ?? null,
    };
  } catch (err) {
    console.error(`[claude] attribution lookup failed for execution ${executionId}: ${err.message}`);
    return empty;
  }
}

/**
 * Write one usage row. Never throws and never rejects: a logging failure must
 * not take down the run it is only describing.
 *
 * `status` is 'success' (Claude fixed the step), 'failed' (Claude ran but could
 * not fix it) or 'error' (the API call itself failed). pg-final uses only the
 * first and last — replay adds 'failed' because its call has an outcome beyond
 * "did the request work", and comparing heal rates between models is the whole
 * reason for logging this.
 */
async function logUsage(row) {
  try {
    const c = row.context || {};
    await query(
      `INSERT INTO claude_usage_log (
         feature, model, customer_id, instance_id, user_id, ref_type, ref_id,
         input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens,
         cost_usd, duration_ms, status, error
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.feature,
        row.model,
        c.customerId ?? null,
        c.instanceId ?? null,
        c.userId ?? null,
        c.refType ?? null,
        c.refId ?? null,
        row.usage?.input_tokens ?? null,
        row.usage?.output_tokens ?? null,
        row.usage?.cache_read_input_tokens ?? 0,
        row.usage?.cache_creation_input_tokens ?? 0,
        row.costUsd ?? null,
        row.durationMs ?? null,
        row.status,
        row.error ? String(row.error).slice(0, 2000) : null,
      ]
    );
  } catch (err) {
    console.error(`[claude] usage log write failed: ${err.message}`);
  }
}

/**
 * Log one AI-recovery attempt, resolving attribution from the execution id.
 * The single entry point the queue worker calls.
 */
async function logRecoveryUsage({ executionId, model, usage, durationMs, status, error }) {
  const context = await resolveExecutionContext(executionId);
  await logUsage({
    feature: 'ai_recovery',
    model,
    context: { ...context, refType: 'execution', refId: executionId ?? null },
    usage,
    costUsd: priceUsage(model, usage),
    durationMs,
    status,
    error,
  });
}

module.exports = {
  logRecoveryUsage,
  logUsage,
  priceUsage,
  resolveExecutionContext,
  PRICING,
};
