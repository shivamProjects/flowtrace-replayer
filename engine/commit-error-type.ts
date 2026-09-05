/**
 * Name the kind of problem behind a rejected commit.
 *
 * When an application refuses a page it hands back sentences, not codes:
 *
 *   "A record with the value add_TES21 already exists. Enter a unique value."
 *   "You must make at least one selection."
 *
 * A person reads either one and knows instantly what sort of problem it is. A
 * report cannot, so every rejection lands under one undifferentiated heading
 * and nothing can be counted or grouped. This names the kind.
 *
 * ── Learned locally, decided by Claude ──────────────────────────────────────
 *
 * Applications repeat themselves. The same missing-field message appears every time an
 * operator skips the same field, and asking the API to name it again on every
 * run is paying repeatedly for an answer that has not changed.
 *
 * So each message is checked against a cache FIRST, and Claude is called only
 * for the ones never seen before. What Claude decides is written back, so a
 * message costs one call in its lifetime and nothing thereafter.
 *
 * The cache is keyed on the message with its variable parts masked — the
 * supplier code, the date, the error number — because those change while the
 * kind of problem does not. That masking is mechanical text substitution, not
 * classification: no rule anywhere says which message means which kind. Claude
 * decides that, once, and the cache remembers.
 *
 * Which is the point: nobody maintains a list of any vendor's phrasings, and a
 * message nobody has seen still gets named correctly the first time it appears.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';

/**
 * Reuses AI_RECOVERY_ENABLED by default: the two features answer to the same
 * question ("may this run call the API?"), and a separate switch nobody knows
 * about is a worse default than one they already set. COMMIT_TYPE_ENABLED
 * overrides it in either direction.
 */
