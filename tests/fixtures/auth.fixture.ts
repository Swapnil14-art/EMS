/**
 * Auth Fixture — API login and fresh browser context per account.
 *
 * Creates a separate browser context (never reuses another role's storage state)
 * and provides the access token for API calls in the same test.
 *
 * §5.1 fixtures/auth.fixture.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { test as base, Browser, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { TEST_USERS, TestUserKey } from '../global-setup';

// Re-export for convenience
export { TestUserKey };

// ─── Auth context builder ─────────────────────────────────────────────────────

/** Load the saved storage state for a given role key. */
function storageStatePath(key: string): string {
  return path.resolve(`tests/.auth/${key}.json`);
}

/** Create a fresh browser context with role-specific storage state. */
export async function createRoleContext(browser: Browser, key: string, baseURL = ''): Promise<BrowserContext> {
  const statePath = storageStatePath(key);
  const storageState = fs.existsSync(statePath)
    ? statePath
    : { cookies: [] as [], origins: [] as [] };

  return browser.newContext({
    storageState: storageState as any,
    baseURL: baseURL || (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080'),
  });
}

/** Create a page for a given role key. Caller must close the returned context. */
export async function createRolePage(browser: Browser, key: string, baseURL = ''): Promise<{ page: Page; ctx: BrowserContext }> {
  const ctx = await createRoleContext(browser, key, baseURL);
  const page = await ctx.newPage();
  return { page, ctx };
}

/** Extract the access token stored in localStorage by global-setup. */
export function extractToken(key: string): string | null {
  const statePath = storageStatePath(key);
  if (!fs.existsSync(statePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    const ls: Array<{ name: string; value: string }> = raw?.origins?.[0]?.localStorage ?? [];
    const emsAuth = ls.find((e) => e.name === 'ems-auth');
    if (!emsAuth) return null;
    const parsed = JSON.parse(emsAuth.value);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

// ─── Fixture type ─────────────────────────────────────────────────────────────

interface AuthFixtures {
  /** Token for the project-default role (admin) */
  adminToken: string;
  directorToken: string;
  deanToken: string;
  coordinatorToken: string;
  studentToken: string;
  additionalViewerToken: string;
  additionalManagerToken: string;
  additionalNoneToken: string;
  additionalFullToken: string;

  /** Role-isolated pages */
  adminPage: Page;
  directorPage: Page;
  deanPage: Page;
  coordinatorPage: Page;
  studentPage: Page;
  additionalViewerPage: Page;
  additionalNonePage: Page;
}

// ─── Extended test ────────────────────────────────────────────────────────────

export const test = base.extend<AuthFixtures>({
  adminToken: async ({}, use) => {
    await use(extractToken('admin') ?? '');
  },
  directorToken: async ({}, use) => {
    await use(extractToken('director') ?? '');
  },
  deanToken: async ({}, use) => {
    await use(extractToken('dean') ?? '');
  },
  coordinatorToken: async ({}, use) => {
    await use(extractToken('coordinator') ?? '');
  },
  studentToken: async ({}, use) => {
    await use(extractToken('student') ?? '');
  },
  additionalViewerToken: async ({}, use) => {
    await use(extractToken('additional.viewer') ?? '');
  },
  additionalManagerToken: async ({}, use) => {
    await use(extractToken('additional.manager') ?? '');
  },
  additionalNoneToken: async ({}, use) => {
    await use(extractToken('additional.none') ?? '');
  },
  additionalFullToken: async ({}, use) => {
    await use(extractToken('additional.full') ?? '');
  },

  // Role-specific page fixtures — each gets a separate browser context
  adminPage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'admin', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
  directorPage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'director', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
  deanPage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'dean', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
  coordinatorPage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'coordinator', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
  studentPage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'student', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
  additionalViewerPage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'additional.viewer', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
  additionalNonePage: async ({ browser, baseURL }, use) => {
    const { page, ctx } = await createRolePage(browser, 'additional.none', baseURL ?? '');
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
