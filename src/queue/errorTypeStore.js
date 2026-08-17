/**
 * The learned labels for Oracle validation messages.
 *
 * The replayer names the kind of problem behind a rejection ("Duplicate Data",
 * "Missing Data") by asking Claude. Oracle repeats itself, so asking again on
 * every run would be paying repeatedly for an answer that has not changed —
 * this table remembers it instead.
 *
 * The spec cannot reach the database (no connection, and the attribution
 * columns are three joins away from anything it knows), so the split is the
 * same one heals and usage already use:
 *
 *   before the run   loadCache()   table → a file the spec reads
 *   during the run   the spec asks Claude only about messages not in that file
 *   as it learns     'error-type-learned' → saveLearned() → table
 *
 * Everything here is best-effort. A missing table, a failed query, a database
 * that is down — each costs a label, never a run. That is deliberate: the
 * feature is a convenience on top of a failure that has already happened.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const TABLES = require('../config/tables');

const TABLE = TABLES.CUS_ORACLE_ERROR_TYPE;

/**
 * How many labels to hand the spec.
 *
 * Not the whole table. Error frequency is heavily lopsided — a handful of
 * messages account for almost every failure — so the most-hit few hundred cover
 * effectively all of them, and a miss on something rarer costs exactly one API
 * call. Bounding it here means the run cannot get slower or heavier as the
 * table grows, however large it gets.
 */
const CACHE_LIMIT = parseInt(process.env.COMMIT_TYPE_CACHE_LIMIT || '500', 10);

/** Set once the table is found missing, so every later run stops re-checking. */
let tableMissing = false;

function isMissingTable(err) {
  return err && (err.code === 'ER_NO_SUCH_TABLE' || /doesn't exist/i.test(err.message || ''));
}

/**
 * Write the known labels where the spec can read them.
 *
 * @param {string} jobDir  report/<id>/_job — dies with the execution
 * @returns {Promise<string|null>} the file path, or null when there is nothing
 *          to hand over (no table yet, empty table, or the query failed)
 */
async function loadCache(jobDir) {
  if (tableMissing) return null;

  try {
    const [rows] = await pool.query(
      `SELECT error_key, error_type
         FROM ${TABLE}
        ORDER BY hit_count DESC
        LIMIT ?`,
      [CACHE_LIMIT]
    );

    const cache = {};
    for (const row of rows) cache[row.error_key] = row.error_type;

    // Written even when empty: the file's presence is what tells the spec the
    // worker owns persistence, so it emits what it learns instead of writing a
    // file of its own that nothing would ever read.
    const cachePath = path.join(jobDir, 'error-types.json');
    fs.mkdirSync(jobDir, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf-8');

    return cachePath;
  } catch (err) {
    if (isMissingTable(err)) {
      tableMissing = true;
      console.log(
        `[Error types] ${TABLE} does not exist — labels will be worked out fresh each run. ` +
        `Create the table to have them remembered.`
      );
    } else {
      console.log(`[Error types] could not load: ${err.message}`);
    }
    return null;
  }
}

/**
 * Store one label the run had to work out.
 *
 * ON DUPLICATE KEY rather than a check-then-insert: two executions run at once
 * by default and can meet the same new message in the same second. The clash is
 * harmless — they agree on the answer — so the second one counts a hit rather
 * than failing on the primary key.
 *
 * @returns {Promise<string>} a line for the execution log
 */
async function saveLearned({ hash, key, label, sample, model, executionId }) {
  const tag = `[Execution ${executionId}][Error type]`;
  if (tableMissing) return `${tag} not stored — ${TABLE} does not exist`;
  if (!hash || !key || !label) return `${tag} skipped — incomplete entry`;

  try {
    await pool.query(
      `INSERT INTO ${TABLE}
         (error_key_hash, error_key, error_type, sample_message, model, hit_count)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE hit_count = hit_count + 1, updated_dt = NOW()`,
      [hash, key, label, sample || null, model || null]
    );
    return `${tag} learned "${label}" for: ${key}`;
  } catch (err) {
    if (isMissingTable(err)) {
      tableMissing = true;
      return `${tag} not stored — ${TABLE} does not exist`;
    }
    return `${tag} could not store: ${err.message}`;
  }
}

/**
 * Count a use of a label that came from the table.
 *
 * hit_count is what decides which labels get handed to future runs, so a label
 * that is never counted slowly sinks below the limit and starts costing API
 * calls again. Fire-and-forget: it describes the run, it does not affect it.
 */
async function countHits(hashes) {
  if (tableMissing || !hashes || !hashes.length) return;
  try {
    await pool.query(
      `UPDATE ${TABLE}
          SET hit_count = hit_count + 1
        WHERE error_key_hash IN (${hashes.map(() => '?').join(',')})`,
      hashes
    );
  } catch (_) {
    // Ranking drifts slightly. Nothing else depends on it.
  }
}

module.exports = { loadCache, saveLearned, countHits, CACHE_LIMIT };
