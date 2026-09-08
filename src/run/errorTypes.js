/**
 * Learned labels for application validation messages.
 *
 * When the application REFUSES to save, it returns sentences, not codes. The
 * engine asks a model to name the KIND of problem behind one ("Duplicate Data",
 * "Missing Data") so failures can be grouped instead of all landing under one
 * heading. An ERP repeats itself, so asking again on every run would be paying
 * repeatedly for an answer that has not changed.
 *
 * Error classifications are managed cooperatively with the platform (contract §1):
 *
 *   before the run   labels arrive in the dispatch payload  → written to a file
 *   during the run   the engine asks a model only about messages not in it
 *   as it learns     'error-type-learned' → POST to the platform callback
 *
 * The engine reads a FILE, not this module — that boundary is deliberate. It is
 * why the engine can be driven by hand with two environment variables and no
 * network at all.
 *
 * Callback delivery is best-effort: reporting resolves asynchronously without
 * failing the active replay.
 */

const fs = require('fs');
const path = require('path');

/**
 * How many labels to hand the engine.
 *
 * Error frequency is heavily lopsided — a handful of messages account for
 * almost every failure — so the most-hit few hundred cover effectively all of
 * them, and a miss on something rarer costs exactly one model call. Bounding it
 * here means a run cannot get slower or heavier as the platform's catalogue
 * grows, however large it gets.
 */
const CACHE_LIMIT = parseInt(process.env.COMMIT_TYPE_CACHE_LIMIT || '500', 10);

/**
 * Write the labels the platform already knows where the engine can read them.
 *
 * @param {string} jobDir      the run's scratch directory — dies with the run
 * @param {Object} [known]     { "<masked message>": "<label>" }, from dispatch
 * @returns {string|null} the file path, or null when there is nothing to hand
 *          over and the engine should keep its own file instead
 */
function writeKnownLabels(jobDir, known) {
  if (!known || typeof known !== 'object') return null;

  const entries = Object.entries(known)
    .filter(([key, label]) => typeof key === 'string' && typeof label === 'string' && key && label)
    .slice(0, CACHE_LIMIT);

  // An empty object is still written, not skipped: the file's PRESENCE is what
  // tells the engine that someone else owns persistence, so it emits what it
  // learns instead of writing a file of its own that nothing would ever read.
  const cachePath = path.join(jobDir, 'error-types.json');
  fs.mkdirSync(jobDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(Object.fromEntries(entries)), 'utf-8');
  return cachePath;
}

/**
 * Hand one newly-learned label to the platform.
 *
 * The engine emits `error-type-learned` the first time it has to work a label
 * out. Fire-and-forget through the callback client, which never rejects.
 *
 * @returns {Promise<string>} a line for the run log — never throws
 */
async function reportLearned(callbacks, { hash, key, label, sample, model }) {
  if (!hash || !key || !label) return '[error-type] skipped — incomplete entry';
  if (!callbacks || !callbacks.enabled) return `[error-type] learned "${label}" (no callback configured)`;

  const ok = await callbacks.postErrorType({ hash, key, label, sample: sample || null, model: model || null });
  return ok
    ? `[error-type] learned "${label}" for: ${key}`
    : `[error-type] could not report "${label}" — the label is lost, the run is not`;
}

/**
 * Count uses of labels that came from the platform.
 *
 * Hit counts are what decide which labels get handed to future runs, so a label
 * that is never counted slowly sinks below CACHE_LIMIT and starts costing model
 * calls again. Reported once at the end of a run rather than per hit: it
 * describes the run, it does not affect it.
 */
async function reportHits(callbacks, hashes) {
  if (!callbacks || !callbacks.enabled) return;
  const unique = [...new Set((hashes || []).filter(Boolean))];
  if (!unique.length) return;
  await callbacks.postErrorType({ hits: unique });
}

module.exports = { CACHE_LIMIT, writeKnownLabels, reportLearned, reportHits };
