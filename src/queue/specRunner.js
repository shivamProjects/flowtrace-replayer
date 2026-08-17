/**
 * SpecRunner — the bridge between the queue worker and the replay engine.
 *
 * The engine is a Playwright test (`engine/main.ts`), not an in-process library,
 * so this module runs it as a CHILD PROCESS — one per execution — and translates
 * its output back into the shape the worker and report generator expect. Process
 * isolation is the point: a browser crash or an OOM takes down one execution
 * rather than the whole service.
 *
 * The contract it exposes:
 *
 *     const runner = new SpecRunner(executionId);
 *     runner.on('log' | 'step-start' | 'step-end' | 'done', handler);
 *     const { success, error, results, outputs } = await runner.replay(actions, opts);
 *     await runner.close();
 *
 * so the worker code below it is a straight port, not a rewrite.
 *
 * How the two halves talk:
 *   worker → spec   via env vars (JOB_ACTIONS_PATH / JOB_SCREENSHOT_DIR / …)
 *   spec   → worker via `@@EVENT {json}` lines on stdout (live) and a
 *                     results.json file (authoritative, read at exit)
 */

const { spawn } = require("child_process");
const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { loadCache: loadErrorTypeCache } = require("./errorTypeStore");

const PROJECT_ROOT = path.join(__dirname, "..", "..");
// Relative to PROJECT_ROOT, matching playwright.config.ts `testDir: './engine'`.
const SPEC_PATH = "engine/main.ts";

// Width the live frames are downscaled to before they go on the wire. The spec
// captures at the browser's real resolution (3024px on a retina runner, 100-450KB
// per PNG), which is for the PDF — a person watching the run in a browser pane
// gains nothing from it. 1200px costs ~5x less and still reads clearly.
const LIVE_SCREENSHOT_WIDTH = parseInt(process.env.LIVE_SCREENSHOT_WIDTH || "1200", 10);

// Format for the live frames. JPEG beats PNG on both axes that matter here —
// measured on real captures at 1200px: 15ms/26KB against 49ms/61KB — because
// palette PNG spends its time quantising colours for a losslessness the live
// view does not need. The PDF is untouched and still re-encodes from the
// original files at print resolution.
//
// Overridable because the frame is rendered by a frontend this service does not
// own: if a UI hard-codes `data:image/png`, set LIVE_SCREENSHOT_FORMAT=png to
// put it back without a redeploy. 'webp' is smaller again (11KB) at 32ms, for
// browsers known to support it.
const LIVE_SCREENSHOT_FORMAT = (process.env.LIVE_SCREENSHOT_FORMAT || "jpeg").toLowerCase();
const LIVE_SCREENSHOT_QUALITY = parseInt(process.env.LIVE_SCREENSHOT_QUALITY || "72", 10);

// Marker styling, kept identical to the recorder's so a step looks the same
// whether it is being recorded or replayed —
// recorder/lib/step-image-processing.js:27.
const HL_STROKE = "#22c55e";            // green outline
const HL_FILL = "rgba(34,197,94,0.05)"; // barely-there green tint
const HL_BORDER_PX = 0.75;              // thin border, in page px
const HL_PADDING_PX = 4;                // breathing room around the element, in page px

// Marker the spec prefixes its machine-readable lines with.
const EVENT_PREFIX = "@@EVENT ";

/**
 * Spec events that reach the stream ONLY through their action:* equivalent.
 *
 * Each of these used to go out twice — once raw, once translated by
 * _emitLegacy — so every step cost two messages describing the same thing. The
 * translated shape is the one kept, with the raw shape's extra fields folded
 * into it, so nothing is lost by dropping the duplicate.
 *
 * This filters the SSE firehose only. The named emit is untouched, because the
 * worker's own step logging listens on `step-start` / `step-end` directly.
 *
 * `step-preview` is here for a different reason: it is an internal cue to go and
 * read live_<N>.png, and its rect/viewportWidth are consumed here rather than by
 * any client. The frame it produces is what belongs on the stream.
 */
