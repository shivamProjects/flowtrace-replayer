/**
 * Recording → NormalizedAction.
 *
 * ARCHITECTURAL BOUNDARY:
 *   External API Ingress: Protocol "2.0" ExecutionRequest (via @flowtrace/contracts)
 *         ↓ (routes / API adapter)
 *   Internal Engine Normalization: parses steps, binds parameters, applies locators
 *
 * THREE legacy file dialects also reach this service and all three keep working:
 *
 *   schema v1  { schemaVersion: 1, actions: [ { action, locator, … } ], steps?: [ { type: 'code', actionIndex, … } ] }
 *              actions is the canonical source of truth for execution & parameter binding.
 *   legacy     { action: "click", locator: { … }, value, committedValue }  ~366 recordings
 *   codegen    { frame, action: { name, selector, text }, startTime }      ~413 recordings
 *
 * Note: Raw files declaring numeric schemaVersion > 1 are rejected because numeric 2
 * represents an unknown future legacy file dialect, whereas Protocol "2.0" is the
 * structured external API contract.
 */

import type { NormalizedAction } from './types';

/**
 * The declared schema of a recording. `null` means the recording was a bare
 * array — legacy — rather than version zero of anything.
 */
export type SchemaVersion = number | null;

/** A recording, unwrapped, with whatever the envelope said about itself. */
export interface ParsedRecording {
  schemaVersion: SchemaVersion;
  entries: any[];
  meta: {
    name?: string;
    description?: string;
    recordedAt?: string;
    sourceUrl?: string;
    patchId?: string;
  };
}

/**
 * Unwrap whatever the actions file holds.
 *
 * Accepts either a schema v1 envelope or a bare array. A bare array is still
 * perfectly valid and means legacy — the ~779 recordings already in the
 * database are all one, and nothing about them is being migrated.
 */
export function parseRecording(raw: unknown): ParsedRecording {
  if (Array.isArray(raw)) {
    return { schemaVersion: null, entries: raw, meta: {} };
  }

  if (raw && typeof raw === 'object') {
    const env = raw as Record<string, any>;

    // An object that is not an envelope is a corrupt file, not a legacy one.
    // Saying which is missing beats "Recording is not an array of steps",
    // which was the message a v1 envelope used to get.
    if (!('actions' in env)) {
      throw new Error(
        'Recording is an object but has no "actions" array. A schema v1 recording is ' +
        '{ schemaVersion: 1, actions: [ … ] }; a legacy recording is a bare array of steps.',
      );
    }
    if (!Array.isArray(env.actions)) {
      throw new Error(`Recording has an "actions" field that is not an array (got ${typeof env.actions})`);
    }

    // Read the version; do NOT infer it. An envelope with no schemaVersion has
    // not made a claim, so it gets legacy semantics — the conservative choice,
    // because legacy semantics are what every existing recording was authored
    // against.
    let schemaVersion: SchemaVersion = null;
    if (env.schemaVersion != null) {
      const v = Number(env.schemaVersion);
      if (!Number.isFinite(v)) {
        throw new Error(`Recording declares a non-numeric schemaVersion: ${JSON.stringify(env.schemaVersion)}`);
      }
      if (v > 2) {
        // Newer than this engine. Replaying it under v1/v2 rules would apply the
        // wrong meaning to verbs it does not know about yet.
        throw new Error(
          `Recording declares schemaVersion ${v}, but this engine understands up to 2. ` +
          `Upgrade the replayer rather than replaying it under older rules.`,
        );
      }
      schemaVersion = v;
    }

    return {
      schemaVersion,
      entries: env.actions,
      meta: {
        name: env.name,
        description: env.description,
        recordedAt: env.recordedAt,
        sourceUrl: env.sourceUrl,
        patchId: env.patchId,
      },
    };
  }

  throw new Error(`Recording is neither an array of steps nor a schema v1 envelope (got ${raw === null ? 'null' : typeof raw})`);
}

/**
 * Pull role / accessible name back out of a Playwright `internal:` selector.
 *
 * A codegen recording gives us one opaque string, but the vendor patches need
 * to answer questions like "is this the Save button?" and "is this an LOV
 * arrow?". Rather than have every patch re-parse the syntax, the answer is
 * lifted onto the action once, here.
 */
