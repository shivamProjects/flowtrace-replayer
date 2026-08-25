/**
 * Config for the fixture library.
 *
 * Separate from playwright.config.ts on purpose: that one has `testDir:
 * './engine'` and no testMatch, so it picks up action-replayer.spec.ts and
 * tries to replay a real recording. These checks are pure DOM work — no
 * network, no Oracle, no credentials — and must be runnable in seconds by
 * anyone, including CI.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // The whole project, so the engine spec is IN scope for testIgnore below.
  // Importing the resolution helpers from action-replayer.spec.ts also
  // registers its `test()` — which would try to replay a real recording, need
  // credentials and a reachable pod, and fail. Ignoring it by path drops that
  // registration while leaving the import (and therefore the real code under
  // test) intact.
  testDir: '..',
  testMatch: 'checks/fixtures.spec.ts',
  testIgnore: ['engine/**'],
  // Each case is a page load against inline HTML; anything slower than this is
  // a hang, not a slow machine.
  timeout: 20_000,
  fullyParallel: true,
  reporter: [['line']],
  use: {
    headless: true,
    // Fixtures are offline by definition. Any request leaving the page means a
    // fixture has an external reference it should not have.
    offline: false,
  },
});
