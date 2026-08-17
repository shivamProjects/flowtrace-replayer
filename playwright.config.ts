import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// The worker inherits the server's environment, but a spec run started directly
// from the CLI does not — without this, .env settings (AI recovery, Oracle
// credentials) are silently missing and the run behaves differently depending
// on how it was launched.
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Desktop Chrome minus its fixed screen metrics. Playwright rejects
// `deviceScaleFactor` alongside a null viewport, so both are dropped here and
// re-applied below only when an explicit viewport is used.
const { viewport: _viewport, deviceScaleFactor: _dsf, ...desktopChrome } = devices['Desktop Chrome'];

/**
 * Recover the window size the flow was RECORDED at.
 *
 * Oracle ADF stamps the recorder's window metrics into its own URLs as
 * `_afrMFW` (width) and `_afrMFH` (height). Replaying at that same size matters
 * because ADF lays out from the viewport: at a smaller one it collapses tabs
 * into overflow menus and virtualises list rows out of the DOM entirely, so
 * recorded selectors miss elements that were simply never rendered.
 *
 * The replay service does the same thing, but only inspects the FIRST navigate
 * step. Recordings often start on a bare hostname that carries no params (and
 * then it silently falls back to 1280x720), so this scans every step and takes
 * the first URL that actually has the metrics.
 */
function recordedViewport(): { width: number; height: number } | null {
  const file = process.env.JOB_ACTIONS_PATH;
  if (!file) return null;
  try {
    const steps = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!Array.isArray(steps)) return null;

    for (const step of steps) {
      const url = step?.url ?? step?.action?.url;
      if (!url) continue;
      try {
        const params = new URL(url).searchParams;
        const width = parseInt(params.get('_afrMFW') ?? '', 10);
        const height = parseInt(params.get('_afrMFH') ?? '', 10);
        // Guard against absurd values from a malformed recording.
        if (width >= 800 && height >= 400 && width <= 8000 && height <= 8000) {
          return { width, height };
        }
      } catch {
        // Not a parseable URL — keep looking.
      }
    }
  } catch {
    // No actions file (or unreadable) — fall through to filling the window.
  }
  return null;
}

/** Steps in the recording this process was launched for, or 0 if unknown. */
function recordedStepCount(): number {
  const file = process.env.JOB_ACTIONS_PATH;
  if (!file) return 0;
  try {
    const steps = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(steps) ? steps.length : 0;
  } catch {
    return 0;
  }
}

function runTimeoutMs(): number {
  const override = parseInt(process.env.REPLAY_RUN_TIMEOUT_MS || '', 10);
  if (Number.isFinite(override) && override > 0) return override;

  // Derived from the engine's own per-step budget, not picked independently.
  // These were set separately and inverted by 9x: the run ceiling allowed 10s
  // per step while the engine authorised 90s, so there was NO step count at
  // which the budgets nested. Four legitimately slow steps in a 30-step flow
  // exhausted a 300s ceiling and the run was killed for being slow, not wrong.
  //
  // Not the full 90s x N either — that is the pathological worst case for every
  // step at once, which no real run hits. A third of it, floored, keeps the
  // ceiling above any realistic run while staying well inside the worker's.
  const stepBudget = parseInt(process.env.REPLAY_STEP_BUDGET_MS || '', 10) || 90_000;
  const perStep = parseInt(process.env.REPLAY_RUN_PER_STEP_MS || '', 10) || Math.round(stepBudget / 3);
  const min = parseInt(process.env.REPLAY_RUN_MIN_MS || '', 10) || 5 * 60 * 1_000;
  const max = parseInt(process.env.REPLAY_RUN_MAX_MS || '', 10) || 25 * 60 * 1_000;

  const steps = recordedStepCount();
  // Unknown step count (a manual run with no actions file) gets the floor.
  const derived = steps > 0 ? steps * perStep : min;
  const ms = Math.min(Math.max(derived, min), max);
  console.log(`[run-timeout] ${Math.round(ms / 1000)}s for ${steps || 'unknown'} step(s)`);
  return ms;
}

const RECORDED_VIEWPORT = recordedViewport();
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === 'true';

