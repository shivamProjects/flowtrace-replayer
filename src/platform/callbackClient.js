/**
 * The platform callback client.
 *
 * The replayer owns ephemeral browser execution and reports results back over
 * HTTP (integration contract §1). Everything it learns that outlives the run —
 * per-step rows, self-healed fixes, learned error labels, liveness — is sent
 * to the `callbackUrl` authenticated with the `callbackToken` dispatched in the
 * request payload (§5).
 *
 * ── The endpoints, stated once ───────────────────────────────────────────────
 * Every path this service POSTs to is listed below:
 * All of them hang off the dispatch payload's `callbackUrl`
 * (e.g. https://platform/api/internal/replay):
 *
 *   POST {callbackUrl}/{jobExecutionId}/steps        one StepResult, as it lands
 *   POST {callbackUrl}/{jobExecutionId}/heals        one self-healed step fix
 *   POST {callbackUrl}/{jobExecutionId}/ai-fixes     one generalised library fix
 *   POST {callbackUrl}/{jobExecutionId}/error-types  one learned error label
 *   POST {callbackUrl}/{jobExecutionId}/outputs      every captured value, once
 *   POST {callbackUrl}/{jobExecutionId}/heartbeat    lease renewal (§7)
 *
 * A dispatch that carries no `callbackUrl` is legal: the run still executes and
 * streams progress to the open response.
 *
 * ── Asynchronous telemetry ──────────────────────────────────────────────────
 * In-flight telemetry and descriptive updates resolve asynchronously so run
 * execution continues uninterrupted. Transport errors are logged without failing
 * the active replay.
 *
 * `postStep` transmits the durable step record of the run; if a transport
 * disruption occurs, the terminal envelope on the open response serves as the
 * authoritative backstop (§6).
 */

const TIMEOUT_MS = Number(process.env.CALLBACK_TIMEOUT_MS || 10_000);

class CallbackClient {
  /**
   * @param {Object}  dispatch
   * @param {string} [dispatch.jobExecutionId]
   * @param {string} [dispatch.runId]
   * @param {string} [dispatch.callbackUrl]    base URL; absent = callbacks off
   * @param {string} [dispatch.callbackToken]  bearer token for the above
   * @param {(msg: string) => void} [log]
   */
  constructor({ jobExecutionId, runId, callbackUrl, callbackToken } = {}, log) {
    this.jobExecutionId = jobExecutionId ? String(jobExecutionId) : null;
    this.runId = runId ? String(runId) : null;
    // Trailing slashes are the classic way to turn a working URL into a 404.
    this.baseUrl = callbackUrl ? String(callbackUrl).replace(/\/+$/, '') : null;
    this.token = callbackToken || null;
    this.log = log || (() => {});
    this.enabled = Boolean(this.baseUrl);
    this.failures = 0;

    // Discriminate target consumer:
    // App base carries /internal/runs (e.g. https://app.example/api/v1/internal/runs)
    this.isApp = Boolean(this.baseUrl && /\/internal\/runs(?:\/|$)/i.test(this.baseUrl));
  }

  /** Absolute URL for one of the paths documented at the top of this file. */
  _url(suffix) {
    if (this.isApp) {
      if (!this.runId) {
        // App base REQUIRES runId; never leak jobExecutionId onto app path
        return `${this.baseUrl}/<missing-run-id>/${suffix}`;
      }
      return `${this.baseUrl}/${encodeURIComponent(this.runId)}/${suffix}`;
    }
    const id = this.jobExecutionId ?? this.runId ?? '';
    return `${this.baseUrl}/${encodeURIComponent(id)}/${suffix}`;
  }

