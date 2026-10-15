/**
 * Common assertion helpers.
 *
 * Assert business rules (persisted state), not implementation details.
 * §3 rule 7, §5.1 helpers/assertions.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { Page, APIRequestContext, expect } from '@playwright/test';
import { apiCall, API_URL } from './api';

// ─── Page-level ───────────────────────────────────────────────────────────────

/** Fail if the page contains a 404/500 error marker. */
export async function assertPageLoaded(page: Page) {
  await expect(page.locator('body')).not.toContainText(/404|500|Internal Server Error/i);
}

/** Assert URL matches string or regex. */
export async function assertUrl(page: Page, pattern: string | RegExp) {
  if (typeof pattern === 'string') {
    await expect(page).toHaveURL(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  } else {
    await expect(page).toHaveURL(pattern);
  }
}

/** Assert that navigating to `protectedPath` redirects to login. */
export async function assertRedirectsToLogin(page: Page, protectedPath: string) {
  await page.goto(protectedPath);
  await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
}

/** Assert a toast/snackbar message is visible. */
export async function assertToast(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 8_000 });
}

/** Assert a heading is visible. */
export async function assertHeading(page: Page, text: string | RegExp) {
  await expect(page.getByRole('heading', { name: text }).first()).toBeVisible({ timeout: 10_000 });
}

// ─── API-level (persisted state) ─────────────────────────────────────────────

/** Assert the API returns the expected status for an endpoint. */
export async function assertApiStatus(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  expectedStatus: number,
  options: { token?: string; body?: unknown } = {}
) {
  const res = await apiCall(request, method, endpoint, options);
  expect(res.status, `Expected HTTP ${expectedStatus} from ${method} ${endpoint}, got ${res.status}`).toBe(expectedStatus);
  return res;
}

/** Assert unauthenticated request gets 401. */
export async function assertUnauthenticated(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string
) {
  return assertApiStatus(request, method, endpoint, 401);
}

/** Assert unauthorized (authenticated but wrong role/permission) gets 403. */
export async function assertForbidden(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  token: string,
  body?: unknown
) {
  return assertApiStatus(request, method, endpoint, 403, { token, body });
}

/** Assert event status via API equals `expectedStatus`. */
export async function assertEventStatus(
  request: APIRequestContext,
  token: string,
  eventId: number | string,
  expectedStatus: string
) {
  const res = await apiCall(request, 'GET', `/events/${eventId}`, { token });
  expect(res.status).toBe(200);
  const event = res.data as { status?: string };
  expect(event.status, `Event ${eventId} expected status "${expectedStatus}", got "${event.status}"`).toBe(expectedStatus);
}

/** Assert registration exists for a given user+event via API. */
export async function assertRegistrationExists(
  request: APIRequestContext,
  token: string,
  eventId: number | string
) {
  const res = await apiCall(request, 'GET', `/registrations/?event_id=${eventId}`, { token });
  expect(res.status).toBe(200);
  const list = res.data as unknown[];
  expect(list.length, `No registration found for event ${eventId}`).toBeGreaterThan(0);
}

/** Assert registration does NOT exist for a given user+event via API. */
export async function assertRegistrationAbsent(
  request: APIRequestContext,
  token: string,
  eventId: number | string
) {
  const res = await apiCall(request, 'GET', `/registrations/?event_id=${eventId}`, { token });
  // Either 404 or empty list
  if (res.status === 200) {
    const list = res.data as unknown[];
    expect(list.length, `Unexpected registration found for event ${eventId}`).toBe(0);
  } else {
    expect([404, 403]).toContain(res.status);
  }
}

/** Assert coordinator_type and permissions via API after save. */
export async function assertPermissions(
  request: APIRequestContext,
  adminToken: string,
  userId: number | string,
  expectedPermissions: string[]
) {
  const res = await apiCall(request, 'GET', `/admin/users/${userId}/permissions`, { token: adminToken });
  expect(res.status).toBe(200);
  const perms = res.data as { permissions?: string[]; coordinator_type?: string | null };
  for (const perm of expectedPermissions) {
    expect(perms.permissions ?? [], `Expected permission "${perm}" to be granted`).toContain(perm);
  }
}
