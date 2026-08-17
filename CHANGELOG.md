# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are grouped by what a reader needs from them: **Security** and
**Breaking** first, because they may require action before upgrading.

## [1.0.0] — baseline

FlowTrace's first version as a named product. The recorder and replayer existed
before this under other names and carried independent version numbers (2.0.0 and
3.2.2); both were reset to 1.0.0 so the suite versions as one thing from here.

Everything below is the work that produced this baseline. It is recorded rather
than discarded because it explains why the code looks the way it does — the
security entries in particular document real defects, not hypothetical ones.

### Security

- **Recorded values could reach the PDF unredacted through AI recovery.** Both
  the CLI and the OpenAI-compatible recovery transports logged
  `type_into <selector> = "<value>"` with no redaction, and those log lines are
  pushed into the `actions[]` audit trail that is rendered into the report. On a
  login step this printed the credential into a document intended for sharing.
  Both transports now take a `redact` hook, and the default when it is absent is
  to **suppress** the value rather than pass it through — an omitted redactor
  can no longer fail open.
- **Report masking covered fewer fields than the engine's.** The PDF matched only
  `password` and `pwd`, so a field named `secret`, `apiKey`, `otp`, `pin` or
  `credential` was printed in clear text. It now uses the same pattern as the
  engine. The engine's own pattern was also missing a bare `pwd`.
- **Execution endpoints were scoped by row id alone.** Authentication proves who
  is calling, not that the row belongs to them. All six queries in the execution
  routes are now scoped by `user_id`, and `/stop` gained an ownership check it
  previously lacked — it passed an unvalidated id straight to the worker.
- **Bound parameter values were logged in clear text.** The queue worker printed
  the resolved value of every parameter bound from an earlier run's output. That
  code runs outside the engine and so has no access to its redactor, meaning the
  value bypassed every masking rule — and a captured output can be a session
  token or a one-time code. Only the parameter name and value length are logged.
- **An unreachable report builder printed secret-named fields unmasked.** It
  masked them in the Script Parameters table but not in a table built by walking
  an arbitrary request body, so `{"auth":{"password":"…"}}` would have rendered
  verbatim. Nothing called it — removed with the rest of the dead code rather
  than fixed, so only one masked code path now exists.

### Breaking

- Environment variables renamed. Old names are **not** read; update `.env`:
  - `ORACLE_TYPE_ENABLED` → `COMMIT_TYPE_ENABLED`
  - `ORACLE_TYPE_MODEL` → `COMMIT_TYPE_MODEL`
  - `ORACLE_TYPE_CACHE_PATH` → `COMMIT_TYPE_CACHE_PATH`
  - `ORACLE_TYPE_CACHE_LIMIT` → `COMMIT_TYPE_CACHE_LIMIT`
- `ORACLE_USERNAME` / `ORACLE_PASSWORD` are now `REPLAY_USERNAME` /
  `REPLAY_PASSWORD`. Unlike the renames above, **the old names are still
  honoured** with a deprecation notice — these are set by hand in a `.env`, and
  silently ignoring them would fail a login with no indication why.
- The stdout event prefix is `@@EVENT` (previously a product-specific string).
  Both sides moved together, so no configuration is involved — but anything
  outside this repository that parsed the old prefix must be updated. A mismatch
  is **silent**: events parse as ordinary stdout and the live view simply stays
  empty while the run proceeds normally.
- A vendor-specific step type emitted by an older recorder was removed. The
  engine replays those recordings through its normal action dispatch, so the step
  type carried no behaviour of its own; recordings containing it still replay.
- `engine/oracle-error-type.ts` is now `engine/commit-error-type.ts`;
  `classifyOracleErrors()` is `classifyCommitErrors()`. Its cache file moved from
  `.oracle-error-types.json` to `.commit-error-types.json` — the old file is not
  read, so the first run after upgrading re-learns its labels.
- Removed the bundled instance health-check and login-step runner. Both were
  copied from a separate application and depended on an in-process replayer this
  project does not have; the health check additionally launched a second
  Chromium. Send login steps as ordinary recorded steps instead.

### Added

- **Vendor abstraction for AI features.** `AppPatch` gained `recoveryHints()`,
  `productName`, `navigationWouldBreakSession()` and `transactionSurfaces()`, so
  the model is told which product it is looking at and which surfaces to read.
  Adding an ERP means writing one patch file and registering it; no file under
  `engine/` changes.
- **Product name travels with the execution.** Selected by the queue worker per
  run and passed to the engine, which prefers a matched patch's own product name
  and falls back to the supplied value. Overridable with `PRODUCT_NAME`.
  Currently a constant in the worker's query because no column holds it yet;
  when one is added, only that one line changes.
- **Transaction identifier capture.** Reads the identifier the application
  generated on commit — from the page title, a confirmation message, or a dialog
  read *before* the click that dismisses it, since the dialog and the number it
  quotes are gone immediately after.
- **Commit-error classification.** When an application refuses to save it returns
  sentences, not codes. Each distinct message is named once ("Duplicate Data",
  "Missing Data") and cached, keyed on the message with its variable parts
  masked, so a repeat costs nothing and failures can be grouped in the report.
