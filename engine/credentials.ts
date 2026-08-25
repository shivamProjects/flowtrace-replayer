/**
 * Credential resolution — the decrypt half of the platform's vault.
 *
 * A recording must never carry a real password. The recorder masks the field at
 * capture time (`value: '********'`, `sensitive: true`, `credentialRef: 'password'`),
 * so what reaches replay is a NAME, not a secret. This module turns that name
 * back into a value at the moment the step runs.
 *
 * ── The format is Java's, byte for byte ────────────────────────────────────
 * `platform-domain/.../shared/encryption/EncryptionService.java` writes
 * AES-256-GCM as base64(iv ‖ ciphertext ‖ tag): a 12-byte random IV prepended,
 * a 128-bit tag appended by the cipher itself, the whole thing Base64'd. Node's
 * crypto splits the tag out explicitly where Java keeps it attached, which is
 * the only real difference and the only place this can go subtly wrong.
 *
 * Implemented against that source rather than shared through a library because
 * the two runtimes cannot share one — and the format is stable, standard and
 * small enough that a re-implementation is honest. It is pinned by a test that
 * decrypts a value Java produced; if either side ever changes, that test fails
 * rather than the failure surfacing as an unexplained login error in a replay.
 *
 * ── Why decrypt-only ───────────────────────────────────────────────────────
 * The replayer never needs to WRITE a secret, so it does not get the ability
 * to. Encryption stays in the platform, where the vault, its audit trail and
 * the rotation story already live.
 */

import * as crypto from 'node:crypto';

const IV_LENGTH_BYTES = 12;
const TAG_LENGTH_BYTES = 16; // 128 bits, matching TAG_LENGTH_BITS in Java

/** Thrown when a credential cannot be produced. Never quotes the value. */
export class CredentialError extends Error {}

/**
 * Decrypt one base64 blob written by the platform's EncryptionService.
 *
 * @param blob base64(iv ‖ ciphertext ‖ tag)
 * @param base64Key the same 32-byte key as `platform.encryption.key`
 */
export function decryptSecret(blob: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    // Say the length, never the key. A wrong-length key is a config mistake and
    // the length is the whole diagnosis.
    throw new CredentialError(
      `encryption key must be 32 bytes base64-encoded, got ${key.length}`,
    );
  }

  const combined = Buffer.from(blob, 'base64');
  if (combined.length <= IV_LENGTH_BYTES + TAG_LENGTH_BYTES) {
    throw new CredentialError('encrypted credential is too short to be valid');
  }

  const iv = combined.subarray(0, IV_LENGTH_BYTES);
  // Java leaves the GCM tag attached to the ciphertext; Node wants it separately.
  const tag = combined.subarray(combined.length - TAG_LENGTH_BYTES);
  const ciphertext = combined.subarray(IV_LENGTH_BYTES, combined.length - TAG_LENGTH_BYTES);

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (_) {
    // GCM authentication failed. Deliberately unspecific: the distinction
    // between "wrong key" and "tampered ciphertext" is not one to publish, and
    // neither the blob nor the key belongs in a log line.
    throw new CredentialError('could not decrypt credential — wrong key or corrupt value');
  }
}

/**
 * Where a step's `credentialRef` is resolved from.
 *
 * Two sources, in order:
 *
 *   1. `CREDENTIALS_JSON` — a JSON object of `{ ref: encryptedBlob }`, which is
 *      what the platform passes when it dispatches a replay. It has already
 *      read `Environment.credentials` and knows which environment this run is
 *      against; the replayer does not, and should not have to.
 *   2. `CREDENTIAL_<REF>` — a single env var per ref, for running a recording
 *      by hand without a platform round trip. Uppercased, non-alphanumerics to
 *      underscores, so `credentialRef: 'password'` reads `CREDENTIAL_PASSWORD`.
 *
 * Values may be ENCRYPTED or RAW.
 *
 * Encrypted is the better path and stays the default. Raw is supported because
 * not every caller has the vault: an on-premise install, a developer replaying
 * a recording by hand, and the recorder's own capture (which holds what the
 * operator typed) all have a plaintext credential and nowhere to encrypt it.
 * Refusing them would not remove the plaintext — it would push it back into the
 * recording, which is where this whole problem started.
 *
 * Raw is EXPLICIT, never a fallback. A value is treated as plaintext only when
 * `CREDENTIALS_RAW=true`, or when a ref is supplied through `CREDENTIAL_RAW_*` /
 * `CREDENTIALS_RAW_JSON`. Decryption failure never silently degrades to "maybe
 * it was plaintext": a wrong key would then send a base64 blob to the login
 * form and the failure would look like a bad password. The two possibilities
 * are kept apart so each fails with its own message.
 */