export function isErrorClassificationEnabled(): boolean {
  const own = process.env.COMMIT_TYPE_ENABLED;
  if (own === 'true') return Boolean(process.env.ANTHROPIC_API_KEY);
  if (own === 'false') return false;
  return process.env.AI_RECOVERY_ENABLED === 'true' && Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Haiku by default. Naming the kind of problem behind a sentence is the
 * cheapest thing a model can be asked to do, and it is done on a step that has
 * already failed — a larger model would buy nothing but latency and spend.
 * COMMIT_TYPE_MODEL moves it if a message ever turns out to need more.
 */
const MODEL = process.env.COMMIT_TYPE_MODEL || 'claude-haiku-4-5';

/**
 * `effort` is rejected outright by Haiku 4.5 and Sonnet 4.5 — it is not ignored
 * there, it is a 400 — so it is sent only to models that take it. Getting this
 * wrong turns every classification into an API error, which is silent here
 * because the whole path is best-effort: labels would simply stop appearing.
 */
function supportsEffort(model: string): boolean {
  return !/haiku|sonnet-4-5/i.test(model);
}

/**
 * The label rides in a PDF badge 135pt wide, which is about fourteen characters
 * once "FAILED (…)" is around it. Longer labels are not an error — the report
 * measures the real string and falls back to a generic badge — but they lose the
 * badge, so the model is asked for something that fits. Two words is the shape
 * that works: "Duplicate Data", not "Supplier Duplicate Constraint".
 */
const MAX_LABEL_CHARS = 14;

/** What a mixed set of kinds collapses to. Also Claude's catch-all. */
const GENERAL_LABEL = 'Data Error';

/**
 * A starting vocabulary, deliberately described by MEANING rather than by the
 * words a vendor happens to use — matching on phrasing is the maintenance burden
 * this exists to avoid. Claude is told plainly it may go outside the list.
 */
const STARTING_CATEGORIES = [
  'Duplicate Data — a value that must be unique already exists',
  'Missing Data — a required field was left empty or unselected',
  'Invalid Data — a value is present but malformed, out of range, or not permitted',
  'Setup Missing — a value refers to something not configured in the instance',
  'Access Issue — the user lacks the privilege to do this',
  'System Error — an internal or technical failure, not a problem with the data',
  `${GENERAL_LABEL} — the general label, for anything the others do not cover`,
];

// ═══════════════════════════════════════════════════════════════════════════════
// THE CACHE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Where the known labels come from.
 *
 * The worker writes this file before it spawns the run, from
 * cus_oracle_error_type. This process cannot reach the database — the same
 * reason heals and usage are emitted rather than written — so the table arrives
 * as a file and what is learned goes back the same way, as an event.
 *
 * The path falls back to the project root so the spec can still be run directly
 * with JOB_ACTIONS_PATH and keep a cache of its own across those runs.
 */
const CACHE_PATH =
  process.env.COMMIT_TYPE_CACHE_PATH ||
  path.resolve(__dirname, '..', '.commit-error-types.json');

/** True when the worker supplied the cache, and therefore owns persisting it. */
const WORKER_OWNS_CACHE = Boolean(process.env.COMMIT_TYPE_CACHE_PATH);

type Cache = Record<string, string>;

/**
 * Learned within this run.
 *
 * Two things need it. The obvious one: a second failure with the same message
 * later in the same run must not pay for a second call. The less obvious one:
 * the file is a snapshot taken before the run started, so without this the run
 * has nowhere to put what it just learned until the worker writes it.
 */
const learnedThisRun: Cache = {};

/**
 * Folded into every cache key.
 *
 * The cache is keyed on the MASKED message, so the masking rules and the key
 * are one contract: change how a message is masked and yesterday's keys no
 * longer describe today's messages, yet they still match — a stale row is
 * served as if it were an answer to a question nobody asked any more. The same
 * applies to the vocabulary: retire a label and every cached row still carrying
 * it keeps handing it out.
 *
 * Versioning the key retires those rows instead of quietly trusting them. Old
 * entries are never read again and cost one API call each to relearn, which is
 * the correct price for a rule change.
 *
 * BUMP THIS whenever maskMessage() or STARTING_CATEGORIES changes.
 */
const KEY_VERSION = 'v2';

/**
 * Stands in for an apostrophe that is part of a word while the quoted-value
 * rule runs. U+0001 is a control character: it cannot appear in an application
 * error message, so it can never collide with real content.
 */
const APOSTROPHE = '\u0001';

/**
 * The lookup key: the message with everything run-specific taken out.
 *
 * "Supplier: A record with the value add_TES21 already exists."
 * "Supplier: A record with the value add_TES99 already exists."
 *          ↓ both become ↓
 * "a record with the value # already exists."
 *
 * The field name goes too — whether it is Supplier or Business Relationship
 * that is duplicated does not change that the problem is a duplicate.
 *
 * Nothing here decides what a message MEANS. It only decides which messages are
 * the same message, so one answer can serve all of them.
 */
function cacheKey(message: string): string {
  return `${KEY_VERSION}:${maskMessage(message)}`;
}

/**
 * The masking itself, without the version prefix.
 *
 * Split out from cacheKey so the checks can exercise the masking on its own,
 * and so the version lives in exactly one place.
 */
function maskMessage(message: string): string {
  return String(message)
    .toLowerCase()
    // "Supplier: …" — a short leading label followed by a colon.
    .replace(/^[^:]{1,60}:\s*/, '')
    // Contractions first, and this ordering is load-bearing.
    //
    // The quoted-value rule below treats an apostrophe as a quote delimiter. In
    // a sentence with two contractions — "doesn't match the supplier's record" —
    // the apostrophe in "doesn't" pairs with the one in "supplier's", and
    // everything between them is masked away as if it were a quoted value. The
    // key that comes out is missing the words that say what the problem was, so
    // two unrelated messages can collapse onto the same key and be served each
    // other's label.
    //
    // An apostrophe BETWEEN two letters is part of a word, never a quote, so it
    // is parked under a sentinel that no message contains and restored after the
    // quote rule has run.
    .replace(/(\p{L})['’](\p{L})/gu, `$1${APOSTROPHE}$2`)
    // Quoted values.
    .replace(/["'][^"']*["']/g, '#')
    .replace(new RegExp(APOSTROPHE, 'g'), "'")
    // Any word carrying a digit: add_TES21, 01-jan-2026, fnd-9999, 2000217.
    .replace(/\S*\d\S*/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

function readCache(): Cache {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // Missing or unreadable — an empty cache costs an API call, never a failure.
    return {};
  }
}

/**
 * Persist locally — only when running WITHOUT the worker.
 *
 * Under the worker the table is the store and this is a snapshot of it, so
 * writing here would put the answer somewhere nobody reads. Standalone runs
 * have no worker and no database, so the file is all they have.
 *
 * Re-read inside the write rather than trusting the copy taken at lookup time:
 * two executions run at once by default, and a plain overwrite would drop
 * whatever the other one learned. Written to a temp file and renamed, so a run
 * killed mid-write cannot leave a half-written file behind for the next one.
 */
function writeCache(learned: Cache): void {
  if (WORKER_OWNS_CACHE) return;
  try {
    const merged = { ...readCache(), ...learned };
    const temp = `${CACHE_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(merged, null, 2), 'utf-8');
    fs.renameSync(temp, CACHE_PATH);
  } catch (err: any) {
    // A cache that cannot be written just means the next run pays for the call.
    console.log(`[commit type] could not write cache: ${err?.message || err}`);
  }
}

/** The table's primary key — the masked message, hashed so length never matters. */
export function keyHash(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE CALL
// ═══════════════════════════════════════════════════════════════════════════════

export interface CommitErrorType {
  /** Two words naming the kind of problem, e.g. "Duplicate Data". */
  label: string;
  /** True when the messages are different kinds and the label was generalised. */
  mixed: boolean;
  /** How the answer was reached — for the log, and so usage is only logged when billed. */
  source: 'cache' | 'api' | 'mixed-sources';
  model: string;
  durationMs: number;
  /** Present only when the API was actually called. */
  usage?: { input_tokens: number; output_tokens: number };
  /**
   * What this run had to ask about, on its way to cus_oracle_error_type.
   * Empty when everything came from the cache — which is the common case, and
   * the whole point.
   */
  learned: Array<{ hash: string; key: string; label: string; sample: string }>;
}

const SCHEMA = {
  type: 'object',
  properties: {
    labels: {
      type: 'array',
      description:
        'One label per message given, in the same order. Two words each, ' +
        `Title Case, at most ${MAX_LABEL_CHARS} characters.`,
      items: { type: 'string' },
    },
  },
  required: ['labels'],
  additionalProperties: false,
} as const;

/** Ask Claude to name each message. Returns null on any failure. */
async function askClaude(
  messages: string[],
  appName: string
): Promise<{ labels: string[]; usage?: { input_tokens: number; output_tokens: number } } | null> {
  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 512,
      // Naming a category from a sentence is recognition, not reasoning, and
      // this sits in front of a step that has already failed — the run should
      // not wait on deliberation it does not need.
      output_config: {
        ...(supportsEffort(MODEL) ? { effort: 'low' as const } : {}),
        format: jsonSchemaOutputFormat(SCHEMA),
      },
      system:
        `You label ${appName} validation failures for a test report.\n\n` +
        `For each message ${appName} showed when it refused to save a page, name the ` +
        'KIND of problem in two words, so that failures of the same kind can be ' +
        'grouped and counted across many runs.\n\n' +
        'These categories cover the common cases:\n' +
        STARTING_CATEGORIES.map((c) => `  - ${c}`).join('\n') +
        '\n\nThey are a starting vocabulary, not a fixed list. Applications surface ' +
        'messages these do not cover, and their wording changes between releases. ' +
        'When none of them genuinely fits, coin a short label of your own in the ' +
        'same style rather than forcing the message into the nearest category.\n\n' +
        'Rules:\n' +
        '- Name the kind of problem, never the specific values. "Duplicate Data", ' +
        'not "add_TES21 already exists".\n' +
        `- Title Case, at most ${MAX_LABEL_CHARS} characters.\n` +
        '- Return exactly one label per message, in the order given.',
      messages: [
        {
          role: 'user',
          content:
            `Name the kind of problem behind each of these ${appName} messages:\n\n` +
            messages.map((m, i) => `${i + 1}. ${m}`).join('\n'),
        },
      ],
    });

    const labels = response.parsed_output?.labels;
    if (!Array.isArray(labels) || labels.length !== messages.length) return null;

    const clean = labels.map((l) => (typeof l === 'string' ? l.trim() : ''));
    if (clean.some((l) => !l)) return null;

    return {
      labels: clean,
      usage: response.usage
        ? {
            input_tokens: response.usage.input_tokens ?? 0,
            output_tokens: response.usage.output_tokens ?? 0,
          }
        : undefined,
    };
  } catch (err: any) {
    console.log(`[commit type] API call failed (${err?.message || err})`);
    return null;
  }
}

/**
 * Name the kind of problem behind one rejection.
 *
 * Cache first, Claude only for what the cache does not know.
 *
 * @param messages one entry per message Oracle listed, ideally "Field: text"
 * @returns the label, or null when nothing could be named
 */
export async function classifyCommitErrors(
  messages: string[],
  /** Named in the prompt so the model knows which application's wording it is
   *  labelling. Comes from the active patch, so this file carries no vendor
   *  identity of its own. */
  appName = 'this application',
): Promise<CommitErrorType | null> {
  const usable = messages.map((m) => (m || '').trim()).filter(Boolean);
  if (!usable.length) return null;

  const startedAt = Date.now();
  const keys = usable.map(cacheKey);
  // The run's own answers sit in front of the snapshot: anything learned a few
  // steps ago is already correct and must not be asked about again.
  const cache = { ...readCache(), ...learnedThisRun };

  const labels: (string | null)[] = keys.map((k) => cache[k] || null);
  const unknownIndexes = labels
    .map((label, index) => (label ? -1 : index))
    .filter((index) => index >= 0);

  let usage: CommitErrorType['usage'];
  let calledApi = false;
  const learned: CommitErrorType['learned'] = [];

  if (unknownIndexes.length) {
    if (!isErrorClassificationEnabled()) {
      // Nothing known and no way to find out — better no label than a guess.
      if (labels.every((l) => !l)) return null;
    } else {
      calledApi = true;
      console.log(
        `[commit type] ${usable.length - unknownIndexes.length}/${usable.length} known — ` +
        `asking ${MODEL} about ${unknownIndexes.length}`
      );
      const answer = await askClaude(unknownIndexes.map((i) => usable[i]), appName);
      if (answer) {
        const toFile: Cache = {};
        answer.labels.forEach((label, n) => {
          const index = unknownIndexes[n];
          labels[index] = label;
          learnedThisRun[keys[index]] = label;
          toFile[keys[index]] = label;
          learned.push({
            hash: keyHash(keys[index]),
            key: keys[index],
            label,
            // One real message kept beside the masked key, so a person
            // reviewing the table can see what it was actually derived from.
            sample: usable[index],
          });
        });
        writeCache(toFile);
        usage = answer.usage;
      }
    }
  } else {
    console.log(`[commit type] all ${usable.length} message(s) already known — no API call`);
  }

  const known = labels.filter((l): l is string => Boolean(l));
  if (!known.length) return null;

  // Combining is arithmetic, not judgement: every message agreeing means that
  // is the kind; disagreeing means no single kind describes the page.
  const distinct = [...new Set(known)];
  const label = distinct.length === 1 ? distinct[0] : GENERAL_LABEL;

  return {
    label,
    mixed: distinct.length > 1,
    source: calledApi ? (known.length > unknownIndexes.length ? 'mixed-sources' : 'api') : 'cache',
    model: MODEL,
    durationMs: Date.now() - startedAt,
    ...(usage ? { usage } : {}),
    learned,
  };
}