- **Cross-run fix library.** A verified recovery is reused by later runs,
  matched on the normalized label plus a coarse error class rather than the raw
  selector — applications that regenerate element ids per session would never
  match otherwise. A cache hit costs no model call at all.
- **Recovery transports and session reuse.** Recovery can run through the
  `claude` CLI against a subscription or through an HTTP API with a key. The CLI
  path reuses one session across runs and compacts it before it outgrows the
  context window.
- **Heal write-back.** A recovery that `verifyRecovered()` independently confirms
  is written back onto the recording, so the next run replays the fix directly.
  Only verified recoveries qualify: the model's own verdict is not evidence.
- `CHANGELOG.md`, plus a `PRODUCT_NAME` entry and per-variable documentation in
  `.env.example`.

### Changed

- `.env.example` is now a reference, not a manual: each variable keeps a short
  comment and its real default, and the long explanations moved to `README.md`.
  Every documented variable was verified to be read by code, and every variable
  read by code to be documented — except the runner-injected `JOB_*` handoff.
- The recovery system prompt is assembled from a vendor-neutral base plus the
  active patch's hints. Previously it hardcoded one ERP's widget behaviour, which
  would have been sent to the model while replaying any other.
- `isTypingEnabled()` → `isErrorClassificationEnabled()`. The old name described
  neither its subject nor its effect.
- The commit-error classification prompt names the product it is labelling
  instead of hardcoding one vendor.
- Recovery tool descriptions no longer name a specific vendor.
- The queue worker keeps a 32-minute execution ceiling, above the Playwright run
  ceiling, so it cannot kill runs that were about to finish.

### Fixed

- **`AI_RECOVERY_API_PROVIDER` had no effect on one code path.** The dispatcher
  honoured both the current and legacy variable names, but the Anthropic
  transport read only the legacy `AI_RECOVERY_PROVIDER`. Setting only the
  current, documented name left that module on `anthropic` regardless of intent.
  Both now share one resolver: current name wins, legacy is honoured with a
  deprecation warning.
- **The generated-identifier pattern matched no digits.** Written as a
  single-quoted JavaScript string, its `\d` escapes collapsed to literal `d`
  characters, so transaction capture searched for runs of the letter `d` and
  silently found nothing.
- **Heals were computed and then dropped.** The engine never wrote the `heals`
  array the runner forwarded and the worker read, and the worker built its heal
  context from the wrong field — leaving it `undefined`, so every heal was
  discarded as unmatchable. A duplicate dead path listened for an event that was
  never emitted.
- **Page-context predicates were rebuilt with `eval()`** in four places, which
  any `script-src` without `unsafe-eval` blocks. Predicates are now inlined as
  real functions, and patterns cross into page context as source strings.
- **The visibility test disagreed with itself.** The copy used by the patch layer
  omitted the off-canvas and clipped-ancestor checks the locator layer applies,
  so a surface scrolled off the document, or inside a collapsed
  `height:0; overflow:hidden` wrapper, was counted as painted and acted on.
- **Commit rejections lost their detail.** A refused save threw an `Error` whose
  only content was a formatted string, so the classifier had to re-parse prose.
  It now carries the structured messages alongside it.
- Two broken `require` paths left by a file move, which would have thrown at
  startup rather than being caught by a type check.
- A missing `require` in the report generator, whose caller was retained — a
  `ReferenceError` on any run that reached it.
- The default report directory resolved against the current working directory,
  so output location depended on how the service was started.
- Removed 665 lines of unreachable code from the report generator (24% of the
  file), including a second PDF builder nothing called, spreadsheet
  export/parsing helpers, and an unreachable duplicate of the screenshot encoder.
  Deleting the second builder also removed a reference to an image file that has
  never existed in the repository, and a duplicated flatten helper.
- The report generator resolved the customer logo with its own copy of the
  shared resolver's logic, missing two of its guards: it did not verify the
  downloaded file landed on disk, and a rejected download propagated instead of
  falling back. It now calls the tested resolver, and takes both logo paths from
  the branding module rather than rebuilding them inline.
- A comment in the value layer described a fix in the past tense that had never
  been applied.
- `PLAYWRIGHT_HEADLESS` is read with opposite defaults by the worker (headless)
  and by the Playwright config (headed). That is intentional — a queued run has
  no display, a hand-run wants watching — but nothing said so, and it reads as a
  bug. Documented on both sides; `.env.example` had it stated backwards.
- The session-expiry message named one vendor's sign-in screen. It now names
  whichever product is being replayed.

### Security notes (unresolved)

- `sharp` below 0.35.0 carries libvips advisories; the fix is a breaking major
  upgrade and has not been taken.
- `xlsx` has prototype-pollution and ReDoS advisories with **no fixed version
  published**. Exploitability here depends on whether it ever parses untrusted
  input — treat spreadsheet input as untrusted until that is confirmed.

[Unreleased]: https://keepachangelog.com/en/1.1.0/
