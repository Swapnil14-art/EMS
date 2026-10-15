/**
 * Base Fixture — Extended Playwright test with browser health monitoring.
 *
 * Every test that uses this fixture automatically:
 * - Captures console errors
 * - Detects failed network requests (5xx)
 * - Detects unhandled JS exceptions
 * - Provides role-switching helpers
 */
import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────
type ConsoleMessage = { type: string; text: string; url: string };
type NetworkFailure = { url: string; status: number; method: string };

interface HealthMonitor {
  consoleErrors: ConsoleMessage[];
  networkFailures: NetworkFailure[];
  jsExceptions: string[];
  assertNoErrors: () => void;
}

type TestUserKey = 'admin' | 'director' | 'dean' | 'coordinator' | 'student';

// ─── Fixture Extensions ──────────────────────────────────────────────────────
interface TestFixtures {
  monitor: HealthMonitor;
  adminPage: Page;
  directorPage: Page;
  deanPage: Page;
  coordinatorPage: Page;
  studentPage: Page;
}

// ─── Helper: create page with role-specific storage state ────────────────────
async function createRolePage(
  context: BrowserContext,
  browser: any,
  role: TestUserKey,
  baseURL: string
): Promise<Page> {
  const storageFile = path.resolve(`tests/.auth/${role}.json`);
  const ctx = await browser.newContext({
    storageState: storageFile,
    baseURL,
  });
  return ctx.newPage();
}

// ─── Extended Test ───────────────────────────────────────────────────────────
export const test = base.extend<TestFixtures>({
  // Browser health monitor — attached to every test automatically
  monitor: async ({ page }, use) => {
    const consoleErrors: ConsoleMessage[] = [];
    const networkFailures: NetworkFailure[] = [];
    const jsExceptions: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known noise
        if (
          text.includes('favicon.ico') ||
          text.includes('_next/static') ||
          text.includes('hot-update') ||
          text.includes('NEXT_REDIRECT')
        ) return;
        consoleErrors.push({
          type: msg.type(),
          text,
          url: page.url(),
        });
      }
    });

    // Listen for unhandled exceptions
    page.on('pageerror', (error) => {
      jsExceptions.push(`${error.message}\n${error.stack || ''}`);
    });

    // Listen for failed network requests
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 500) {
        networkFailures.push({
          url: response.url(),
          status,
          method: response.request().method(),
        });
      }
    });

    const monitor: HealthMonitor = {
      consoleErrors,
      networkFailures,
      jsExceptions,
      assertNoErrors: () => {
        if (jsExceptions.length > 0) {
          throw new Error(
            `Unhandled JS exceptions detected:\n${jsExceptions.join('\n---\n')}`
          );
        }
        if (networkFailures.length > 0) {
          const summary = networkFailures
            .map((f) => `${f.method} ${f.url} → ${f.status}`)
            .join('\n');
          throw new Error(`Server errors detected:\n${summary}`);
        }
      },
    };

    await use(monitor);
  },

  // Role-specific page fixtures
  adminPage: async ({ browser, baseURL }, use) => {
    const page = await createRolePage({} as BrowserContext, browser, 'admin', baseURL || '');
    await use(page);
    await page.context().close();
  },
  directorPage: async ({ browser, baseURL }, use) => {
    const page = await createRolePage({} as BrowserContext, browser, 'director', baseURL || '');
    await use(page);
    await page.context().close();
  },
  deanPage: async ({ browser, baseURL }, use) => {
    const page = await createRolePage({} as BrowserContext, browser, 'dean', baseURL || '');
    await use(page);
    await page.context().close();
  },
  coordinatorPage: async ({ browser, baseURL }, use) => {
    const page = await createRolePage({} as BrowserContext, browser, 'coordinator', baseURL || '');
    await use(page);
    await page.context().close();
  },
  studentPage: async ({ browser, baseURL }, use) => {
    const page = await createRolePage({} as BrowserContext, browser, 'student', baseURL || '');
    await use(page);
    await page.context().close();
  },
});

export { expect };
export type { HealthMonitor, TestUserKey };
