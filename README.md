# replayer

Replays a recorded ERP session against a live instance and reports whether it
actually worked.

Two halves, deliberately separated:

```
engine/     the replay engine — runs inside Playwright, one process per execution
src/        the service around it — the HTTP API and the platform callbacks
checks/     behaviour checks for the engine
```

Nothing in `engine/` imports from `src/`, and `src/` reaches `engine/` only by
spawning it as a child process. That boundary is what lets the engine be
debugged by hand — `npx playwright test` with two env vars — without a database,
a queue or an S3 bucket anywhere in sight.

## engine/

```
main.ts           the entry point Playwright runs; owns the step loop
ai-recovery-*.ts  when a step fails, let a model look at the page and unstick it
commit-error-type.ts  name the KIND of problem behind a refused save
transaction-capture.ts  read the identifier the application generated on commit
actions.ts        dispatch for the 22 action types, and the verification after each
locators.ts       resolve a recorded locator against a DOM that has since drifted
normalize.ts      both recording schemas -> one internal shape
settle.ts         adaptive waiting: return as soon as the page is genuinely done
values.ts         read-back and value comparison; also the credential redactor
timeouts.ts       every timeout in one place, classified
types.ts          shared types, including the AppPatch interface
patches/          per-application behaviour
  generic.ts      the base class: what any web app does
  oracle.ts       Oracle Fusion ADF/JET — PPR, LOVs, soft-disable, virtual grids
  index.ts        picks a patch from the recording's URL, or APP_PATCH
```

**`patches/` is the extension point.** Supporting a second ERP means adding one
file that subclasses `GenericPatch` and registering it in `index.ts` — not
touching the engine.

The line is drawn at **mechanics vs evidence**. A patch owns how its widgets
behave: which search terms to type (`lovProbes`), which ARIA roles the list rows
carry (`pickListRow`), what commits a typed value (`commitTypedValue`), what a
refused Save looks like (`collectCommitErrors`). The engine owns what counts as
*proof* that a step worked — and that stays in the engine deliberately, because
it is the safety-critical half and it is the same for every application. Pushing
the evidence rules onto patches would mean re-deriving them, and getting them
wrong, once per vendor.

`checks/run.mjs` pins both halves of that split: the same LOV page is replayed
under `oracle-fusion` and under `generic`, and the retention-is-not-selection
rule must hold under both.

### Timeouts are classified, not just tuned

`timeouts.ts` splits every wait into three kinds, because they fail differently:

- **PATIENCE** — waiting for evidence something arrived. Raising it costs
  nothing when the page is fast; it only helps when Oracle is slow.
- **ABSENCE** — waiting to conclude something is *not* there. This one is paid
  in full on every failure, so it stays short.
- **QUIET** — how long the DOM must be still before a step counts as settled.

Classifying waits ensures adaptive timing rather than fixed sleep intervals.

## src/

```
server.js         entry point: the express app, and nothing else
config/           encrypted-vars manifest
routes/
  replay.routes.js  POST /api/v1/replay — the ONLY way a run starts
platform/
  callbackClient.js the only place this service talks back to the platform,
                    and the one file listing every endpoint it calls
run/
  specRunner.js     spawns engine/main.ts, translates its output back
  healReporter.js   makes a self-healed fix safe to store, then reports it
  aiFixLibrary.js   generalises a fix into a library entry (classifier only)
  errorTypes.js     learned error labels in, learned error labels out
reporting/
  reportGenerator.js  standalone PDF renderer for post-run document generation
  branding.js         which logo goes where, and what to do when one is missing
  assets/             logos drawn into the PDF
utils/            S3 helper, env decryption
```

**Stateless HTTP Execution.** The replayer owns ephemeral browser execution:
runs arrive via `POST /api/v1/replay` with resolved steps inline, and execution
telemetry is transmitted back to the `callbackUrl` provided in the dispatch
payload (integration contract §1, §6).

`specRunner` coordinates with the engine two ways: `@@EVENT {json}` lines on stdout for
live progress, and a `results.json` file that is authoritative at exit. The file
distinguishes a step outcome from process-level interruptions.

## checks/

```bash
pnpm test                   # branding, ai-fix + callback, service, engine checks
node checks/run.mjs lov     # just the engine cases matching "lov"
```

The engine cases run independently against static HTML fixtures in
`checks/pages/`, `branding.mjs` and `ai-fix.mjs` are plain unit checks with no
browser at all, and `service.mjs` boots the server on loopback to verify
clean startup and token enforcement.

A case that names a patch is asserted to have *run* under it. `selectPatch`
falls back to auto-detection when `APP_PATCH` is not a registered name, so
without that assertion a typo would turn an Oracle case into a generic one that
still passed — pinning behaviour it never exercised.

These exist for one reason. Every defect found in this engine so far has been in
the **verification layer** — the code whose whole job is deciding whether a step
really worked. A mistake there does not announce itself; it silently turns a
wrong outcome into a green one, which is the single failure this product cannot
tolerate. So each case is named for the defect it pins down, and asserts the
outcome rather than the implementation.