function describeSelector(selector?: string): Pick<NormalizedAction, 'role' | 'accessibleName' | 'exact'> {
  if (!selector) return {};

  // Read the LAST role segment of a chain: `… >> internal:role=option[name="X"i]`
  // describes what is actually being acted on, not the container it sits in.
  const segments = String(selector).split(/\s*>>\s*/);
  for (let i = segments.length - 1; i >= 0; i--) {
    const m = segments[i].match(/^internal:role=([\w-]+)(?:\[name="((?:[^"\\]|\\.)*)"([is]?)\])?$/);
    if (m) {
      return {
        role: m[1],
        accessibleName: m[2] ? m[2].replace(/\\(.)/g, '$1') : undefined,
        exact: m[3] === 's',
      };
    }
  }

  // No role segment — a label or plain text locator still carries a usable name.
  for (let i = segments.length - 1; i >= 0; i--) {
    const m = segments[i].match(/^internal:(?:label|text|has-text)="((?:[^"\\]|\\.)*)"([is]?)$/);
    if (m) return { accessibleName: m[1].replace(/\\(.)/g, '$1'), exact: m[2] === 's' };
  }

  return {};
}

/**
 * Resolve the verb, which is the ONE place v1 and legacy genuinely disagree.
 *
 * The disagreement is over `select`, and it is worth spelling out because the
 * old behaviour was inconsistent with itself:
 *
 *   legacy, codegen shape ({action:{name:'select'}})   → rewritten to selectOption
 *   legacy, locator shape ({action:'select'})          → left as `select`, and
 *                                                        dispatched to doClick,
 *                                                        i.e. an LOV ROW PICK
 *
 * So the same word meant a real <select> in one legacy dialect and a row pick in
 * the other, decided by which shape the entry happened to be in. That is the
 * bug, and it cannot simply be corrected: ~366 stored recordings were authored
 * against the row-pick meaning and would start clicking the wrong thing.
 *
 * The resolution is to freeze legacy and fix the future:
 *
 *   LEGACY (schemaVersion === null) — behaviour preserved EXACTLY as above.
 *   V1     (schemaVersion >= 1)     — `select` is not a verb at all. v1 says
 *                                     `selectOption` for a real <select> and
 *                                     `lovSelect` for a row pick, so a v1
 *                                     recording containing `select` is a
 *                                     recorder bug and fails loudly in dispatch
 *                                     rather than being guessed at.
 */
function resolveVerb(name: string, isActionObj: boolean, schemaVersion: SchemaVersion): string {
  if (schemaVersion !== null) return name; // v1: verbs are taken at their word
  // Legacy only, and only in the codegen shape — see above.
  return name === 'select' && isActionObj ? 'selectOption' : name;
}

export function normalizeAction(entry: any, schemaVersion: SchemaVersion = null): NormalizedAction {
  const isActionObj = entry && typeof entry.action === 'object' && entry.action !== null;

  const name = isActionObj
    ? entry.action.name
    : (typeof entry?.action === 'string' ? entry.action : entry?.type ?? '');

  const url = isActionObj
    ? (entry.action.url || (name === 'navigate' ? entry.action.value : undefined))
    : (entry?.url || (name === 'navigate' ? entry?.value : undefined));

  const selector = isActionObj
    ? entry.action.selector
    : (entry?.locator?.selector ?? entry?.selector);

  const text = isActionObj
    ? (entry.action.text ?? entry.action.value ?? (Array.isArray(entry.action.options) ? entry.action.options[0] : undefined))
    : (entry?.value ?? entry?.text);

  const description = entry?.description ?? (isActionObj ? entry.action.description : undefined);

  const outputName = entry?.outputName ?? entry?.output_name
    ?? (isActionObj ? entry.action.outputName : undefined);

  const action: NormalizedAction = {
    name: resolveVerb(name, isActionObj, schemaVersion),
    surfaceId: entry?.surfaceId ?? (isActionObj ? entry.action.surfaceId : undefined),
    schemaVersion,
    url,
    selector,
    text,
    key: isActionObj ? entry.action.key : entry?.key,
    button: isActionObj ? entry.action.button : (entry?.button ?? entry?.locator?.button),
    clickCount: isActionObj ? entry.action.clickCount : (entry?.clickCount ?? entry?.locator?.clickCount),
    description,
    outputName,
    isTransactionNumber: entry?.isTransactionNumber
      ?? (isActionObj ? entry.action.isTransactionNumber : undefined),
    committedValue: entry?.committedValue ?? (isActionObj ? entry.action.committedValue : undefined),
    checked: isActionObj ? entry.action.checked : entry?.checked,
    files: isActionObj ? entry.action.files : entry?.files,
    snapshot: isActionObj ? entry.action.snapshot : entry?.snapshot,
    deltaX: entry?.deltaX,
    deltaY: entry?.deltaY,
    skipInReport: !!entry?.skipInReport,

    // v1 wait duration. Kept RAW, not coerced: `wait` in actions.ts has to be
    // able to tell "absent" from "present but not a number", and coercing here
    // would collapse the second into the first — which is precisely the silent
    // degradation this field exists to end.
    durationMs: entry?.durationMs ?? (isActionObj ? entry.action.durationMs : undefined),

    sensitive: entry?.sensitive ?? (isActionObj ? entry.action.sensitive : undefined),
    credentialRef: entry?.credentialRef ?? (isActionObj ? entry.action.credentialRef : undefined),

    // Carried on the entry in every dialect. v1 writes { url, name } for a step
    // captured outside the top frame; codegen wrote { pageAlias, framePath }.
    frame: entry?.frame,

    ...describeSelector(selector),
  };

  // The recorder's own locator object, kept WHOLE. It carries id, attrSelector,
  // label, title, text, placeholder and componentId — every one of them a
  // fallback the engine can use when the primary selector has drifted, and all
  // of them lost if only `selector` is read off it.
  const loc = entry?.locator ?? entry?.selectors;
  if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
    action.locator = loc;
    action.componentId = loc.componentId;
    // Prefer what the recorder stated outright over what was parsed out of the
    // selector string — it saw the live DOM, the parser only sees a string.
    action.role = loc.role ?? action.role;
    action.accessibleName = loc.name ?? loc.label ?? loc.title ?? action.accessibleName;
    if (typeof loc.exact === 'boolean') action.exact = loc.exact;
  }

  action.optionIndex = entry?.optionIndex;
  // Read from both shapes: the flat recorder form carries it at the top level,
  // the nested one under `action`.
  action.originalValue = entry?.originalValue ?? entry?.action?.originalValue;

  return action;
}

