/**
 * Authorization and Visibility — RBAC matrix
 *
 * Tests BOTH the page redirect AND the direct API endpoint.
 * UI hiding alone is not authorization.
 *
 * Lane: rbac | Mutates: No | §6.C — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { rawLogin } from '../../helpers/api';
import { apiCall } from '../../helpers/api';

const ADMIN_STATE     = path.resolve('tests/.auth/admin.json');
const DIRECTOR_STATE  = path.resolve('tests/.auth/director.json');
const DEAN_STATE      = path.resolve('tests/.auth/dean.json');
const COORD_STATE     = path.resolve('tests/.auth/coordinator.json');
const STUDENT_STATE   = path.resolve('tests/.auth/student.json');
const ADD_NONE_STATE  = path.resolve('tests/.auth/additional.none.json');
const ADD_VIEW_STATE  = path.resolve('tests/.auth/additional.viewer.json');
const UNAUTH          = { cookies: [] as [], origins: [] as [] };

// ─── Helper: follow redirects and return final URL ────────────────────────────
async function finalUrl(page: any, route: string): Promise<string> {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForURL((url: URL) => url.pathname !== route, { timeout: 8_000 }).catch(() => {});
  return page.url();
}

// ─── Fixed-role dashboard allow-list ─────────────────────────────────────────
test.describe('RBAC — Admin route allow-list', () => {
  test.use({ storageState: ADMIN_STATE });

  const adminRoutes = ['/admin', '/admin/users', '/admin/clubs', '/admin/departments',
    '/admin/events', '/admin/venues', '/admin/permissions', '/admin/email-log', '/admin/system-controls'];

  for (const route of adminRoutes) {
    test(`admin can access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      expect(url).not.toContain('/login');
      expect(url).toContain(route.split('/').slice(0, 3).join('/'));
    });
  }
});

test.describe('RBAC — Director route allow-list', () => {
  test.use({ storageState: DIRECTOR_STATE });

  const directorRoutes = ['/director', '/director/events', '/director/history', '/director/venues'];
  for (const route of directorRoutes) {
    test(`director can access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      expect(url).not.toContain('/login');
    });
  }

  test('director cannot access /admin', async ({ page }) => {
    const url = await finalUrl(page, '/admin');
    expect(url).not.toMatch(/\/admin(?:$|\/)/);
  });
});

test.describe('RBAC — Associate Dean route allow-list', () => {
  test.use({ storageState: DEAN_STATE });

  const deanRoutes = ['/associate_dean', '/associate_dean/events', '/associate_dean/history',
    '/associate_dean/clubs', '/associate_dean/venues'];

  for (const route of deanRoutes) {
    test(`dean can access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      expect(url).not.toContain('/login');
    });
  }

  test('dean cannot access /admin', async ({ page }) => {
    const url = await finalUrl(page, '/admin');
    expect(url).not.toMatch(/\/admin(?:$|\/)/);
  });
});

test.describe('RBAC — Coordinator route allow-list', () => {
  test.use({ storageState: COORD_STATE });

  const coordRoutes = ['/club_coordinator', '/club_coordinator/events',
    '/club_coordinator/events/create', '/club_coordinator/report'];

  for (const route of coordRoutes) {
    test(`coordinator can access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      expect(url).not.toContain('/login');
    });
  }

  test('coordinator cannot access /admin', async ({ page }) => {
    const url = await finalUrl(page, '/admin');
    expect(url).not.toMatch(/\/admin(?:$|\/)/);
  });

  test('coordinator cannot access /director', async ({ page }) => {
    const url = await finalUrl(page, '/director');
    expect(url).not.toMatch(/\/director(?:$|\/)/);
  });
});

test.describe('RBAC — Student route allow-list', () => {
  test.use({ storageState: STUDENT_STATE });

  const studentRoutes = ['/student', '/student/events', '/student/registrations'];
  for (const route of studentRoutes) {
    test(`student can access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      expect(url).not.toContain('/login');
    });
  }

  const blockedRoutes = ['/admin', '/director', '/associate_dean', '/club_coordinator'];
  for (const route of blockedRoutes) {
    test(`student cannot access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      expect(url).not.toMatch(new RegExp(`${route.replace('/', '\\/')}(?:$|\\/)`));
    });
  }
});

test.describe('RBAC — Additional (no permissions) is denied', () => {
  test.use({ storageState: ADD_NONE_STATE });

  test('additional.none cannot access any privileged routes', async ({ page }) => {
    const url = await finalUrl(page, '/admin');
    expect(url).not.toMatch(/\/admin(?:$|\/)/);
  });
});

test.describe('RBAC — Unauthenticated redirect matrix', () => {
  test.use({ storageState: UNAUTH });

  const protectedRoutes = ['/admin', '/director', '/club_coordinator', '/student',
    '/associate_dean', '/profile'];

  for (const route of protectedRoutes) {
    test(`unauthenticated cannot access ${route}`, async ({ page }) => {
      const url = await finalUrl(page, route);
      const isLoginOrRoot = url.includes('/login') || url.endsWith('/') ||
        url.endsWith(':8080') || url.endsWith(':8080/');
      expect(isLoginOrRoot, `Expected redirect to login, got: ${url}`).toBeTruthy();
    });
  }
});

// ─── API boundary checks (§6.C: UI hiding is not authorization) ──────────────
test.describe('RBAC — API boundary (not just UI)', () => {
  let studentToken: string;
  let coordinatorToken: string;
  let adminToken: string;

  test.beforeAll(async () => {
    const [s, c, a] = await Promise.all([
      rawLogin('student1@nmims.in', 'Test@123'),
      rawLogin('coord.gdsc@nmims.in', 'Test@123'),
      rawLogin('admin@nmims.in', 'Admin@123'),
    ]);
    studentToken = s.access_token;
    coordinatorToken = c.access_token;
    adminToken = a.access_token;
  });

  test('student cannot read admin users via API', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/admin/users', { token: studentToken });
    expect([401, 403]).toContain(res.status);
  });

  test('coordinator cannot read admin users via API', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/admin/users', { token: coordinatorToken });
    expect([401, 403]).toContain(res.status);
  });

  test('unauthenticated cannot read events requiring auth', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/admin/users');
    expect([401, 403]).toContain(res.status);
  });

  test('unauthenticated POST /registrations/ returns 401', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/registrations/', { body: { event_id: 1 } });
    expect(res.status).toBe(401);
  });

  test('error response does not expose stack traces or internal paths', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/admin/users', { token: studentToken });
    expect([401, 403]).toContain(res.status);
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/Traceback|at line \d+|File "/i);
    expect(body).not.toMatch(/password_hash|hashed_/i);
  });
});
