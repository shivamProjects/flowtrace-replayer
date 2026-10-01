/**
 * Multi-surface and popup window execution registry for the FlowTrace Replayer.
 *
 * Execution Hierarchy:
 *   RecordingSession
 *         ↓
 *      Surface  (ReplaySurfaceRegistry / resolveSurface)
 *         ↓
 *       Frame   (resolveScope in frames.ts)
 *         ↓
 *      Locator  (buildLocator in locators.ts)
 *         ↓
 *      Action   (executeAction in actions.ts)
 *
 * This module enforces strict surface routing: actions recorded on a popup surface
 * (e.g. `surface_popup_1`) must execute against that specific Playwright Page handle.
 * If the target surface cannot be resolved or is closed, execution fails closed rather
 * than acting against the main page.
 */

import type { BrowserContext, Page } from '@playwright/test';
import type { NormalizedAction } from './types';
import { installSettleProbe } from './settle';

export class ReplaySurfaceRegistry {
  private _surfaces = new Map<string, Page>();
  private _rootSurfaceId = 'surface_main';
  private _declaredSurfaces = new Set<string>();
  private _unclaimedPages: Page[] = [];
  private _context: BrowserContext | null = null;
  private _pageListener: ((page: Page) => void) | null = null;

  /**
   * Initialize surface registry for a replay run.
   * @param initialPage The primary root page
   * @param actions Full normalized action sequence
   */
  constructor(initialPage: Page, actions: NormalizedAction[] = []) {
    const rootCandidate = actions.find((a) => a.surfaceId)?.surfaceId;
    if (rootCandidate && !rootCandidate.includes('popup')) {
      this._rootSurfaceId = rootCandidate;
    }

    this._surfaces.set(this._rootSurfaceId, initialPage);
    this._surfaces.set('surface_main', initialPage);

    for (const a of actions) {
      if (a.surfaceId) {
        this._declaredSurfaces.add(a.surfaceId);
      }
    }

    this.attachContext(initialPage.context());
  }

  /**
   * Attach context listeners to capture dynamically spawned popup pages.
   */
  public attachContext(context: BrowserContext): void {
    if (this._context === context) return;
    this._context = context;

    this._pageListener = (newPage: Page) => {
      if (!Array.from(this._surfaces.values()).includes(newPage)) {
        this._unclaimedPages.push(newPage);
      }
    };

    context.on('page', this._pageListener);
  }

  /**
   * Clean up event listeners.
   */
  public dispose(): void {
    if (this._context && this._pageListener) {
      this._context.off('page', this._pageListener);
      this._pageListener = null;
      this._context = null;
    }
  }

  public get rootSurfaceId(): string {
    return this._rootSurfaceId;
  }

  public hasSurface(surfaceId: string): boolean {
    return this._surfaces.has(surfaceId);
  }

  public getSurface(surfaceId: string): Page | undefined {
    return this._surfaces.get(surfaceId);
  }

  public registerSurface(surfaceId: string, page: Page): void {
    this._surfaces.set(surfaceId, page);
    this._unclaimedPages = this._unclaimedPages.filter((p) => p !== page);
  }

  /**
   * Resolves the authoritative Playwright Page for the given action.
   *
   * @param action The normalized action to execute
   * @param fallbackPage Current active page
   * @param timeoutMs Optional wait budget for popup emergence
   * @returns The targeted Playwright Page
   */
  public async resolveSurface(
    action: NormalizedAction,
    fallbackPage: Page,
    timeoutMs = 500,
  ): Promise<Page> {
    const surfaceId = action.surfaceId;

    // 1. Untagged or Root Surface actions
    if (!surfaceId || surfaceId === 'surface_main' || surfaceId === this._rootSurfaceId) {
      const rootPage = this._surfaces.get(this._rootSurfaceId) || fallbackPage;
      if (rootPage.isClosed()) {
        const live = fallbackPage.context().pages().filter((p) => !p.isClosed());
        if (live.length > 0) {
          const replacement = live[0];
          this.registerSurface(this._rootSurfaceId, replacement);
          this.registerSurface('surface_main', replacement);
          return replacement;
        }
        throw new Error(`Primary surface "${this._rootSurfaceId}" is closed and no active tabs remain.`);
      }
      return rootPage;
    }

    // 2. Previously resolved popup surface
    if (this._surfaces.has(surfaceId)) {
      const page = this._surfaces.get(surfaceId)!;
      if (page.isClosed()) {
        throw new Error(
          `Surface "${surfaceId}" was closed before action "${action.name}" could act on it.`,
        );
      }
      return page;
    }

    // 3. New popup surface resolution
    const context = fallbackPage.context();
    let live = context.pages().filter((p) => !p.isClosed());
    let candidate = this._unclaimedPages.find((p) => !p.isClosed()) ||
                    live.find((p) => !Array.from(this._surfaces.values()).includes(p));

    if (!candidate && timeoutMs > 0) {
      // Allow window opening / target=_blank navigation to register
      await fallbackPage.waitForTimeout(Math.min(timeoutMs, 250)).catch(() => {});
      live = context.pages().filter((p) => !p.isClosed());
      candidate = this._unclaimedPages.find((p) => !p.isClosed()) ||
                  live.find((p) => !Array.from(this._surfaces.values()).includes(p)) ||
                  (live.length > 1 ? live[live.length - 1] : undefined);
    }

    if (candidate && !candidate.isClosed() && candidate !== this._surfaces.get(this._rootSurfaceId)) {
      this.registerSurface(surfaceId, candidate);
      await candidate.waitForLoadState('domcontentloaded').catch(() => {});
      await installSettleProbe(candidate);
      await candidate.bringToFront().catch(() => {});
      return candidate;
    }

    // 4. Fail closed if multi-surface was declared but target popup is absent
    if (this._declaredSurfaces.size > 1) {
      throw new Error(
        `Target surface "${surfaceId}" not found in browser context. ` +
        `Refusing to replay popup action against the main page.`,
      );
    }

    // Single-surface fallback
    return fallbackPage;
  }
}
