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
   * @param {string}  dispatch.jobExecutionId
   * @param {string} [dispatch.callbackUrl]    base URL; absent = callbacks off
   * @param {string} [dispatch.callbackToken]  bearer token for the above
   * @param {(msg: string) => void} [log]
   */
  constructor({ jobExecutionId, callbackUrl, callbackToken }, log) {
    this.jobExecutionId = String(jobExecutionId);
    // Trailing slashes are the classic way to turn a working URL into a 404.
    this.baseUrl = callbackUrl ? String(callbackUrl).replace(/\/+$/, '') : null;
    this.token = callbackToken || null;
    this.log = log || (() => {});
    this.enabled = Boolean(this.baseUrl);
    this.failures = 0;
  }

  /** Absolute URL for one of the paths documented at the top of this file. */
  _url(suffix) {
    return `${this.baseUrl}/${encodeURIComponent(this.jobExecutionId)}/${suffix}`;
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
   *
   * §6(b): "Never let the only record of a run be the socket the client is
   * holding." A killed run must not be reportable as "failed, zero steps".
   */
  postStep(stepResult) {
    return this._post('steps', stepResult);
  }

  /** One self-healed step fix, for platform to place against the recording. */
  postHeal(heal) {
    return this._post('heals', heal);
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
   * Every value the run captured, by name, sent once when the run reaches a
   * verdict.
   *
   * Until this existed the captured values reached exactly one place — the
   * terminal envelope on the open socket — and the platform dumped that whole
   * node into a blob it never read by name, so every run with a `copy` step
   * lost a real captured value. This is the callback that makes them durable.
   *
   * CALL IT ONLY FROM THE PARSED-RESULT PATH. A run that produced no results
   * file must post NOTHING here rather than an empty map, because `{}` from a
   * finished run means "captured nothing" and `{}` from a crashed run would
   * mean "we never looked" — the same conflation the CRASHED status exists to
   * prevent (contract §7).
   *
   * WIRE SHAPE IS `{ outputs: { name: value } }`, NOT the bare map. The
   * contract is `RunOutputsReport` in app/openapi/flowtrace-v1.yaml (the
   * flowtrace-app repo, branch feat/WP0-contracts-and-schema): an object with
   * `additionalProperties: false` and `required: [outputs]`. A bare map puts
   * every captured name at the top level, so a conformant receiver answers 422
   * and the values are lost at exactly the boundary this callback exists to
   * close. docs/SAAS-BUILD-PLAN.md:187 shows the bare map and is stale.
   *
   * Values are contracted `string | null`, so they are normalised here rather
   * than passed through: one non-string value would 422 the whole batch and
   * lose every other value with it. Copy steps yield strings today, so this
   * only ever fires for something new.
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
   * A heal that was deliberately NOT applied, and why (C4, design principle P3).
   *
   * P3 requires reporting when healing was SKIPPED, not only when it fired.
   * `run_steps.heal_skipped_reason` has existed since the first migration —
   * whose own comment calls it "the trust artifact" — and nothing could write
   * it, because every declining path composed a precise reason and dropped it
   * into a log line. This is the callback that makes those reasons durable.
   *
   * A SKIP IS NOT A HEAL. `postHeal` reports an applied fix; this reports the
   * absence of one. They are separate callbacks so that a receiver cannot
   * render a refusal as a repair — the exact conflation P2 exists to prevent.
   *
   * TWO CATEGORIES, and they are not interchangeable:
   *   DECLINED  nothing was attempted; the four heal fields are null.
   *   REJECTED  a candidate existed and failed an independent re-check.
   * A user reading "skipped" for both learns nothing about which happened, and
   * the second case — a model's confident fix caught being wrong — is the
   * strongest trust signal this product can show.
   *
   * TARGET: this is an APP-boundary callback
   * (`/api/v1/internal/runs/{runId}/…`), not one of the five that go to the
   * platform on `/api/internal/replay/{jobExecutionId}/…`. Two consumers, not a
   * migration — the platform's five are correct and must not move.
   */
  postHealSkipped(record) {
    return this._post('heal-skipped', record);
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
