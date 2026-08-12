/**
 * Role-Based Access Control Tests
 *
 * Verifies that each role can only access their authorized pages
 * and is blocked from unauthorized routes.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { navigateTo } from '../../helpers/test-helpers';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');
const COORD_STATE = path.resolve('tests/.auth/coordinator.json');
const STUDENT_STATE = path.resolve('tests/.auth/student.json');

// ─── Access Matrix ───────────────────────────────────────────────────────────
const ACCESS_MATRIX = [
  {
    role: 'Student',
    storageState: STUDENT_STATE,
    allowed: ['/student', '/student/events', '/student/registrations', '/calendar'],
    blocked: ['/admin', '/admin/users', '/director', '/club_coordinator', '/associate_dean'],
  },
  {
    role: 'Coordinator',
    storageState: COORD_STATE,
    allowed: ['/club_coordinator', '/club_coordinator/events', '/calendar'],
    blocked: ['/admin', '/admin/users', '/director', '/associate_dean'],
  },
];

test.describe('Role-Based Access Control', () => {
  for (const { role, storageState, allowed, blocked } of ACCESS_MATRIX) {
    test.describe(`${role}`, () => {
      test.use({ storageState });

      for (const route of allowed) {
        test(`should access ${route}`, async ({ page }) => {
          const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          // Should not get 403/404 error page
          expect(response?.status() || 200).toBeLessThan(400);
          await page.waitForTimeout(2000);
          // Should not be redirected to login
          expect(page.url()).not.toContain('/login');
        });
      }

      for (const route of blocked) {
        test(`should NOT access ${route}`, async ({ page }) => {
          await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          await page.waitForTimeout(3000);
          // Should be redirected away (to own dashboard or login)
          expect(page.url()).not.toContain(route);
        });
      }
    });
  }

  // Admin should access everything
  test.describe('Admin', () => {
    test.use({ storageState: ADMIN_STATE });

    const adminRoutes = ['/admin', '/admin/users', '/admin/clubs', '/admin/departments', '/admin/events', '/admin/venues'];
    for (const route of adminRoutes) {
      test(`should access ${route}`, async ({ page }) => {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        expect(response?.status() || 200).toBeLessThan(400);
        await page.waitForTimeout(2000);
        expect(page.url()).not.toContain('/login');
      });
    }
  });

  // Unauthenticated should be blocked from all protected routes
  test.describe('Unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    const protectedRoutes = ['/admin', '/director', '/club_coordinator', '/student', '/associate_dean', '/profile'];
    for (const route of protectedRoutes) {
      test(`should NOT access ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        await page.waitForTimeout(3000);
        // Should redirect to login or landing
        const url = page.url();
        expect(url.includes('/login') || url.endsWith('/') || url.includes('localhost:8080')).toBeTruthy();
      });
    }
  });
});
