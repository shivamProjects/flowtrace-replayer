/**
 * checks/timeouts.mjs — PLAT-106 Unit & Invariant Suite for Replayer Timeout Integrity
 *
 * Verifies:
 * 1. Human duration parsing: '90s' -> 90_000ms, '2m' -> 120_000ms, '90000' -> 90_000ms, '500ms' -> 500ms.
 * 2. Malformed duration strings are rejected loudly with descriptive errors.
 * 3. Harmonized recovery configuration: REPLAY_RECOVERY_STEP_MS takes precedence over REPLAY_RECOVERY_MS.
 * 4. Backward compatibility: Fallback from REPLAY_RECOVERY_STEP_MS to legacy REPLAY_RECOVERY_MS.
 * 5. Unrecognized REPLAY_RECOVERY_* environment variables trigger loud warnings.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ts = require('typescript');

function loadTimeoutsModule() {
  const tsPath = join(HERE, '..', 'engine', 'timeouts.ts');
  const source = readFileSync(tsPath, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;

  const m = { exports: {} };
  const fn = new Function('require', 'exports', 'module', 'process', '__dirname', js);
  fn(require, m.exports, m, process, join(HERE, '..', 'engine'));
  return m.exports;
}

const { parseDuration, num, validateRecoveryEnv, describeTimeouts } = loadTimeoutsModule();

const failures = [];
let passed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`pass  ${name}`);
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
    console.log(`FAIL  ${name}\n        ${e.message}`);
  }
}

function eq(actual, expected, what) {
  if (actual !== expected) {
    throw new Error(`${what}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

function throws(fn, expectedPattern, what) {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
    if (expectedPattern && !expectedPattern.test(err.message)) {
      throw new Error(`${what}: threw unexpected message "${err.message}" (expected pattern ${expectedPattern})`);
    }
  }
  if (!threw) {
    throw new Error(`${what}: expected function to throw, but it succeeded`);
  }
}

console.log('=== PLAT-106: Replayer Timeout Integrity Checks ===\n');

// 1. Human duration unit parsing
await check('timeouts/parseDuration-seconds', () => {
  eq(parseDuration('90s'), 90_000, '90s in milliseconds');
  eq(parseDuration('1s'), 1_000, '1s in milliseconds');
  eq(parseDuration('1.5s'), 1_500, '1.5s in milliseconds');
  eq(parseDuration(' 90s '), 90_000, 'whitespace trimmed');
  eq(parseDuration('90S'), 90_000, 'case-insensitive S');
});

await check('timeouts/parseDuration-minutes', () => {
  eq(parseDuration('2m'), 120_000, '2m in milliseconds');
  eq(parseDuration('1m'), 60_000, '1m in milliseconds');
  eq(parseDuration('0.5m'), 30_000, '0.5m in milliseconds');
  eq(parseDuration(' 2M '), 120_000, 'case-insensitive M with whitespace');
});

await check('timeouts/parseDuration-milliseconds', () => {
  eq(parseDuration('500ms'), 500, '500ms in milliseconds');
  eq(parseDuration('90000ms'), 90_000, '90000ms in milliseconds');
  eq(parseDuration('100MS'), 100, 'case-insensitive MS');
});

await check('timeouts/parseDuration-bare-numbers', () => {
  eq(parseDuration('90000'), 90_000, 'bare 90000 in milliseconds');
  eq(parseDuration('3'), 3, 'bare count (e.g. max attempts)');
  eq(parseDuration(' 15000 '), 15_000, 'bare number with whitespace');
});

// 2. Malformed duration values rejected loudly
await check('timeouts/parseDuration-rejects-malformed', () => {
  throws(() => parseDuration('abc', 'test_var'), /Malformed timeout value for test_var/, 'alphabetic string');
  throws(() => parseDuration('90xyz', 'test_var'), /Malformed timeout value for test_var/, 'unrecognized unit');
  throws(() => parseDuration('-5s', 'test_var'), /Malformed timeout value for test_var/, 'negative value');
  throws(() => parseDuration('0', 'test_var'), /must be greater than zero/, 'zero value');
  throws(() => parseDuration('0s', 'test_var'), /must be greater than zero/, 'zero duration');
  throws(() => parseDuration('', 'test_var'), /cannot be empty/, 'empty string');
});

// 3. Fallback and precedence behavior with num()
await check('timeouts/num-precedence-primary-wins', () => {
  const env = {
    REPLAY_RECOVERY_STEP_MS: '2m',
    REPLAY_RECOVERY_MS: '90s',
  };
  const val = num(['REPLAY_RECOVERY_STEP_MS', 'REPLAY_RECOVERY_MS'], 90_000, env);
  eq(val, 120_000, 'REPLAY_RECOVERY_STEP_MS (2m) takes precedence over REPLAY_RECOVERY_MS (90s)');
});

await check('timeouts/num-fallback-to-legacy', () => {
  const env = {
    REPLAY_RECOVERY_MS: '90s',
  };
  const val = num(['REPLAY_RECOVERY_STEP_MS', 'REPLAY_RECOVERY_MS'], 90_000, env);
  eq(val, 90_000, 'falls back to legacy REPLAY_RECOVERY_MS (90s) when REPLAY_RECOVERY_STEP_MS is unset');
});

await check('timeouts/num-default-fallback-when-all-unset', () => {
  const env = {};
  const val = num(['REPLAY_RECOVERY_STEP_MS', 'REPLAY_RECOVERY_MS'], 90_000, env);
  eq(val, 90_000, 'returns default fallback 90000 when neither variable is set');
});

await check('timeouts/num-fallback-on-empty-primary', () => {
  const env = {
    REPLAY_RECOVERY_STEP_MS: '   ',
    REPLAY_RECOVERY_MS: '45s',
  };
  const val = num(['REPLAY_RECOVERY_STEP_MS', 'REPLAY_RECOVERY_MS'], 90_000, env);
  eq(val, 45_000, 'skips whitespace-only primary and falls back to legacy variable');
});

await check('timeouts/num-rejects-malformed-loudly', () => {
  const env = {
    REPLAY_RECOVERY_STEP_MS: '90bogus',
  };
  throws(
    () => num(['REPLAY_RECOVERY_STEP_MS', 'REPLAY_RECOVERY_MS'], 90_000, env),
    /Malformed timeout value for REPLAY_RECOVERY_STEP_MS/,
    'malformed value in num() throws loudly'
  );
});

// 4. Unrecognized REPLAY_RECOVERY_* variables detection
await check('timeouts/validateRecoveryEnv-warns-on-unrecognized', () => {
  const env = {
    REPLAY_RECOVERY_STEP_MS: '90s',
    REPLAY_RECOVERY_RUN_MS: '240s',
    REPLAY_RECOVERY_MAX_ATTEMPTS: '3',
    REPLAY_RECOVERY_ODD_ONE_OUT: '90s',
  };
  const warnings = validateRecoveryEnv(env);
  eq(warnings.length, 1, 'exactly one warning emitted');
  eq(warnings[0].includes('REPLAY_RECOVERY_ODD_ONE_OUT'), true, 'names the offending unrecognized variable');
});

await check('timeouts/validateRecoveryEnv-clean-for-known-vars', () => {
  const env = {
    REPLAY_RECOVERY_STEP_MS: '90s',
    REPLAY_RECOVERY_MS: '90s',
    REPLAY_RECOVERY_RUN_MS: '240s',
    REPLAY_RECOVERY_MAX_ATTEMPTS: '3',
    OTHER_ENV_VAR: 'hello',
  };
  const warnings = validateRecoveryEnv(env);
  eq(warnings.length, 0, 'no warnings for known recovery variables');
});

// 5. describeTimeouts contains recovery step information
await check('timeouts/describeTimeouts-contains-recoveryStep', () => {
  const desc = describeTimeouts();
  eq(desc.includes('recoveryStep≤'), true, 'describeTimeouts outputs recoveryStep limit');
});

console.log(`\n${passed}/${passed + failures.length} timeout integrity checks passed\n`);

if (failures.length > 0) {
  process.exit(1);
}
