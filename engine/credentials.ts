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
 * Both hold ENCRYPTED values. There is deliberately no plaintext path: an
 * escape hatch for "just this once" is how a plaintext password ends up in a
 * shell history, a CI log or a committed .env, and the 329 recordings already
 * carrying one are the argument against adding another route.
 */
export class CredentialStore {
  private readonly cache = new Map<string, string>();
  private readonly blobs: Record<string, string>;
  private readonly key: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.key = String(env.CREDENTIAL_KEY || env.PLATFORM_ENCRYPTION_KEY || '');
    this.blobs = {};

    const json = env.CREDENTIALS_JSON;
    if (json) {
      try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string') this.blobs[normaliseRef(k)] = v;
          }
        }
      } catch (_) {
        throw new CredentialError('CREDENTIALS_JSON is not valid JSON');
      }
    }

    for (const [name, value] of Object.entries(env)) {
      if (!name.startsWith('CREDENTIAL_') || name === 'CREDENTIAL_KEY') continue;
      if (typeof value !== 'string' || !value) continue;
      const ref = normaliseRef(name.slice('CREDENTIAL_'.length));
      // CREDENTIALS_JSON is the platform's own word on this run; a stray env var
      // must not quietly outrank it.
      if (!(ref in this.blobs)) this.blobs[ref] = value;
    }
  }

  /** Is any credential configured at all? Used to phrase the error better. */
  get isConfigured(): boolean {
    return Boolean(this.key) && Object.keys(this.blobs).length > 0;
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

    if (!this.key) {
      throw new CredentialError(
        `step needs credential "${ref}" but no decryption key is set ` +
        `(CREDENTIAL_KEY, matching platform.encryption.key)`,
      );
    }
    const blob = this.blobs[key];
    if (!blob) {
      const known = Object.keys(this.blobs);
      throw new CredentialError(
        `step needs credential "${ref}", which was not supplied` +
        (known.length ? ` (have: ${known.join(', ')})` : ' (none supplied)'),
      );
    }

    const value = decryptSecret(blob, this.key);
    this.cache.set(key, value);
    return value;
  }
}

/** `Password`, `password`, `CREDENTIAL_PASSWORD`'s tail — all the same ref. */
function normaliseRef(ref: string): string {
  return String(ref).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