Three of them (`REGRESSION/lov-retention-is-not-selection`,
`REGRESSION/commit-refusal-outside-the-phrase-list`,
`REGRESSION/absent-committedValue-must-not-skip-fill`) caught bugs introduced by
fixes to *other* bugs. Run them before shipping anything.

Known gap: `src/reporting/` has almost no coverage beyond `branding.mjs`, and
`reportGenerator.js` is ~2,650 lines with two methods over 500 lines each. A
characterization test over its PDF output should come before any attempt to
split it.

## Running it

```bash
pnpm install
cp .env.example .env     # set REPLAYER_SERVICE_TOKEN; that is the only required key
pnpm test                # verify everything, no infrastructure needed
pnpm start               # the HTTP API, on PORT (default 4000)
```

To replay one recording by hand, with no service and no platform at all — the
engine is a pure function of (actions, env), which is what makes this possible:

```bash
JOB_ACTIONS_PATH=./my-recording.json JOB_RESULTS_PATH=./out.json npx playwright test
```

A hand-run is **headed** by default, so you can watch it. The service sets
`PLAYWRIGHT_HEADLESS=true` for its own runs, which is why a server needs no
display; set it yourself to replay headless by hand.

## Configuration

`.env.example` is the complete list, with each variable's real default. It is a
reference; the reasoning that is too long to sit beside a variable lives here.

Exactly one thing is required: `REPLAYER_SERVICE_TOKEN`. Add `ENCRYPTION_KEY`
only if some variable is stored as an `ENC:` ciphertext. Every other variable has
a working default, and there are no database credentials because there is no
database.

One pairing matters more than any default: **`PORT` here and
`platform.replayer.url` on the platform side must move together.** A mismatch
does not raise an error — dispatch simply never arrives, and every run sits in
`QUEUED` looking like a slow replayer instead of a misconfigured one.

### Timeouts

`REPLAY_*` variables map onto the three classes described above — PATIENCE,
ABSENCE, QUIET. Two rules matter more than any individual value:

- **`QUEUE_EXECUTION_TIMEOUT` must stay above `REPLAY_RUN_MAX_MS`.** The worker
  kills the child process at its own ceiling. If that fires first, runs that were
  seconds from finishing are reported as failures. Raise one, raise the other.
- **The run timeout is derived, not configured.** It is the per-step allowance
  times the recorded step count, clamped between `REPLAY_RUN_MIN_MS` and
  `REPLAY_RUN_MAX_MS`. Set `REPLAY_RUN_TIMEOUT_MS` only to override that
  entirely — a fixed value either strangles long recordings or lets short ones
  hang.

### AI features

Three separate features, each independently switchable, each degrading to
"feature off" rather than to a wrong answer:

**Step recovery** (`AI_RECOVERY_ENABLED`) — when a recorded selector fails, a
model is given browser tools and asked to achieve the step's stated goal. Bounded
by attempt and time caps. What it does is written into the report as an audit
trail, and a recovery is only believed after the engine independently re-checks
the page: the model's own verdict is not evidence.

*A credential-bearing step is never sent to a model.* Recorded values are
redacted before anything is logged or transmitted, and the redactor's absence
suppresses output rather than passing it through.

Two transports, chosen with `AI_RECOVERY_METHOD`:

- `cli` — runs the `claude` CLI as a subprocess, billed against a **subscription**.
  No API key. Reuses one session across runs, so later recoveries start with
  context the earlier ones built, and compacts it before it outgrows the window.
  Falls back to the API path if the CLI is not logged in.
- `api` — calls an HTTP API with a key. Anthropic, OpenAI-compatible, or Gemini
  via `AI_RECOVERY_API_PROVIDER`.

The two bill differently. That is the main reason to care which one runs.

**Commit-error classification** (`COMMIT_TYPE_*`) — when an application refuses to
save, it returns sentences rather than codes. Without a label every rejection
lands under one undifferentiated heading and nothing can be counted. Each
distinct message is named once and cached, keyed on the message with its variable
parts masked, so the same rejection never costs twice. Nothing in the code decides
what a message *means* — the masking only decides which messages are the same
message. This path always uses an API key; it has no CLI transport.

**The fix library** — a recovery the engine verified is stored and reused by later
runs, matched on the normalized step label plus a coarse error class, *not* the
raw selector: an application that regenerates element ids per session would never
match on one. A hit costs no model call.

### Product identity

Two prompts need to know which application is being replayed: recovery tells the
model what it is looking at, and classification asks it to label "*product*
validation failures". Given the wrong product both still run, and both quietly
produce worse answers — which is why the value is passed explicitly rather than
inferred.

Resolution order, strongest first:

1. The matched patch's own `productName` — it identified the product from the
   recording's URLs, which beats any assertion made from outside.
2. The `patchId` supplied in the dispatch payload.
3. `PRODUCT_NAME`.

So `PRODUCT_NAME` only takes effect when no patch matched and the run fell back
to `generic`.