  /**
   * POST one JSON body with exponential backoff retry for transient network / 5xx errors.
   * Resolves to true on success, false on failure/cancellation, and sets lastStatus/cancelled.
   */
  async _post(suffix, body, { maxRetries = 2 } = {}) {
    if (!this.enabled) return false;

    let attempt = 0;
    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(this._url(suffix), {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        this.lastStatus = res.status;

        if (res.status === 409) {
          // Explicit cancellation signal
          this.cancelled = true;
          this.log(`[callback] ${suffix} -> HTTP 409 (Run Cancelled)`);
          return false;
        }

        if (!res.ok) {
          this.failures++;
          this.log(`[callback] ${suffix} -> HTTP ${res.status} (attempt ${attempt + 1}/${maxRetries + 1})`);
          if (res.status >= 500 && attempt < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
            await new Promise((r) => setTimeout(r, backoffMs));
            attempt++;
            continue;
          }
          return false;
        }
        return true;
      } catch (err) {
        this.failures++;
        this.lastStatus = 0;
        this.log(`[callback] ${suffix} failed: ${err.message} (attempt ${attempt + 1}/${maxRetries + 1})`);
        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
          await new Promise((r) => setTimeout(r, backoffMs));
          attempt++;
          continue;
        }
        return false;
      } finally {
        clearTimeout(timer);
      }
    }
    return false;
  }

  /**
   * One StepResult, the moment it lands rather than only at the end.
   * Platform routes to 'steps'; App routes to 'step'.
   */
  postStep(stepResult) {
    const payload = this.isApp && this.runId ? { runId: this.runId, ...stepResult } : stepResult;
    return this._post(this.isApp ? 'step' : 'steps', payload);
  }

  /**
   * One self-healed step fix.
   * Platform routes to 'heals'; App routes to 'heal'.
   */
  postHeal(heal) {
    const payload = this.isApp && this.runId ? { runId: this.runId, ...heal } : heal;
    return this._post(this.isApp ? 'heal' : 'heals', payload);
  }

  /** One generalised, de-identified fix for the shared library. */
  postAiFix(fix) {
    return this._post('ai-fixes', fix);
  }

  /** One learned label for an application validation message. */
  postErrorType(entry) {
    return this._post('error-types', entry);
  }

  /**
   * A heal that was deliberately NOT applied, and why (C4, design principle P3).
   * App boundary only: /api/v1/internal/runs/{runId}/heal-skipped
   */
  postHealSkipped(record) {
    const payload = this.isApp && this.runId ? { runId: this.runId, ...record } : record;
    return this._post('heal-skipped', payload);
  }

  /** Terminal error callback for the app boundary with durable outbox fallback. */
  async postError(err) {
    const payload = this.isApp && this.runId
      ? { runId: this.runId, ...(typeof err === 'string' ? { error: err } : err) }
      : err;
    const ok = await this._post('error', payload, { maxRetries: 3 });
    if (!ok && this.enabled && !this.cancelled && this.lastStatus !== 409) {
      const id = this.runId || this.jobExecutionId || 'unknown';
      const { CallbackJournal } = require('./callbackJournal');
      CallbackJournal.save(id, 'error', this._url('error'), payload, this.token);
    }
    return ok;
  }

  /** Terminal completion callback for the app boundary with durable outbox fallback. */
  async postComplete(result) {
    const payload = this.isApp && this.runId ? { runId: this.runId, ...result } : result;
    const ok = await this._post('complete', payload, { maxRetries: 3 });
    if (!ok && this.enabled && !this.cancelled && this.lastStatus !== 409) {
      const id = this.runId || this.jobExecutionId || 'unknown';
      const { CallbackJournal } = require('./callbackJournal');
      CallbackJournal.save(id, 'complete', this._url('complete'), payload, this.token);
    }
    return ok;
  }

  /**
   * Every value the run captured, by name, sent once when the run reaches a
   * verdict.
   *
   * Wire shape is `{ outputs: { name: value } }`, NOT the bare map.
   *
   * @param {Object<string, *>} outputs  name -> value, possibly empty
   */
  postOutputs(outputs) {
    const values = {};
    for (const [name, value] of Object.entries(outputs || {})) {
      values[name] =
        value == null
          ? null
          : typeof value === 'string'
            ? value
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
    }
    return this._post('outputs', { outputs: values });
  }

  /**
   * Lease renewal (§7): liveness is a lease, not a timeout. Platform expires a
   * run whose lease lapses, in seconds — it does not reconcile on a timer.
   */
  postHeartbeat(state) {
    const payload = this.isApp && this.runId
      ? { runId: this.runId, at: new Date().toISOString(), ...state }
      : { at: new Date().toISOString(), ...state };
    return this._post('heartbeat', payload);
  }
}

module.exports = { CallbackClient, TIMEOUT_MS };