// Default: fill the browser window, so the replay looks like the app does when
// you open the URL yourself. Recorded metrics are then used only as a FLOOR for
// the headless window size — never as a ceiling — because a viewport larger
// than the recording is harmless to ADF (more rows render, fewer overflow
// menus), while a smaller one hides elements the recording expects.
//
// Set MATCH_RECORDED_VIEWPORT=true to pin the viewport to the recorded size
// instead, for bug-for-bug reproduction of how the flow was captured.
const MATCH_RECORDED = process.env.MATCH_RECORDED_VIEWPORT === 'true' && RECORDED_VIEWPORT !== null;

const HEADLESS_WINDOW = {
  width: Math.max(RECORDED_VIEWPORT?.width ?? 0, 1920),
  height: Math.max(RECORDED_VIEWPORT?.height ?? 0, 1080),
};

console.log(
  MATCH_RECORDED
    ? `[viewport] pinned to recording: ${RECORDED_VIEWPORT!.width}x${RECORDED_VIEWPORT!.height}`
    : HEADLESS
      ? `[viewport] filling headless window: ${HEADLESS_WINDOW.width}x${HEADLESS_WINDOW.height}`
      : '[viewport] filling maximised browser window'
);

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Whole-run ceiling, DERIVED FROM THE SCRIPT rather than fixed.
  //
  // One number cannot serve both a 21-step flow and a 200-step one: sized for
  // the long script it is absurdly generous for the common case, and sized for
  // the common case it kills the long one. So it scales with step count and is
  // clamped at both ends.
  //
  // Baseline from the last 300 successful runs (median 21 steps / 91s, p90
  // 39 / 292s, p99 67 / 903s, max 90 steps): that is ~4.3s per step at the
  // median and ~7.5s at p90 — under the OLD engine, which slept a fixed ~700ms
  // per step plus 6s per commit. The allowance below is therefore already
  // generous against those figures, and adaptive settling should make it more
  // so. It is a ceiling, not a target: a run that hits it is broken.
  timeout: runTimeoutMs(),
  // This is a replay PRODUCT, not a test suite. Playwright Test is used as the
  // browser driver and process host — `engine/main.ts` is the entry point it
  // runs, and `testMatch` is pinned to it so the engine and patch modules
  // sitting alongside are never mistaken for suites of their own.
  //
  // testDir is the engine directory, so `main.ts` and the modules it imports
  // are resolved relative to this config rather than to whatever directory the
  // service happened to be started from.
  testDir: './engine',
  testMatch: 'main.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Visible by default so you can watch a manual replay. The queue worker
    // sets PLAYWRIGHT_HEADLESS=true so server-side runs need no display.
    headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
    // The worker takes its own per-step screenshots (step_<N>.png) for the PDF,
    // so Playwright's own artefacts are redundant noise in job mode.
    screenshot: process.env.JOB_ACTIONS_PATH ? 'off' : 'on',
    video: process.env.JOB_ACTIONS_PATH ? 'off' : 'on',
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.JOB_ACTIONS_PATH ? 'off' : 'on',

    /* Oracle Fusion is slow – allow 90 s per action and 2 min per navigation. */
    actionTimeout: 90_000,
    navigationTimeout: 120_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...desktopChrome,
        // Use the full local Chromium build rather than the separate
        // chrome-headless-shell download. Headless runs then reuse the same
        // browser a headed run uses, so there is only one binary to install.
        channel: 'chromium',

        // null viewport = the page fills the browser window, instead of being
        // pinned to a fixed box with grey space around it.
        ...(MATCH_RECORDED
          ? { viewport: RECORDED_VIEWPORT!, deviceScaleFactor: 1 }
          : { viewport: null }),

        launchOptions: {
          args: [
            // Same flags the replay service launches with. --disable-gpu is the
            // one that matters on a Mac: without it, compositing a full-screen
            // Retina window on the GPU makes the display flicker while a replay
            // runs. Software rendering is slightly slower but stable, and the
            // replay service has run this way without the problem.
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',

            ...(HEADLESS
              // Headless has no window manager to maximise against, so size the
              // window explicitly (never below what the flow was recorded at).
              ? [`--window-size=${HEADLESS_WINDOW.width},${HEADLESS_WINDOW.height}`]
              : ['--start-maximized']),
          ],
        },
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
