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
   * POST one JSON body. Resolves to true on a 2xx and false on anything else,
   * including a thrown transport error. It NEVER rejects — see the header.
   */
  async _post(suffix, body) {
    if (!this.enabled) return false;

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
      if (!res.ok) {
        this.failures++;
        this.log(`[callback] ${suffix} -> HTTP ${res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      this.failures++;
      // The message can name a host and a path. It cannot name a credential:
      // nothing credential-bearing is ever passed to this method.
      this.log(`[callback] ${suffix} failed: ${err.message}`);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * One StepResult, the moment it lands rather than only at the end.
   * Platform routes to 'steps'; App routes to 'step'.
   */
  postStep(stepResult) {
    return this._post(this.isApp ? 'step' : 'steps', stepResult);
  }

  /**
   * One self-healed step fix.
   * Platform routes to 'heals'; App routes to 'heal'.
   */
  postHeal(heal) {
    return this._post(this.isApp ? 'heal' : 'heals', heal);
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
    return this._post('heal-skipped', record);
  }

  /** Terminal error callback for the app boundary. */
  postError(err) {
    return this._post('error', err);
  }

  /** Terminal completion callback for the app boundary. */
  postComplete(result) {
    return this._post('complete', result);
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
    return this._post('heartbeat', { at: new Date().toISOString(), ...state });
  }
}

module.exports = { CallbackClient, TIMEOUT_MS };