interface Entry {
  value: string;
  /** True when `value` is already plaintext and must not be decrypted. */
  raw: boolean;
}

export class CredentialStore {
  private readonly cache = new Map<string, string>();
  private readonly entries: Record<string, Entry>;
  private readonly key: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.key = String(env.CREDENTIAL_KEY || env.PLATFORM_ENCRYPTION_KEY || '');
    this.entries = {};

    // Everything supplied through the ordinary names is encrypted unless the
    // caller says otherwise for the whole run.
    const allRaw = /^(1|true|yes)$/i.test(String(env.CREDENTIALS_RAW || ''));

    const put = (ref: string, value: string, raw: boolean) => {
      const k = normaliseRef(ref);
      // First writer wins, and the sources are visited in precedence order
      // below, so a stray env var cannot outrank what the platform passed.
      if (!(k in this.entries)) this.entries[k] = { value, raw };
    };

    const fromJson = (json: string | undefined, raw: boolean, name: string) => {
      if (!json) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch (_) {
        throw new CredentialError(`${name} is not valid JSON`);
      }
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'string') put(k, v, raw);
        }
      }
    };

    // Precedence: explicit-raw JSON, then the platform's JSON, then env vars.
    fromJson(env.CREDENTIALS_RAW_JSON, true, 'CREDENTIALS_RAW_JSON');
    fromJson(env.CREDENTIALS_JSON, allRaw, 'CREDENTIALS_JSON');

    for (const [name, value] of Object.entries(env)) {
      if (typeof value !== 'string' || !value) continue;
      if (name === 'CREDENTIAL_KEY') continue;
      // CREDENTIAL_RAW_<REF> is checked first: it also starts with
      // "CREDENTIAL_", so testing the shorter prefix first would swallow it and
      // treat a plaintext password as a base64 blob.
      if (name.startsWith('CREDENTIAL_RAW_')) {
        put(name.slice('CREDENTIAL_RAW_'.length), value, true);
      } else if (name.startsWith('CREDENTIAL_')) {
        put(name.slice('CREDENTIAL_'.length), value, allRaw);
      }
    }
  }

  /**
   * Is any credential usable? A raw one needs no key, so requiring a key here
   * would report "none supplied" for a perfectly workable plaintext run.
   */
  get isConfigured(): boolean {
    return Object.values(this.entries).some((e) => e.raw || Boolean(this.key));
  }

  /**
   * How many refs arrived as plaintext. Reported once at the start of a run:
   * plaintext is supported, but it should never be the SILENT default — an
   * operator who thinks the vault is in use deserves to see that it is not.
   */
  get rawCount(): number {
    return Object.values(this.entries).filter((e) => e.raw).length;
  }

  /**
   * Resolve `ref` to its plaintext, or throw.
   *
   * Throwing rather than returning the masked placeholder is the point: a
   * replay that types `********` into a password field fails at the login page
   * with no explanation, and every later step then fails against the wrong
   * page. Failing here names the actual problem.
   */
  resolve(ref: string): string {
    const key = normaliseRef(ref);
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    const entry = this.entries[key];
    if (!entry) {
      const known = Object.keys(this.entries);
      throw new CredentialError(
        `step needs credential "${ref}", which was not supplied` +
        (known.length ? ` (have: ${known.join(', ')})` : ' (none supplied)'),
      );
    }

    // Raw is taken at face value — no key involved, so a plaintext run works
    // with no vault at all.
    if (entry.raw) {
      this.cache.set(key, entry.value);
      return entry.value;
    }

    if (!this.key) {
      throw new CredentialError(
        `credential "${ref}" is encrypted but no decryption key is set ` +
        `(CREDENTIAL_KEY, matching platform.encryption.key). ` +
        `If this value is plaintext, pass it as CREDENTIAL_RAW_${key.toUpperCase()} ` +
        `or set CREDENTIALS_RAW=true.`,
      );
    }

    const value = decryptSecret(entry.value, this.key);
    this.cache.set(key, value);
    return value;
  }
}

/** `Password`, `password`, `CREDENTIAL_PASSWORD`'s tail — all the same ref. */
function normaliseRef(ref: string): string {
  return String(ref).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