/**
 * Reject a recording that cannot be replayed, with a message that says which
 * problem it is.
 *
 * Four rows in the execution history hold a JSON *string* that was exploded
 * into ~5,500 single-character array elements. That parses fine and is a
 * genuine array, so nothing downstream notices until every "step" fails with an
 * unhelpful error about an empty action name.
 */
/**
 * Steps that target a document the engine cannot route to.
 */
function misroutedSteps(entries: any[], schemaVersion: SchemaVersion = null): string[] {
  const out: string[] = [];
  entries.forEach((e, i) => {
    const f = e?.frame;
    if (!f) return;
    // Legacy codegen recordings with framePath are refused because codegen format lacked resolver semantics
    const framed = schemaVersion === null && Array.isArray(f.framePath) && f.framePath.length > 0;
    const otherPage = f.pageAlias && f.pageAlias !== 'page';
    if (framed) out.push(`step ${i + 1} was recorded inside an iframe (${f.framePath.join(' > ')})`);
    else if (otherPage) out.push(`step ${i + 1} was recorded on a second page (${f.pageAlias})`);
  });
  return out;
}

export function assertReplayable(entries: unknown, schemaVersion: SchemaVersion = null): asserts entries is any[] {
  if (!Array.isArray(entries)) throw new Error('Recording is not an array of steps');
  if (!entries.length) throw new Error('Recording contains no steps');

  const misrouted = misroutedSteps(entries, schemaVersion);
  if (misrouted.length) {
    throw new Error(
      `This recording cannot be replayed faithfully: ${misrouted.length} step(s) target a frame or ` +
      `page the engine does not route to. ${misrouted.slice(0, 3).join('; ')}` +
      `${misrouted.length > 3 ? `; and ${misrouted.length - 3} more` : ''}. ` +
      `Replaying them against the main page would act on the wrong document.`,
    );
  }

  const scalars = entries.filter((e) => e === null || typeof e !== 'object').length;
  if (scalars > 0) {
    throw new Error(
      `Recording is corrupt: ${scalars} of ${entries.length} entries are not step objects` +
      (scalars > entries.length * 0.5
        ? ' — this looks like a JSON string that was stored character by character'
        : ''),
    );
  }
}

/** Human label for logs, results and the PDF. */
export function describeAction(action: NormalizedAction, index: number): string {
  if (action.description) return action.description;
  const label = action.accessibleName || action.selector || action.url || '';
  return `${action.name}${label ? ' ' + String(label).slice(0, 60) : ''} (#${index + 1})`;
}
