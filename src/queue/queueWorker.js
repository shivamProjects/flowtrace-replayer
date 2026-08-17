/**
 * Queue worker — stage 3.
 *
 * Polls `api_execution_history` (the shared MySQL queue) for rows with status
 * `in_queue`, decides which are actually eligible to run, and hands each one to
 * the Playwright spec via SpecRunner. When the run finishes it builds the PDF,
 * uploads it, raises a defect if the item is monitored, and writes everything
 * back onto the row.
 *
 * Ported from the replay service, with one substitution: the execution engine
 * is this project's own spec (through SpecRunner) instead of an in-process
 * the Playwright engine through SpecRunner.
 */

const { pool } = require('../config/database');
const SpecRunner = require('./specRunner');
const ReportGenerator = require('../reporting/reportGenerator');
const { saveHeal, buildHealContext } = require('./healWriter');
const { saveLearned } = require('./errorTypeStore');
const ClaudeUsageService = require('../services/claude-usage.service');
const EventEmitter = require('events');
const fs = require('fs');

// Ring-buffer ceiling per execution for the live event log. Sized for a long
// recording's worth of step events plus the spec's chatter, at a few hundred
// bytes each — screenshots are never in here (see recordExecutionStream).
const MAX_BUFFERED_EVENTS = 2000;

// How long an execution's events stay replayable after its last one. Covers a
// browser reconnect, a reopened tab, and someone opening the view just after a
// run ends — without keeping finished runs for the life of the process.
const EVENT_LOG_TTL_MS = 5 * 60 * 1000;

// Written onto rows closed out by reconcileStuckExecutions(). Deliberately
// distinct from 'interrupted_by_user' — nobody pressed stop, the process died.
const STUCK_EXECUTION_MESSAGE =
  'Execution did not finish — the runner stopped while it was still running';

/**
 * The product a script automates, for runs whose row does not say.
 *
 * This exists because the AI features need to know what they are looking at: the
 * recovery prompt tells the model which application the page belongs to, and
 * error classification asks it to label "<product> validation failures". Given
 * the wrong product, both still run and both quietly produce worse answers —
 * which is why the value is carried explicitly rather than inferred.
 *
 * Hardcoded only because no column holds it yet and every instance today is
 * Oracle Fusion. PRODUCT_NAME overrides it; a column supersedes both. The
 * engine's patch layer is the real authority once a browser is open — this only
 * has to be right for prompts, and only until the schema catches up.
 */
const DEFAULT_PRODUCT_NAME = process.env.PRODUCT_NAME || 'Oracle Fusion Cloud';

