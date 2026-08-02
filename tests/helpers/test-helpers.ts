/**
 * Helper utilities for Playwright tests.
 * Provides form interaction, navigation, table, and assertion helpers.
 */
import { Page, Locator, expect } from '@playwright/test';

// ─── Constants ───────────────────────────────────────────────────────────────
export const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

export const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: '/admin',
  director: '/director',
  associate_dean: '/associate_dean',
  club_coordinator: '/club_coordinator',
  student: '/student',
  additional: '/additional',
};

// ─── Navigation Helpers ──────────────────────────────────────────────────────

/** Navigate and wait for network idle */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
}

/** Wait for page to finish loading (no spinners) */
export async function waitForPageLoad(page: Page) {
  // Wait for any loading spinners to disappear
  const spinners = page.locator('.animate-spin');
  if (await spinners.count() > 0) {
    await spinners.first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => {});
  }
}

/** Check sidebar contains expected navigation items */
export async function verifySidebarItems(page: Page, expectedLabels: string[]) {
  const sidebar = page.locator('nav, [role="navigation"]').first();
  for (const label of expectedLabels) {
    await expect(sidebar.getByText(label, { exact: false })).toBeVisible({ timeout: 5000 });
  }
}

// ─── Form Helpers ────────────────────────────────────────────────────────────

/** Fill a form field by its label */
export async function fillByLabel(page: Page, label: string, value: string) {
  const field = page.getByLabel(label, { exact: false });
  await field.fill(value);
}

/** Fill a form field by placeholder */
export async function fillByPlaceholder(page: Page, placeholder: string, value: string) {
  const field = page.getByPlaceholder(placeholder, { exact: false });
  await field.fill(value);
}

/** Submit a form by clicking its submit button */
export async function submitForm(page: Page, buttonText?: string) {
  if (buttonText) {
    await page.getByRole('button', { name: buttonText }).click();
  } else {
    await page.getByRole('button', { name: /submit|save|create|login|sign/i }).first().click();
  }
}

/** Check that a validation error message appears */
export async function expectValidationError(page: Page, errorText: string | RegExp) {
  await expect(page.getByText(errorText)).toBeVisible({ timeout: 5000 });
}

/** Check that a toast notification appears */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

// ─── Edge Case Input Generators ──────────────────────────────────────────────

export const EDGE_CASE_INPUTS = {
  empty: '',
  whitespace: '   ',
  singleChar: 'a',
  longString: 'A'.repeat(500),
  unicode: '日本語テスト',
  emoji: '🎉🚀😊',
  rtl: 'مرحبا بالعالم',
  sqlInjection: "'; DROP TABLE users; --",
  xss: '<script>alert("xss")</script>',
  htmlInjection: '<b>bold</b><img src=x onerror=alert(1)>',
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  negativeNumber: '-1',
  zero: '0',
  largeNumber: '999999999999',
  decimal: '3.14159',
  email: {
    valid: 'test@example.com',
    invalid: 'not-an-email',
    noAt: 'testexample.com',
    noDomain: 'test@',
    doubleDot: 'test@example..com',
  },
  password: {
    tooShort: 'Ab1!',
    noUppercase: 'password123!',
    noLowercase: 'PASSWORD123!',
    noDigit: 'Password!!!',
    valid: 'Test@12345',
  },
};

// ─── Table Helpers ───────────────────────────────────────────────────────────

/** Get visible row count in a table */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator('table tbody tr, [role="row"]');
  return rows.count();
}

/** Click a table header to sort */
export async function clickTableSort(page: Page, columnName: string) {
  await page.getByRole('columnheader', { name: columnName }).click();
}

/** Search/filter using a search input */
export async function searchInTable(page: Page, query: string) {
  const searchInput = page.getByPlaceholder(/search/i).first();
  await searchInput.fill(query);
  // Give debounce time to fire
  await page.waitForTimeout(500);
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

/** Login via API and return tokens */
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`API login failed: ${res.status}`);
  return res.json();
}

/** Make an authenticated API call */
export async function apiCall(
  endpoint: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

// ─── Assertion Helpers ───────────────────────────────────────────────────────

/** Assert the page loaded without a full-page error */
export async function assertPageLoaded(page: Page) {
  // Should not be a 404/500 error page
  await expect(page.locator('body')).not.toContainText(/404|500|Internal Server Error/);
}

/** Assert the current URL matches a pattern */
export async function assertUrl(page: Page, pattern: string | RegExp) {
  if (typeof pattern === 'string') {
    await expect(page).toHaveURL(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  } else {
    await expect(page).toHaveURL(pattern);
  }
}

/** Assert page heading text */
export async function assertHeading(page: Page, text: string | RegExp) {
  await expect(
    page.getByRole('heading', { name: text }).first()
  ).toBeVisible({ timeout: 10_000 });
}

/** Assert unauthorized access redirects to login */
export async function assertRedirectsToLogin(page: Page, protectedPath: string) {
  await page.goto(protectedPath);
  // Should redirect to /login
  await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
}