const STREAM_ONLY_AS_LEGACY = new Set([
  "step-start",
  "step-end",
  "step-preview",
  // The recovery events say the same thing as their activity line and nothing
  // more. `heal` is deliberately NOT here: it carries the actual fix Claude
  // wrote, which is worth having on the wire for debugging.
  "recovery-start",
  "recovery-end",
  "recovery-skipped",
]);

/**
 * Resolve the Playwright CLI entrypoint so it can be run as `node <cli.js>`.
 *
 * Going through `npx playwright` depends on PATH and on the node_modules/.bin
 * shim being executable — neither is guaranteed on a locked-down server, where
 * the shim fails with EACCES / "bad interpreter". Resolving the real file and
 * spawning the current node binary avoids both.
 */
function resolvePlaywrightCli() {
  try {
    return require.resolve("@playwright/test/cli");
  } catch (_) {
    try {
      const pkgPath = require.resolve("@playwright/test/package.json");
      return path.join(path.dirname(pkgPath), "cli.js");
    } catch (_) {
      return null;
    }
  }
}

class SpecRunner extends EventEmitter {
  constructor(executionId) {
    super();
    this.executionId = String(executionId);
    this.child = null;
    this.stopped = false;
    this.jobDir = null;
    this.screenshotDir = null;
    this.totalSteps = 0;
    // Serialises the (async) frame encoding — see _emitScreenshot.
    this.shotQueue = Promise.resolve();
    // index → recorded description. step-end and the recovery events carry only
    // an index, so the readable name has to be remembered from step-start.
    this.stepLabels = new Map();
  }

  _log(message, level = "info") {
    this.emit("log", { message, level });
  }

  /**
   * One line of the live activity log — the human-readable narration of the run.
   *
   * Separate from `log` on purpose. `log` is the spec's raw stdout: selectors,
   * [diag] lines, Playwright's own chatter. Useful when something breaks, and
   * unreadable as a running commentary. This channel is the commentary — one
   * line per thing that happened, in the words a person would use, numbered
   * against the total so the reader knows how far in they are.
   *
   *   { type:'activity', step, totalSteps, text, status, actor, durationMs, error }
   *
   *   status  'running' | 'success' | 'warn' | 'failed'
   *   actor   'replay' — the recorded script drove this
   *           'ai'     — AI recovery drove this, after the recorded step failed
   */
  _emitActivity(fields) {
    this.emit("event", {
      type: "activity",
      totalSteps: this.totalSteps,
      actor: "replay",
      timestamp: Date.now(),
      ...fields,
    });
  }