class QueueWorker {
  constructor() {
    this.isRunning = false;
    this.runningExecutions = new Map(); // executionId → { runner }
    this.maxConcurrent = parseInt(process.env.QUEUE_MAX_LOAD) || 2;
    this.checkInterval = parseInt(process.env.QUEUE_CHECK_INTERVAL) || 5000;
    // Hard ceiling per execution. This is the backstop for a child that hangs
    // without Playwright noticing, so it must stay ABOVE the Playwright run
    // ceiling (REPLAY_RUN_MAX_MS in playwright.config.ts, 25 min) or it kills
    // runs Playwright would have finished — and killing the child before it
    // writes results.json throws away every per-step detail the report is built
    // from. Hence the margin: 32 min, not 25.
    this.executionTimeout = parseInt(process.env.QUEUE_EXECUTION_TIMEOUT) || 32 * 60 * 1000;
    // How often to look for executions abandoned by a dead process. Housekeeping
    // — it does not need to run on every poll.
    this.reconcileInterval = parseInt(process.env.QUEUE_RECONCILE_INTERVAL) || 5 * 60 * 1000;
    this.lastReconcileAt = 0;
    this.intervalId = null;
    // executionId → { events: [{seq, data}], nextSeq, updatedAt }
    this.executionEvents = new Map();
    // Per-execution fan-out to whatever SSE connections are attached. No cap on
    // listeners: several people may legitimately watch the same run.
    this.stream = new EventEmitter();
    this.stream.setMaxListeners(0);
    // Guards against two polls overlapping — the interval can fire while a
    // slot-freed poll is still mid-flight.
    this.isProcessing = false;
    this.rerunRequested = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Queue worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('\n=== Queue Worker Started ===');
    console.log(`Max concurrent executions: ${this.maxConcurrent}`);
    console.log(`Check interval: ${this.checkInterval / 1000}s`);
    console.log('===========================\n');

    this.processQueue();
    this.intervalId = setInterval(() => this.processQueue(), this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('\n=== Queue Worker Stopped ===\n');
  }

  /**
   * Stop polling AND take the running executions down with us.
   *
   * `stop()` only clears the poll interval. On a SIGTERM the server used to call
   * it and then `process.exit(0)` straight away, which orphaned every spawned
   * Playwright child — a detached node + a headless Chromium per running
   * execution, leaked until the box was rebooted — and left their rows at
   * 'in_execution' until the next start's reconcileStuckExecutions() found them.
   *
   * Killing the child makes SpecRunner.replay() return, which lets
   * startExecution's own path write the row truthfully. We wait for that, then
   * write the row ourselves for anything that did not finish in time.
   */
  async shutdown(graceMs = 15_000) {
    this.stop();

    const running = [...this.runningExecutions.values()];
    if (running.length === 0) return;

    console.log(`[Queue Worker] Terminating ${running.length} running execution(s)`);
    await Promise.allSettled(running.map((d) => d.runner.close()));

    const deadline = Date.now() + graceMs;
    while (this.runningExecutions.size > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
    }

    for (const id of [...this.runningExecutions.keys()]) {
      console.log(`[Queue Worker] Execution ${id} did not exit within the grace period`);
      await this.markAsInterrupted(id, null);
    }
  }

  /** The live runner for an execution — the SSE route subscribes to its events. */
  getExecutionEmitter(executionId) {
    const executionData = this.runningExecutions.get(executionId.toString());
    return executionData ? executionData.runner : null;
  }

  /* ────────────────────────── dependency helpers ────────────────────────── */

  // Distinct parent execution ids that a row's param_bindings depend on.
  _bindingDependencyIds(paramBindings) {
    if (!paramBindings) return [];
    let pb = paramBindings;
    try { if (typeof pb === 'string') pb = JSON.parse(pb); } catch (_) { return []; }
    if (!Array.isArray(pb)) return [];
    return [...new Set(pb.map(b => b && b.from_execution_id).filter(Boolean))];
  }

  // Parse a JSON array of execution ids (ordering-only depends_on).
  _parseIdArray(v) {
    if (!v) return [];
    let arr = v;
    try { if (typeof arr === 'string') arr = JSON.parse(arr); } catch (_) { return []; }
    return Array.isArray(arr) ? arr.map(Number).filter(Boolean) : [];
  }

  // Resolve each bound ${param} from its parent execution's captured_outputs and
  // substitute it into the child's script string before the run.
  async _injectBoundParams(scriptStr, paramBindings, execId) {
    let pb = paramBindings;
    try { if (typeof pb === 'string') pb = JSON.parse(pb); } catch (_) { return scriptStr; }
    if (!Array.isArray(pb) || !pb.length) return scriptStr;

    for (const b of pb) {
      let value = '';
      if (b.from_execution_id) {
        const [pr] = await pool.query(
          'SELECT captured_outputs FROM api_execution_history WHERE id = ?',
          [b.from_execution_id]
        );
        let co = pr.length ? pr[0].captured_outputs : null;
        try { if (typeof co === 'string') co = JSON.parse(co); } catch (_) { co = null; }

        if (Array.isArray(co)) {
          const hit = co.find(o => o && o.name === b.output_name);
          if (hit) value = hit.value != null ? String(hit.value) : '';
        } else if (co && typeof co === 'object') {
          value = co[b.output_name] != null ? String(co[b.output_name]) : '';
        }
      }
      // Length, not the value. This runs in the WORKER, which has no Redactor —
      // that lives in the engine — so anything printed here bypasses every
      // masking rule the engine applies. A bound parameter carries whatever an
      // earlier script captured, which can be a session token or a one-time
      // code, and service logs are routinely shipped off-box.
      console.log(
        `[Execution ${execId}] Inject bound param \${${b.param_name}} = ` +
        `<${value.length} chars> (from execution ${b.from_execution_id}, output ${b.output_name})`
      );
      scriptStr = scriptStr.split('${' + b.param_name + '}').join(value);
    }
    return scriptStr;
  }

  /* ─────────────────────────── live event log ───────────────────────────── */

  /**
   * Record everything an execution emits, from the moment it starts.
   *
   * The SSE route used to be the only thing listening, which meant an event was
   * only ever kept if a viewer happened to be connected when it happened. Open
   * the live view at step 21 and steps 1-20 were simply gone — they had been
   * written to a socket nobody was holding. Owning the log here instead means
   * the run narrates itself whether or not anyone is watching, and a viewer can
   * be caught up whenever they arrive.
   *
   * Screenshots are forwarded to live viewers but never retained: at 15-60KB of
   * base64 each they are virtually the whole weight of the stream, and holding
   * a run's worth of them is what used to bloat this process. A late joiner
   * misses the frames it was not there for and picks up at the next step; every
   * frame is still in the PDF.
   */
  recordExecutionStream(executionId, runner) {
    const key = String(executionId);
    // A re-run of the same id starts a fresh log rather than continuing the
    // previous attempt's.
    this.executionEvents.set(key, { events: [], nextSeq: 0, updatedAt: Date.now() });

    const record = (payload) => {
      const state = this.executionEvents.get(key);
      if (!state) return;

      state.nextSeq += 1;
      state.updatedAt = Date.now();
      const entry = { seq: state.nextSeq, data: payload };

      if (!payload || payload.type !== 'screenshot') {
        state.events.push(entry);
        if (state.events.length > MAX_BUFFERED_EVENTS) state.events.shift();
      }

      // Live viewers get everything, retained or not.
      this.stream.emit(key, entry);
    };

    runner.on('event', record);
    runner.on('log', (entry) => record({ type: 'log', ...entry }));
  }

  /** Buffered events for an execution, newer than `sinceSeq`. */
  getExecutionEvents(executionId, sinceSeq = 0) {
    const state = this.executionEvents.get(String(executionId));
    if (!state) return [];
    return sinceSeq > 0 ? state.events.filter((e) => e.seq > sinceSeq) : state.events.slice();
  }

  /** Subscribe to an execution's live events. Returns the unsubscribe. */
  subscribeToExecution(executionId, handler) {
    const key = String(executionId);
    this.stream.on(key, handler);
    return () => this.stream.off(key, handler);
  }

  /**
   * Drop logs for executions that have been quiet longer than the TTL.
   *
   * Called from the poll rather than an interval: a run that ends with nobody
   * watching has no viewer left to trigger a cleanup, so this cannot depend on
   * a stream still being attached.
   */
  sweepExecutionEvents() {
    const cutoff = Date.now() - EVENT_LOG_TTL_MS;
    for (const [key, state] of this.executionEvents) {
      if (state.updatedAt < cutoff && !this.runningExecutions.has(key)) {
        this.executionEvents.delete(key);
      }
    }
  }

  /* ──────────────────── abandoned-execution reconciliation ──────────────── */

  /**
   * Close out rows left at 'in_execution' by a process that died mid-run.
   *
   * A crash, an OOM kill, or a plain `pm2 restart` takes the child browser with
   * it and never gets to write a final status, so the row stays 'in_execution'
   * forever and the UI shows a run that has not moved in days. Execution 8068
   * sat that way through 44 restarts — nothing in the service ever looked back
   * at it. `stop()` does not help: it clears the poll timer and touches no rows.
   *
   * The age check is what makes this safe against a SHARED database. Another
   * service's genuinely-live execution is younger than its own timeout by
   * definition — it would have been killed otherwise — so only rows older than
   * this worker's ceiling plus a margin are eligible, and a run in flight
   * elsewhere can never be stolen. Rows this process is running are excluded
   * outright, belt and braces.
   *
   * @returns {Promise<number>} rows closed out
   */
  async reconcileStuckExecutions() {
    // Grace on top of the hard ceiling: report generation and the S3 upload run
    // after the browser work, and that tail is not covered by executionTimeout.
    const staleAfterSeconds = Math.ceil((this.executionTimeout + 5 * 60 * 1000) / 1000);

    try {
      const running = [...this.runningExecutions.keys()];
      const params = [STUCK_EXECUTION_MESSAGE, staleAfterSeconds];

      let sql =
        `UPDATE api_execution_history
            SET execution_status = 'failed',
                error_message = ?
          WHERE execution_status = 'in_execution'
            AND executed_at IS NOT NULL
            AND executed_at < NOW() - INTERVAL ? SECOND`;

      if (running.length) {
        sql += ` AND id NOT IN (${running.map(() => '?').join(',')})`;
        params.push(...running);
      }

      const [result] = await pool.query(sql, params);

      if (result.affectedRows > 0) {
        console.log(
          `[Queue Worker] Closed out ${result.affectedRows} abandoned execution(s) ` +
          `left 'in_execution' by a stopped process`
        );
      }
      return result.affectedRows;

    } catch (error) {
      // Housekeeping must never stop the worker doing its actual job.
      console.error('[Queue Worker] Abandoned-execution reconciliation failed:', error.message);
      return 0;
    }
  }

  async _maybeReconcile() {
    const now = Date.now();
    if (now - this.lastReconcileAt < this.reconcileInterval) return;
    this.lastReconcileAt = now;
    this.sweepExecutionEvents();
    await this.reconcileStuckExecutions();
  }

  /* ─────────────────────────────── polling ──────────────────────────────── */

  async processQueue() {
    // If a poll is already running, don't start a second one — just make sure
    // another follows it, so a slot freed mid-poll is still picked up at once.
    if (this.isProcessing) {
      this.rerunRequested = true;
      return;
    }
    this.isProcessing = true;

    try {
      // Before anything else, and on the first poll after boot: a row abandoned
      // by the previous process is exactly what a fresh start should notice.
      await this._maybeReconcile();

      const availableSlots = this.maxConcurrent - this.runningExecutions.size;

      if (availableSlots <= 0) {
        console.log(`[Queue Worker] All slots full (${this.runningExecutions.size}/${this.maxConcurrent})`);
        return;
      }

      console.log(`[Queue Worker] Checking for queued executions... (${this.runningExecutions.size}/${this.maxConcurrent} running)`);

      // Fetch a window of oldest in_queue items (more than the slot count) so we
      // can skip chain-children whose parent hasn't finished yet, and still fill
      // the free slots with ready work.
      const [rows] = await pool.query(
        `SELECT
           aeh.id,
           aeh.api_name,
           aeh.script_json_complete,
           aeh.project_id as run_id,
           aeh.project_item_id,
           aeh.param_bindings,
           aeh.depends_on_execution_ids,
           cs.script_id,
           cs.script_code,
           cs.script_outputs,
           cs.script_json_parameterized,
           cs.script_json_parameters,
           cr.metadata as recording_metadata,
           cr.script_json_parameterized as recording_steps,
           -- The product this script automates. A bound placeholder rather than a
           -- column because none holds it yet and every instance today is Oracle
           -- Fusion. When a column is added this becomes i.product_name (or a
           -- COALESCE onto the default for older rows) and nothing downstream
           -- changes: from here it already travels record -> env -> engine -> prompt.
           ? as product_name
         FROM api_execution_history aeh
         LEFT JOIN api_project_item api ON aeh.project_item_id = api.project_item_id
         LEFT JOIN cus_script cs ON COALESCE(aeh.script_id, api.cus_script_id) = cs.script_id
         LEFT JOIN cus_recordings cr ON api.recording_id = cr.id
         WHERE aeh.execution_status = 'in_queue'
         ORDER BY aeh.id ASC
         LIMIT ?`,
        [DEFAULT_PRODUCT_NAME, Math.max(availableSlots * 5, 20)]
      );

      if (rows.length === 0) {
        console.log('[Queue Worker] No queued executions found');
        return;
      }

      // Two kinds of dependency behave differently:
      //   • DATA bindings (param_bindings): the child needs the parent's OUTPUT,
      //     so the parent must be `success`. If a bound parent FAILED, the child
      //     can't get its value → mark the child failed.
      //   • ORDERING-only (depends_on_execution_ids): the script just needs to run
      //     AFTER the dependency FINISHES — pass or fail. So it becomes eligible as
      //     soon as those deps reach a terminal state; a failed ordering-dep does
      //     NOT fail this script.
      const TERMINAL = ['success', 'failed', 'error', 'interrupted_by_user'];
      const FAILED = ['failed', 'error', 'interrupted_by_user'];
      const eligible = [];

      for (const record of rows) {
        const bindingDeps = this._bindingDependencyIds(record.param_bindings);   // need SUCCESS
        const orderingDeps = this._parseIdArray(record.depends_on_execution_ids); // need FINISH
        const allDeps = [...new Set([...bindingDeps, ...orderingDeps])];

        if (allDeps.length === 0) {
          eligible.push(record);
        } else {
          const [depRows] = await pool.query(
            `SELECT id, execution_status FROM api_execution_history WHERE id IN (${allDeps.map(() => '?').join(',')})`,
            allDeps
          );
          const statusById = {};
          depRows.forEach(d => { statusById[d.id] = d.execution_status; });

          const bindingFailed = bindingDeps.some(id => FAILED.includes(statusById[id]));
          const bindingSatisfied = bindingDeps.every(id => statusById[id] === 'success');
          const orderingSatisfied = orderingDeps.every(id => TERMINAL.includes(statusById[id]));

          if (bindingFailed) {
            console.log(`[Queue Worker] Execution ${record.id} skipped — a bound parent failed`);
            await this.markAsFailed(record.id, 'Dependency script failed — bound parameter could not be resolved');
          } else if (bindingSatisfied && orderingSatisfied) {
            eligible.push(record);
          } else {
            console.log(`[Queue Worker] Execution ${record.id} waiting on dependencies [${allDeps.join(', ')}]`);
          }
        }
        if (eligible.length >= availableSlots) break;
      }

      const toRun = eligible.slice(0, availableSlots);
      if (toRun.length === 0) {
        console.log('[Queue Worker] No eligible executions (children waiting on parents)');
        return;
      }
      console.log(`[Queue Worker] Starting execution(s): IDs [${toRun.map(r => r.id).join(', ')}]`);

      for (const record of toRun) {
        // Claim the slot synchronously, before any await inside startExecution,
        // so the next tick can't over-admit while this one is still setting up.
        const runner = new SpecRunner(record.id);
        this.runningExecutions.set(record.id.toString(), { runner });
        // Recording starts HERE, with the run — not when a viewer turns up.
        // That is the whole point: someone opening the live view at step 21
        // should still be told what happened in steps 1 to 20.
        this.recordExecutionStream(record.id, runner);
        // Fire-and-forget, but NEVER unhandled: startExecution's own catch does
        // DB work of its own, and on Node >= 15 one rejection escaping here
        // terminates the process and takes every other running execution with it.
        this.startExecution(record, runner).catch(async (err) => {
          console.error(`[Execution ${record.id}] Unhandled error in startExecution:`, err);
          await this.markAsFailed(record.id, `Unhandled worker error: ${err && err.message ? err.message : err}`);
          this.runningExecutions.delete(record.id.toString());
        });
      }

    } catch (error) {
      console.error('[Queue Worker] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
      if (this.rerunRequested) {
        this.rerunRequested = false;
        setImmediate(() => this.processQueue());
      }
    }
  }

  /* ──────────────────────────────── stop ────────────────────────────────── */

  async stopExecution(executionId) {
    try {
      const execId = executionId.toString();
      const executionData = this.runningExecutions.get(execId);

      if (!executionData) {
        // Maybe it's queued but not running yet.
        const [rows] = await pool.query(
          'SELECT execution_status FROM api_execution_history WHERE id = ?',
          [executionId]
        );

        if (rows.length === 0) {
          throw new Error('Execution not found');
        }

        if (rows[0].execution_status === 'in_queue') {
          await pool.query(
            'UPDATE api_execution_history SET execution_status = ?, error_message = ? WHERE id = ?',
            ['interrupted_by_user', 'Cancelled by user before execution started', executionId]
          );
          console.log(`[Execution ${executionId}] Cancelled from queue (not yet started)`);
          return { message: 'Execution cancelled (was queued, not yet started)', status: 'cancelled_from_queue' };
        }

        throw new Error('Execution is not currently running');
      }

      console.log(`[Execution ${executionId}] Stop requested by user`);
      await executionData.runner.close();
      console.log(`[Execution ${executionId}] Spec process terminated`);

      return { message: 'Execution stopped successfully (no report generated)', status: 'stopping' };

    } catch (error) {
      console.error(`[Stop Execution ${executionId}] Error:`, error.message);
      throw error;
    }
  }

  /* ───────────────────────────── one execution ──────────────────────────── */

  async startExecution(record, runner) {
    const {
      id, api_name, script_json_complete, run_id, script_code, script_outputs,
      param_bindings, recording_metadata, recording_steps,
      script_id, script_json_parameterized, script_json_parameters,
      product_name,
    } = record;

    let startTime = Date.now();

    try {
      console.log(`\n[Execution ${id}] Starting execution for "${api_name}"`);

      if (!script_json_complete) {
        await this.markAsFailed(id, 'No script found in script_json_complete');
        return;
      }

      // Parse actions — injecting any bound ${param}s from parent captured_outputs first.
      let actions;
      try {
        let scriptStr = typeof script_json_complete === 'string'
          ? script_json_complete
          : JSON.stringify(script_json_complete);
        if (param_bindings) {
          scriptStr = await this._injectBoundParams(scriptStr, param_bindings, id);
        }
        actions = JSON.parse(scriptStr);
      } catch (e) {
        await this.markAsFailed(id, 'Invalid JSON in script: ' + e.message);
        return;
      }

      if (!Array.isArray(actions)) {
        await this.markAsFailed(id, 'Script must be an array of actions');
        return;
      }

      await pool.query(
        'UPDATE api_execution_history SET execution_status = ?, executed_at = NOW() WHERE id = ?',
        ['in_execution', id]
      );

      console.log(`[Execution ${id}] Status updated to 'in_execution'`);
      console.log(`[Execution ${id}] Total actions: ${actions.length}`);

      const reportGenerator = new ReportGenerator(id, run_id, script_code);
      await reportGenerator.createReportDirectory();

      // Forward everything the spec child prints into the service log. Without
      // this, a failed replay shows only "Completed with status: failed" here
      // and the real cause is visible nowhere except the SSE stream.
      runner.on('log', (e) => {
        const tag = e.level === 'error' ? 'ERR ' : e.level === 'warn' ? 'WARN' : '    ';
        console.log(`[Execution ${id}][spec]${tag} ${e.message}`);
      });
      runner.on('step-start', (e) => console.log(`[Execution ${id}][step ${e.index + 1}] ▶ ${e.description || e.action}`));
      runner.on('step-end', (e) =>
        console.log(`[Execution ${id}][step ${e.index + 1}] ${e.status.toUpperCase()} (${e.duration}ms)${e.error ? ' — ' + String(e.error).split('\n')[0] : ''}`)
      );
      runner.on('recovery-start', (e) => console.log(`[Execution ${id}][AI] recovery starting for step ${e.index + 1}: ${e.description}`));
      runner.on('recovery-end', (e) => console.log(`[Execution ${id}][AI] recovered=${e.recovered} — ${e.summary}`));


      // A label the run had to work out for itself, on its way to
      // cus_oracle_error_type so no later run pays for it again. Stored the
      // moment it exists rather than at the end, for the same reason heals are:
      // a run that is stopped should keep what it has already learned.
      runner.on('error-type-learned', (entry) => {
        saveLearned({ ...entry, executionId: id })
          .then((message) => console.log(message))
          .catch((err) => console.log(`[Execution ${id}][Error type] unexpected failure: ${err.message}`));
      });

      // Claude spend, one row per recovery attempt. The spec reports usage but
      // cannot write it — this process owns the database connection and can
      // resolve the customer/instance/user the execution belongs to.
      //
      // Fire-and-forget by design: an accounting write must never delay or fail
      // the execution it is only describing.
      runner.on('ai-usage', (e) => {
        console.log(
          `[Execution ${id}][AI] usage step ${e.index + 1}: ${e.model} ` +
          `in=${e.usage?.input_tokens ?? 0} out=${e.usage?.output_tokens ?? 0} ` +
          `${e.durationMs ?? 0}ms status=${e.status}` +
          (e.error ? ` — ${e.error}` : '')
        );
        ClaudeUsageService.logRecoveryUsage({
          executionId: id,
          model: e.model,
          usage: e.usage,
          durationMs: e.durationMs,
          status: e.status,
          error: e.error,
        }).catch((err) => console.log(`[Execution ${id}][AI] usage log failed: ${err.message}`));
      });

      // Run the spec. Screenshots land in the report dir as step_<N>.png, which
      // is exactly what the PDF builder looks for.
      startTime = Date.now();
      const result = await runner.replay(actions, {
        // Headless unless explicitly disabled — the OPPOSITE default to
        // playwright.config.ts, deliberately. A queued run has no display, so it
        // must default headless; a hand-run wants to be watched, so it defaults
        // headed. specRunner turns this into an explicit PLAYWRIGHT_HEADLESS on
        // the child env, so the config's default never applies to a queued run.
        headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
        screenshotDir: reportGenerator.screenshotsDir,
        timeout: this.executionTimeout,
        // Comes off the execution row, so a per-instance column later needs no
        // change here. Falls back for callers that fetched the row themselves.
        productName: product_name || DEFAULT_PRODUCT_NAME,
      });
      const executionTime = Date.now() - startTime;

      if (result.heals && result.heals.length > 0) {
        // `executedSteps` is the name buildHealContext destructures — passing
        // recordingStepsRaw left it undefined, so every heal was dropped with
        // "could not line the script up with what ran".
        const healContext = buildHealContext({
          scriptId: script_id,
          parameterizedRaw: script_json_parameterized,
          parametersRaw: script_json_parameters,
          executedSteps: actions,
        });
        if (!healContext) {
          console.log(`[Execution ${id}][Heal] write-back unavailable — no parameterized script to update`);
        } else {
          for (const heal of result.heals) {
            try {
              const msg = await saveHeal({ heal, context: healContext, executionId: id });
              console.log(msg);
            } catch (err) {
              console.log(`[Execution ${id}][Heal] unexpected failure: ${err.message}`);
            }
          }
        }
      }

      // A stopped run is not a failed one. SpecRunner.replay() RETURNS when the
      // child is killed — it never throws — so the catch below (which does check
      // runner.stopped) is never reached on this path. Without this the row was
      // written 'failed', a PDF was built and a defect could be raised for a run
      // the user cancelled, while /stop had already answered "no report generated".
      if (runner.stopped) {
        await this.markAsInterrupted(id, executionTime);
        return;
      }

      const executionStatus = result.success ? 'success' : 'failed';
      const errorMessage = result.error || null;

      console.log(`[Execution ${id}] Completed with status: ${executionStatus}`);
      console.log(`[Execution ${id}] Execution time: ${executionTime}ms`);

      if (!result.results) result.results = [];

      // Warn steps (self-healed) count as successful — the business outcome was achieved.
      const successfulActions = result.results.filter(r => r.status === 'success' || r.status === 'warn').length;
      const failedActions = result.results.filter(r => r.status === 'failed').length;

      // Parse normalized steps from recording metadata
      let normalizedSteps = null;
      let recordingStepsArray = null;
      if (recording_metadata) {
        try {
          const metadata = typeof recording_metadata === 'string' ? JSON.parse(recording_metadata) : recording_metadata;
          normalizedSteps = metadata.normalized_steps || null;
        } catch (e) {
          console.log(`[Execution ${id}] Failed to parse recording metadata:`, e.message);
        }
      }

      if (recording_steps) {
        try {
          recordingStepsArray = typeof recording_steps === 'string' ? JSON.parse(recording_steps) : recording_steps;
        } catch (e) {
          console.log(`[Execution ${id}] Failed to parse recording steps:`, e.message);
        }
      }

      // Re-query right before the report so executed_at and the joined display
      // fields are the freshest values.
      console.log(`[Report] Querying fresh data from database for execution ID: ${id}`);
      const [freshRows] = await pool.query(
        `SELECT
           aeh.executed_at,
           u.full_name as user_name,
           u.email as user_email,
           u.signature_url as user_signature_url,
           c.customer_name,
           c.logo_path,
           i.instance_name,
           i.base_url,
           cs.script_id,
           cs.script_name,
           cs.module_code,
           cs.script_json_parameters,
           mp.process_name
         FROM api_execution_history aeh
         LEFT JOIN app_user u ON aeh.user_id = u.app_user_id
         LEFT JOIN api_project_item api ON aeh.project_item_id = api.project_item_id
         LEFT JOIN cus_script cs ON api.cus_script_id = cs.script_id
         LEFT JOIN cus_customer c ON cs.customer_id = c.customer_id
         LEFT JOIN cus_instance i ON cs.customer_instance_id = i.instance_id
         LEFT JOIN ora_module_process mp ON cs.mp_id = mp.mp_id
         WHERE aeh.id = ?`,
        [id]
      );

      const freshData = freshRows[0] || {};
      console.log(`[Report] Fresh data retrieved - User: ${freshData.user_name}, Executed At: ${freshData.executed_at}`);

      const executionData = {
        executionId: id,
        scriptId: freshData.script_id || null,
        runId: run_id,
        scriptCode: script_code,
        apiName: api_name,
        scriptName: freshData.script_name || api_name,
        customerName: freshData.customer_name || '-',
        customerLogoPath: freshData.logo_path || null,
        instanceName: freshData.instance_name || '-',
        baseUrl: freshData.base_url || '-',
        moduleCode: freshData.module_code || '-',
        processName: freshData.process_name || '-',
        userName: freshData.user_name || '-',
        userEmail: freshData.user_email || '-',
        userSignatureUrl: freshData.user_signature_url || null,
        status: executionStatus,
        executionTime: executionTime,
        executedAt: freshData.executed_at || new Date(),
        totalActions: actions.length,
        successfulActions: successfulActions,
        failedActions: failedActions,
        errorMessage: errorMessage,
        results: result.results,
        transactionInfo: result.transactionInfo || null,
        normalizedSteps: normalizedSteps,
        recordingSteps: recordingStepsArray,
        scriptParameters: freshData.script_json_parameters,
      };

      const reportResult = await reportGenerator.generatePDFReport(executionData);

      // Handle S3 response or local path fallback
      let s3Url = null;
      let reportPath = null;
      let reportSizeBytes = null;

      if (typeof reportResult === 'object' && reportResult.s3Url) {
        s3Url = reportResult.s3Url;
        reportPath = reportResult.s3Url;
        reportSizeBytes = reportResult.fileSize;
        console.log(`[Execution ${id}] PDF uploaded to S3: ${s3Url}`);
        console.log(`[Execution ${id}] S3 Key: ${reportResult.s3Key}`);
        console.log(`[Execution ${id}] PDF Size: ${reportResult.fileSizeMB} MB (${reportSizeBytes} bytes)`);
        // Note: local files already deleted by S3Helper
      } else {
        reportPath = reportResult;
        console.log(`[Execution ${id}] PDF saved locally: ${reportPath}`);

        try {
          const pdfStats = fs.statSync(reportPath);
          reportSizeBytes = pdfStats.size;
          console.log(`[Execution ${id}] PDF size: ${(reportSizeBytes / (1024 * 1024)).toFixed(2)} MB (${reportSizeBytes} bytes)`);
        } catch (err) {
          console.log(`[Execution ${id}] Could not get file size: ${err.message}`);
        }

        try {
          const deletedCount = await reportGenerator.deleteScreenshots();
          console.log(`[Execution ${id}] Deleted ${deletedCount} screenshot files`);
        } catch (err) {
          console.log(`[Execution ${id}] Could not delete screenshots: ${err.message}`);
        }
      }

      const defectCreated = await this.createDefectIfMonitored(id, record.project_item_id, result.results);

      // Live values captured by `copy` steps during this run — persisted so a
      // downstream (child) script can bind a parameter to one of them. Kept IN
      // SYNC with cus_script.script_outputs: each entry mirrors the output
      // definition with the captured `value` added.
      let capturedOutputs = null;
      try {
        const liveValues = result.outputs || {}; // { outputName: liveValue }
        let outDefs = [];
        if (script_outputs) {
          outDefs = typeof script_outputs === 'string' ? JSON.parse(script_outputs) : script_outputs;
        }
        if (!Array.isArray(outDefs)) outDefs = [];

        const merged = outDefs.map((def) => ({
          ...def,
          value: Object.prototype.hasOwnProperty.call(liveValues, def.name) ? liveValues[def.name] : null,
        }));
        // Include any captured value that has no definition (defensive).
        const known = new Set(outDefs.map((d) => d.name));
        for (const [name, value] of Object.entries(liveValues)) {
          if (!known.has(name)) merged.push({ name, value });
        }
        if (merged.length) capturedOutputs = JSON.stringify(merged);
      } catch (e) {
        console.error(`[Execution ${id}] Failed to build captured_outputs: ${e.message}`);
        if (result.outputs && Object.keys(result.outputs).length) {
          capturedOutputs = JSON.stringify(result.outputs);
        }
      }

      await pool.query(
        `UPDATE api_execution_history
         SET execution_status = ?,
             error_message = ?,
             response_time_ms = ?,
             executed_at = NOW(),
             response_body = ?,
             report_size_bytes = ?,
             defect_created = ?,
             captured_outputs = ?
         WHERE id = ?`,
        [executionStatus, errorMessage, executionTime, reportPath, reportSizeBytes, defectCreated, capturedOutputs, id]
      );
      if (capturedOutputs) console.log(`[Execution ${id}] Captured outputs: ${capturedOutputs}`);

      console.log(`[Execution ${id}] Database updated with final status (defect_created: ${defectCreated})\n`);

    } catch (error) {
      console.error(`[Execution ${id}] Fatal error:`, error);

      const executionTime = Date.now() - startTime;

      const isInterrupted = runner.stopped || (error.message && (
        error.message.includes('Target closed') ||
        error.message.includes('Browser closed') ||
        error.message.includes('Protocol error')
      ));

      if (isInterrupted) {
        await this.markAsInterrupted(id, executionTime);
      } else {
        await this.markAsFailed(id, error.message);
      }
    } finally {
      this.runningExecutions.delete(id.toString());
      console.log(`[Execution ${id}] Removed from running queue (${this.runningExecutions.size}/${this.maxConcurrent} now running)\n`);

      // A slot just opened. Fill it now rather than idling until the next
      // interval tick — with a 30s interval and short jobs, that wait was
      // costing more than the runs themselves.
      if (this.isRunning) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  /* ─────────────────────── extras: defect creation ──────────────────────── */

  /**
   * Monitored items raise a defect when steps fail, so a broken flow shows up as
   * tracked work instead of just a red row. Returns 1 if a defect was written.
   */
  async createDefectIfMonitored(id, projectItemId, results) {
    const failedSteps = (results || []).filter(r => r.status === 'failed');
    if (failedSteps.length === 0) return 0;

    console.log(`[Execution ${id}] Found ${failedSteps.length} failed step(s), checking if monitoring is enabled...`);

    try {
      const [monitoringRows] = await pool.query(
        'SELECT is_monitored, cus_script_id FROM api_project_item WHERE project_item_id = ?',
        [projectItemId]
      );

      if (!(monitoringRows.length > 0 && monitoringRows[0].is_monitored === 1)) {
        console.log(`[Execution ${id}] Monitoring is disabled. No defect created.`);
        return 0;
      }

      console.log(`[Execution ${id}] Monitoring is enabled. Creating defect...`);

      const defectId = `DEF-${Date.now()}-${id}`;

      // Severity scales with blast radius: a single broken step is low, a flow
      // that fell over in five places is high.
      let severity = 'medium';
      if (failedSteps.length >= 5) {
        severity = 'high';
      } else if (failedSteps.length === 1) {
        severity = 'low';
      }

      const failedStepsData = failedSteps.map((step) => ({
        step_number: step.index + 1,
        step_index: step.index,
        action: step.action,
        description: step.description,
        code: step.code || '',
        error_message: step.error,
        duration_ms: step.duration,
        timestamp: new Date(step.timestamp).toISOString(),
        // Oracle rejections carry the kind of problem and its individual
        // messages. Stored so defects can be grouped and counted by kind
        // ("14 duplicate-data failures this month") instead of by an error
        // string that is different every time.
        ...(step.oracleError ? { oracle_error: true } : {}),
        ...(step.errorType ? { error_type: step.errorType } : {}),
        ...(Array.isArray(step.errorMessages) && step.errorMessages.length
          ? { error_messages: step.errorMessages }
          : {}),
      }));

      await pool.query(
        `INSERT INTO cus_defects (
          defect_id, script_id, execution_id, severity, status,
          failed_steps_json, assigned, update_date, creation_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [defectId, monitoringRows[0].cus_script_id, id, severity, 'open', JSON.stringify(failedStepsData), null]
      );

      console.log(`[Execution ${id}] ✅ Defect created: ${defectId} (Severity: ${severity}, Failed Steps: ${failedSteps.length})`);
      return 1;

    } catch (defectError) {
      // A defect is a nice-to-have; never let it sink an otherwise good run.
      console.error(`[Execution ${id}] ❌ Failed to create defect:`, defectError.message);
      return 0;
    }
  }

  async markAsFailed(id, errorMessage) {
    try {
      await pool.query(
        'UPDATE api_execution_history SET execution_status = ?, error_message = ?, executed_at = NOW() WHERE id = ?',
        ['failed', errorMessage, id]
      );
      console.log(`[Execution ${id}] Marked as failed: ${errorMessage}`);
    } catch (err) {
      console.error(`[Execution ${id}] Failed to update error status:`, err);
    }
  }

  /**
   * A stopped run is not a failed one — no report, no defect.
   *
   * Guarded like markAsFailed, and for the same reason: one of its two callers
   * is the LAST handler on the failure path, so a DB blip there used to reject
   * with nobody left to catch it and take the whole process down.
   */
  async markAsInterrupted(id, executionTime) {
    console.log(`[Execution ${id}] Interrupted by user - no report generated`);
    try {
      await pool.query(
        'UPDATE api_execution_history SET execution_status = ?, error_message = ?, response_time_ms = ? WHERE id = ?',
        ['interrupted_by_user', 'Execution interrupted by user', executionTime, id]
      );
    } catch (err) {
      console.error(`[Execution ${id}] Failed to record interruption:`, err.message);
    }
  }
}

// Export singleton instance
module.exports = new QueueWorker();