  /**
   * What to call a step in the log.
   *
   * The recorded description ("Click Expand Lines") is what a person wants to
   * read. Only when a step has none does the action name stand in, spaced out
   * and capitalised — never the selector, which is what makes the raw log
   * unreadable.
   */
  _stepLabel(index, payload) {
    if (payload && payload.description) {
      this.stepLabels.set(index, payload.description);
      return payload.description;
    }
    const remembered = this.stepLabels.get(index);
    if (remembered) return remembered;

    const action = (payload && payload.action) || "step";
    const spaced = String(action).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  /**
   * Re-emit each step event in the shape the original replay service used, so a
   * frontend written against that service works against this one unchanged:
   *
   *   action:start    { step, stepIndex, totalSteps, description, details, timestamp }
   *   action:complete { step, stepIndex, totalSteps, status, description, error, timestamp }
   *   screenshot      { step, screenshot: <base64 png>, error, timestamp }
   *
   * The screenshot is read from disk rather than carried through the child's
   * stdout — the spec has already written step_<N>.png, and a 40KB base64 blob
   * per step would make the line protocol slow and fragile.
   */
  _emitLegacy(payload) {
    const { type } = payload;

    if (type === "start") {
      this.totalSteps = payload.totalSteps || 0;
      this._emitActivity({
        step: 0,
        text: `Starting replay — ${this.totalSteps} step${this.totalSteps === 1 ? "" : "s"}`,
        status: "running",
      });
      return;
    }

    if (type === "done") {
      this._emitActivity({
        step: this.totalSteps,
        text: payload.success
          ? "Replay finished — every step passed"
          : `Replay stopped — ${payload.error || "a step failed"}`,
        status: payload.success ? "success" : "failed",
      });
      return;
    }

    // The spec photographed the page with this step's target outlined, just
    // before acting on it. Live viewers only — it is not in the PDF.
    if (type === "step-preview") {
      this._emitScreenshot(payload.index, false, {
        preview: true,
        rect: payload.rect,
        viewportWidth: payload.viewportWidth,
      });
      return;
    }

    if (type === "step-start") {
      const legacy = {
        step: payload.index + 1,
        stepIndex: payload.index,
        totalSteps: this.totalSteps,
        description: payload.description || payload.action,
        details: { action: payload.action, description: payload.description },
        timestamp: Date.now(),
      };
      this.emit("action:start", legacy);
      this.emit("event", { type: "action:start", ...legacy });

      this._emitActivity({
        step: payload.index + 1,
        text: this._stepLabel(payload.index, payload),
        status: "running",
      });
      return;
    }

    if (type === "step-end") {
      const legacy = {
        step: payload.index + 1,
        stepIndex: payload.index,
        totalSteps: this.totalSteps,
        status: payload.status,
        description: payload.description || "",
        error: payload.error || null,
        // Carried over from the spec's own step-end, which no longer reaches the
        // stream on its own — without these, collapsing the two shapes into one
        // would have quietly dropped them.
        duration: payload.duration ?? null,
        ...(payload.viaAi ? { viaAi: true } : {}),
        ...(payload.recovered ? { recovered: true } : {}),
        ...(payload.summary ? { summary: payload.summary } : {}),
        timestamp: Date.now(),
      };
      this.emit("action:complete", legacy);
      this.emit("event", { type: "action:complete", ...legacy });

      this._emitActivity({
        step: payload.index + 1,
        text: this._stepLabel(payload.index, payload),
        status: payload.status,
        // A step carried by a stored AI fix was not driven by the recording.
        actor: payload.viaAi || payload.recovered ? "ai" : "replay",
        durationMs: payload.duration ?? null,
        error: payload.error || null,
      });

      // The spec writes step_<N>.png after every step, pass or fail.
      this._emitScreenshot(payload.index, payload.status === "failed");
      return;
    }

    /* ── Claude self-healing, narrated in the first person of the product ── */

    if (type === "recovery-start") {
      this._emitActivity({
        step: payload.index + 1,
        text: `Working out how to complete "${this._stepLabel(payload.index, payload)}"`,
        status: "running",
        actor: "ai",
      });
      return;
    }

    if (type === "recovery-end") {
      const label = this._stepLabel(payload.index, null);
      this._emitActivity({
        step: payload.index + 1,
        text: payload.recovered
          ? `Recovered "${label}"` + (payload.summary ? ` — ${payload.summary}` : "")
          : `Could not recover "${label}"` + (payload.summary ? ` — ${payload.summary}` : ""),
        status: payload.recovered ? "success" : "failed",
        actor: "ai",
      });
      return;
    }

    if (type === "heal") {
      this._emitActivity({
        step: payload.index + 1,
        text: `Saved the fix for "${this._stepLabel(payload.index, payload)}" so it works next time`,
        status: "success",
        actor: "ai",
      });
      return;
    }

    if (type === "recovery-skipped") {
      // The two reasons are not the same story. An opt-out is a choice someone
      // made about this step; an Oracle rejection means the page itself said no,
      // and saying "opted out of AI" there sends the reader looking for a flag
      // that was never set.
      const label = this._stepLabel(payload.index, null);

      if (payload.reason === "oracle-validation-error") {
        const messages = Array.isArray(payload.messages) ? payload.messages.filter(Boolean) : [];
        // The classifier's label leads when there is one — a reader wants the
        // KIND of problem first and the specifics under it. Without a label the
        // headline has to carry the sense on its own.
        const headline = payload.errorType
          ? `${payload.errorType} on "${label}"`
          : `Oracle rejected the data on "${label}"`;

        this._emitActivity({
          step: payload.index + 1,
          // Rendered bold by the log when `details` is non-empty, because it is
          // then a heading rather than a sentence.
          text: headline,
          details: messages.length ? messages : (payload.message ? [payload.message] : []),
          status: "warn",
          actor: "replay",
        });
        return;
      }

      this._emitActivity({
        step: payload.index + 1,
        text: `Skipping recovery for "${label}" — this step opted out of AI`,
        status: "warn",
        actor: "ai",
      });
      return;
    }
  }

  /**
   * @param {number}  index    zero-based step index
   * @param {boolean} isError  whether the step failed
   * @param {Object}  opts     { preview, rect, viewportWidth } — a preview is
   *                           the frame captured BEFORE the step ran
   *                           (live_<N>.png), with the target element marked,
   *                           rather than the after-shot the report uses.
   */
  _emitScreenshot(index, isError, opts = {}) {
    if (!this.screenshotDir) return;
    const preview = Boolean(opts.preview);
    const file = path.join(this.screenshotDir, `${preview ? "live" : "step"}_${index}.png`);
    if (!fs.existsSync(file)) return;

    // Encoding is async, so the frames are chained rather than fired off in
    // parallel: a small screenshot must not overtake a large one and land the
    // viewer's steps out of order.
    this.shotQueue = this.shotQueue
      .then(async () => {
        const frame = await this._encodeLiveFrame(file, opts.rect, opts.viewportWidth);
        const shot = {
          step: index + 1,
          screenshot: frame.buffer.toString("base64"),
          // Say what the bytes actually are, so the frontend can build the data
          // URL from this instead of assuming a format.
          mimeType: frame.mimeType,
          error: Boolean(isError),
          // True = "about to do this", with the target outlined in green. The
          // after-shot for the same step follows with preview:false, so a UI
          // can either replace it or keep both.
          preview,
          highlighted: preview,
          timestamp: Date.now(),
        };
        this.emit("screenshot", shot);
        this.emit("event", { type: "screenshot", ...shot });
      })
      // A missing or unreadable frame must never take the run down.
      .catch((err) => {
        this._log(`Could not stream screenshot for step ${index + 1}: ${err.message}`, "warn");
      });
  }

  /**
   * The marker, as an SVG overlay sized to the FINAL image.
   *
   * Drawn after the downscale, not before, so the stroke is never resampled —
   * a border drawn at capture size and then shrunk lands between pixels and
   * looks fuzzy. This is a port of the recorder's canvas version
   * (recorder/lib/step-image-processing.js:146), down to the
   * half-pixel nudge on odd stroke widths, so a marked step looks the same in a
   * replay as it does in a recording.
   *
   * @returns {Buffer|null} SVG to composite, or null if there is nothing to draw
   */
  _highlightSvg(rect, viewportWidth, sourceWidth, outWidth, outHeight) {
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) return null;

    // Derive page-px -> image-px from the image itself rather than trusting
    // deviceScaleFactor, which is wrong under browser zoom.
    const shrink = sourceWidth > 0 ? outWidth / sourceWidth : 1;
    const pageToImage = viewportWidth > 0 ? sourceWidth / viewportWidth : 1;
    const k = pageToImage * shrink;

    // A fractional line width gets antialiased across two pixels. Round to
    // whole pixels, then nudge odd widths by half a pixel so the stroke sits ON
    // the pixel grid rather than straddling it.
    const lw = Math.max(1, Math.round(HL_BORDER_PX * k));
    const pad = Math.round(HL_PADDING_PX * k);

    // Grow the box outwards by the padding, clamped to the image so an element
    // near an edge doesn't push the border off-canvas.
    const x = Math.max(0, Math.round(rect.x * k) - pad);
    const y = Math.max(0, Math.round(rect.y * k) - pad);
    const w = Math.min(outWidth, Math.round((rect.x + rect.w) * k) + pad) - x;
    const h = Math.min(outHeight, Math.round((rect.y + rect.h) * k) + pad) - y;
    if (w <= 0 || h <= 0) return null;

    const off = (lw % 2) / 2;

    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}">` +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${HL_FILL}"/>` +
        `<rect x="${x + off}" y="${y + off}" width="${w}" height="${h}" ` +
        `fill="none" stroke="${HL_STROKE}" stroke-width="${lw}"/>` +
      `</svg>`
    );
  }

  /**
   * Downscale, mark, and re-encode one capture for the live stream.
   *
   * @param {string} file           source PNG on disk
   * @param {Object} [rect]         element box in viewport CSS px, if it is a preview
   * @param {number} [viewportWidth] page width in CSS px, for the scale factor
   * @returns {Promise<{buffer: Buffer, mimeType: string}>}
   */
  async _encodeLiveFrame(file, rect, viewportWidth) {
    try {
      let resized;

      if (rect) {
        const meta = await sharp(file).metadata();
        const srcWidth = meta.width || LIVE_SCREENSHOT_WIDTH;
        // `withoutEnlargement` leaves an already-small capture at its own size,
        // so the output size cannot be assumed from LIVE_SCREENSHOT_WIDTH.
        const outWidth = Math.min(srcWidth, LIVE_SCREENSHOT_WIDTH);
        const outHeight = Math.max(1, Math.round((meta.height * outWidth) / srcWidth));

        // Resize to dimensions computed here rather than letting sharp round
        // its own way: an overlay even one pixel taller than the base image is
        // rejected outright by composite().
        resized = sharp(file).resize({ width: outWidth, height: outHeight, fit: "fill" });

        const svg = this._highlightSvg(rect, viewportWidth, srcWidth, outWidth, outHeight);
        if (svg) resized = resized.composite([{ input: svg, top: 0, left: 0 }]);

      } else {
        resized = sharp(file).resize({
          width: LIVE_SCREENSHOT_WIDTH,
          withoutEnlargement: true,
        });
      }

      if (LIVE_SCREENSHOT_FORMAT === "webp") {
        return {
          buffer: await resized.webp({ quality: LIVE_SCREENSHOT_QUALITY }).toBuffer(),
          mimeType: "image/webp",
        };
      }

      if (LIVE_SCREENSHOT_FORMAT === "png") {
        try {
          // Palette needs libimagequant inside sharp's libvips, which a
          // hand-built sharp on some server may not have.
          return {
            buffer: await resized.clone().png({ palette: true, compressionLevel: 9, effort: 6 }).toBuffer(),
            mimeType: "image/png",
          };
        } catch (_) {
          return {
            buffer: await resized.clone().png({ compressionLevel: 9 }).toBuffer(),
            mimeType: "image/png",
          };
        }
      }

      // mozjpeg costs ~13ms more than baseline JPEG and returns ~25% of the
      // bytes for it. Worth taking: these frames cross the internet to whoever
      // is watching, while the CPU they cost sits on a runner that is idle
      // between steps anyway. It also keeps the change strictly better than the
      // PNG it replaces on BOTH axes — baseline JPEG is faster still, but
      // slightly larger than palette PNG on text-heavy screens.
      return {
        buffer: await resized.jpeg({ quality: LIVE_SCREENSHOT_QUALITY, mozjpeg: true }).toBuffer(),
        mimeType: "image/jpeg",
      };

    } catch (err) {
      // Never lose the frame over an encoding problem — send it as captured.
      this._log(`Live frame encode failed (${err.message}) — sending the original`, "warn");
      return { buffer: fs.readFileSync(file), mimeType: "image/png" };
    }
  }

  /**
   * Run one execution.
   *
   * @param {Array}  actions  recorded steps (already param-injected by the worker)
   * @param {Object} options  { headless, screenshotDir, timeout, aiRecovery }
   *                          aiRecovery:false disables Claude self-healing for
   *                          THIS run only, whatever the server's .env says.
   * @returns {Promise<{success:boolean, error:string|null, results:Array, outputs:Object}>}
   */
  async replay(actions, options = {}) {
    // Resolve to an ABSOLUTE path. The worker passes a relative "report/<id>",
    // which would otherwise be interpreted against whatever cwd the service was
    // started with — a difference between running by hand and running under a
    // process manager, and a silent one.
    const screenshotDir = path.resolve(
      options.screenshotDir || path.join(PROJECT_ROOT, "report", this.executionId)
    );

    // Job scratch files live beside the screenshots so everything for one
    // execution is under report/<id>/ and dies with it.
    this.screenshotDir = screenshotDir;
    this.jobDir = path.join(screenshotDir, "_job");
    fs.mkdirSync(this.jobDir, { recursive: true });

    const actionsPath = path.join(this.jobDir, "actions.json");
    const resultsPath = path.join(this.jobDir, "results.json");
    fs.writeFileSync(actionsPath, JSON.stringify(actions, null, 2), "utf-8");

    // Hand the spec the Oracle error labels already known, so it only pays the
    // API for messages nobody has seen. Best-effort — without it the spec works
    // the labels out fresh, which costs a call, not a run.
    let errorTypeCachePath = null;
    try {
      errorTypeCachePath = await loadErrorTypeCache(this.jobDir);
    } catch (err) {
      this._log(`Could not load Oracle error labels: ${err.message}`, "warn");
    }

    // A stale results.json from a previous attempt would be read as this run's
    // outcome if the spec died before writing — remove it up front.
    if (fs.existsSync(resultsPath)) fs.unlinkSync(resultsPath);

    // ── diagnostics ─────────────────────────────────────────────────────
    // Everything needed to tell a path/permission problem apart from a genuine
    // replay failure, without having to reproduce the run by hand.
    this._log(`[diag] parent cwd     : ${process.cwd()}`);
    this._log(`[diag] PROJECT_ROOT   : ${PROJECT_ROOT}`);
    this._log(`[diag] screenshotDir  : ${screenshotDir}`);
    this._log(`[diag] jobDir         : ${this.jobDir} (exists=${fs.existsSync(this.jobDir)})`);
    this._log(`[diag] actionsPath    : ${actionsPath} (exists=${fs.existsSync(actionsPath)}, ${actions.length} actions)`);
    this._log(`[diag] spec file      : ${path.join(PROJECT_ROOT, SPEC_PATH)} (exists=${fs.existsSync(path.join(PROJECT_ROOT, SPEC_PATH))})`);
    this._log(`[diag] node           : ${process.execPath} (${process.version})`);

    const env = {
      ...process.env,
      JOB_ACTIONS_PATH: actionsPath,
      JOB_SCREENSHOT_DIR: screenshotDir,
      JOB_RESULTS_PATH: resultsPath,
      JOB_EXECUTION_ID: this.executionId,
      PLAYWRIGHT_HEADLESS: options.headless === false ? "false" : "true",
      // The html reporter starts a server and can block process exit; `line`
      // keeps stdout clean for parsing and always terminates.
      FORCE_COLOR: "0",
      // The spec reads AI_RECOVERY_ENABLED from its own environment, and the
      // child inherits the server's. An explicit `false` here overrides that
      // for this run only, without touching .env or affecting the worker.
      ...(options.aiRecovery === false ? { AI_RECOVERY_ENABLED: "false" } : {}),
      // Its presence is also the signal that the worker owns persistence, so
      // the spec emits what it learns instead of writing a file nothing reads.
      ...(errorTypeCachePath ? { COMMIT_TYPE_CACHE_PATH: errorTypeCachePath } : {}),
      // The product this script automates, from the execution row. The engine
      // prefers its own patch's productName and reads this only as a fallback,
      // so a stale value here cannot override a matched patch.
      ...(options.productName ? { JOB_PRODUCT_NAME: options.productName } : {}),
    };

    const testArgs = [
      "test",
      SPEC_PATH,
      "--reporter=line",
      "--workers=1",
      // One attempt only: a retry would re-run the flow against Oracle and
      // overwrite results.json / the screenshots with the second attempt.
      "--retries=0",
    ];

    // Prefer `node <cli.js>`; fall back to npx only if the package can't be
    // resolved (e.g. a hoisted install this process can't see).
    const cli = resolvePlaywrightCli();
    const command = cli ? process.execPath : "npx";
    const args = cli ? [cli, ...testArgs] : ["playwright", ...testArgs];

    this._log(`[diag] playwright cli : ${cli || "(not resolved — falling back to npx)"}`);
    this._log(`[diag] child cwd      : ${PROJECT_ROOT}`);
    this._log(`[diag] JOB_ACTIONS_PATH=${env.JOB_ACTIONS_PATH}`);
    this._log(`[diag] JOB_SCREENSHOT_DIR=${env.JOB_SCREENSHOT_DIR}`);
    this._log(`[diag] JOB_RESULTS_PATH=${env.JOB_RESULTS_PATH}`);
    this._log(`[diag] PLAYWRIGHT_HEADLESS=${env.PLAYWRIGHT_HEADLESS} DISPLAY=${env.DISPLAY || "(unset)"}`);
    this._log(`Spawning: ${command} ${args.join(" ")}`);

    const startedAt = Date.now();
    const exitInfo = await this._spawnAndStream(command, args, env, options.timeout);
    this._log(`[diag] child exited code=${exitInfo.code} after ${Date.now() - startedAt}ms`);
    this._log(`[diag] results.json exists=${fs.existsSync(resultsPath)}`);

    // results.json is authoritative — it distinguishes a genuine step failure
    // from the process being killed or crashing before it ever started.
    let parsed = null;
    try {
      if (fs.existsSync(resultsPath)) {
        parsed = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
      }
    } catch (err) {
      this._log(`Could not parse results.json: ${err.message}`, "warn");
    }

    if (!parsed) {
      // No results file means the spec died before it could write one. Dump
      // everything it printed — the reporter's closing summary (which is all a
      // short tail captures) never says WHY.
      this._log("──────── spec produced no results — full output ────────", "error");
      (exitInfo.allLines || []).forEach((l) => this._log(`  | ${l}`, "error"));
      this._log("───────────────────────────────────────────────────────", "error");

      const reason = this.stopped
        ? "Execution stopped by user"
        : exitInfo.timedOut
          ? "Spec timed out before producing results"
          : `Spec produced no results (exit code ${exitInfo.code})${exitInfo.tail ? " — " + exitInfo.tail : ""}`;

      return { success: false, error: reason, results: [], outputs: {}, transactionInfo: null, heals: [] };
    }

    return {
      success: Boolean(parsed.success) && !this.stopped,
      error: this.stopped ? "Execution stopped by user" : parsed.error || null,
      results: Array.isArray(parsed.results) ? parsed.results : [],
      heals: Array.isArray(parsed.heals) ? parsed.heals : [],
      outputs: parsed.outputs && typeof parsed.outputs === "object" ? parsed.outputs : {},
      // The identifier the transaction ended up with, probed for by the spec
      // around its commit steps. The worker hands this straight to the report,
      // which renders it as a summary row when a number was found.
      transactionInfo:
        parsed.transactionInfo && typeof parsed.transactionInfo === "object"
          ? parsed.transactionInfo
          : null,
      heals: Array.isArray(parsed.heals) ? parsed.heals : [],
    };
  }

  /**
   * Spawn the child and forward its output line-by-line. Resolves when the
   * process exits — it never rejects, because a non-zero exit is a normal
   * outcome here (a failed step), not an error to throw on.
   */
  _spawnAndStream(command, args, env, timeoutMs) {
    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd: PROJECT_ROOT, env });
      this.child = child;

      let stdoutBuf = "";
      let stderrBuf = "";
      let timedOut = false;
      // Keep the last few lines so an early crash can be reported with context
      // instead of a bare exit code.
      const recentLines = [];
      // Full transcript, capped so a chatty run cannot exhaust memory.
      const allLines = [];

        const killTimer = timeoutMs
          ? setTimeout(() => {
              timedOut = true;
              this._log(`Timeout after ${timeoutMs}ms — stopping spec process`, "error");
              child.kill("SIGTERM");
              // unref: a pending SIGKILL timer must not be the thing keeping
              // this process alive after the child has already gone.
              setTimeout(() => {
                if (this.child && this.child.exitCode === null) {
                  this.child.kill("SIGKILL");
                }
              }, 8_000).unref();
            }, timeoutMs)
          : null;

      // Resolve exactly once. 'close' is the normal path, but a spawn failure
      // (ENOENT, EACCES on the CLI) emits 'error' and is NOT guaranteed to emit
      // 'close' — and this promise never rejects, so without a fallback the
      // await in replay() hung forever, the execution sat 'in_execution' and its
      // concurrency slot was never released.
      let settled = false;
      const finish = (code) => {
        if (settled) return;
        settled = true;
        if (killTimer) clearTimeout(killTimer);
        // Flush whatever was left without a trailing newline.
        if (stdoutBuf) handleLine(stdoutBuf);
        if (stderrBuf) handleLine(stderrBuf);
        this.child = null;
        this._log(`Spec process exited with code ${code}`);
        resolve({ code, timedOut, tail: recentLines.slice(-3).join(" | "), allLines });
      };

      const handleLine = (line) => {
        if (!line) return;

        if (line.startsWith(EVENT_PREFIX)) {
          try {
            const payload = JSON.parse(line.slice(EVENT_PREFIX.length));
            const { type, ...rest } = payload;
            // Named emit — the worker's logging, heal write-back and usage
            // accounting all listen here. Never filtered.
            this.emit(type, rest);       // step-start / step-end / start / done / ai-usage
            if (!STREAM_ONLY_AS_LEGACY.has(type)) {
              this.emit("event", payload); // single firehose for the SSE route
            }
            this._emitLegacy(payload);   // action:start / action:complete / screenshot
            return;
          } catch (_) {
            // Malformed marker line — fall through and treat it as plain output.
          }
        }

        recentLines.push(line);
        if (recentLines.length > 20) recentLines.shift();
        if (allLines.length < 400) allLines.push(line);
        this._log(line);
      };

      const drain = (chunk, isErr) => {
        const text = chunk.toString();
        if (isErr) {
          stderrBuf += text;
        } else {
          stdoutBuf += text;
        }
        const buf = isErr ? stderrBuf : stdoutBuf;
        const lines = buf.split(/\r?\n/);
        // Last element is a partial line — keep it buffered for the next chunk.
        const remainder = lines.pop();
        if (isErr) {
          stderrBuf = remainder;
        } else {
          stdoutBuf = remainder;
        }
        lines.forEach(handleLine);
      };

      child.stdout.on("data", (c) => drain(c, false));
      child.stderr.on("data", (c) => drain(c, true));

      child.on("error", (err) => {
        this._log(`Failed to start spec process: ${err.message}`, "error");
        recentLines.push(err.message);
        allLines.push(`SPAWN ERROR: ${err.message}`);
        // Give 'close' a moment to arrive on its own; finish() is idempotent.
        setTimeout(() => finish(child.exitCode === null ? -1 : child.exitCode), 1_000).unref();
      });

      child.on("close", (code) => finish(code));
    });
  }

  /** Stop a running execution — used by the /stop endpoint. */
  async close() {
    this.stopped = true;
    if (this.child && this.child.exitCode === null) {
      this._log("Stop requested — terminating spec process", "warn");
      try {
        this.child.kill("SIGTERM");
        // Playwright can hold the browser open; escalate if it ignores SIGTERM.
        // unref: a pending SIGKILL timer must not keep this process alive after
        // the child has already gone.
        setTimeout(() => {
          if (this.child && this.child.exitCode === null) {
            try { this.child.kill("SIGKILL"); } catch (_) {}
          }
        }, 5_000).unref();
      } catch (err) {
        this._log(`Kill failed: ${err.message}`, "error");
      }
    }
  }
}

module.exports = SpecRunner;
