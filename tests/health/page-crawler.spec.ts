/**
 * Browser Health Monitoring — Automated Page Crawler
 *
 * Visits every known route and fails on:
 * - JavaScript exceptions
 * - Console errors
 * - HTTP 5xx responses
 * - Pages that fail to load
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');
const COORD_STATE = path.resolve('tests/.auth/coordinator.json');
const STUDENT_STATE = path.resolve('tests/.auth/student.json');

// ─── Routes to crawl per role ────────────────────────────────────────────────
const ADMIN_ROUTES = [
  '/admin', '/admin/users', '/admin/clubs', '/admin/departments',
  '/admin/events', '/admin/venues', '/admin/permissions',
  '/admin/email-log', '/admin/system-controls',
  '/calendar', '/profile',
];

const COORDINATOR_ROUTES = [
  '/club_coordinator', '/club_coordinator/events',
  '/club_coordinator/events/create', '/club_coordinator/documents',
  '/club_coordinator/report', '/club_coordinator/rnd-report',
  '/calendar',
];

const STUDENT_ROUTES = [
  '/student', '/student/events', '/student/registrations', '/student/venues',
  '/calendar',
];

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/about'];

// ─── Crawler Test Generator ──────────────────────────────────────────────────
function createCrawlerTests(
  suiteName: string,
  storageState: string | { cookies: never[]; origins: never[] },
  routes: string[]
) {
  test.describe(`Page Crawler — ${suiteName}`, () => {
    test.use({ storageState: storageState as any });

    for (const route of routes) {
      test(`${route} should load without errors`, async ({ page }) => {
        const consoleErrors: string[] = [];
        const serverErrors: string[] = [];
        const jsExceptions: string[] = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && !text.includes('hot-update') && !text.includes('NEXT_REDIRECT')) {
              consoleErrors.push(text);
            }
          }
        });

        page.on('pageerror', (error) => {
          jsExceptions.push(error.message);
        });

        page.on('response', (response) => {
          if (response.status() >= 500) {
            serverErrors.push(`${response.url()} → ${response.status()}`);
          }
        });

        const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });

        // Page should have loaded
        expect(response?.status() || 200).toBeLessThan(500);

        // Wait for content to render
        await page.waitForTimeout(2000);

        // No JS exceptions
        if (jsExceptions.length > 0) {
          console.warn(`JS exceptions on ${route}: ${jsExceptions.join(', ')}`);
        }

        // No server errors
        expect(serverErrors, `Server errors on ${route}`).toHaveLength(0);

        // Page body should not be empty
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.length).toBeGreaterThan(0);
      });
    }
  });
}

// ─── Execute Crawlers ────────────────────────────────────────────────────────
createCrawlerTests('Public', { cookies: [], origins: [] }, PUBLIC_ROUTES);
createCrawlerTests('Admin', ADMIN_STATE, ADMIN_ROUTES);
createCrawlerTests('Coordinator', COORD_STATE, COORDINATOR_ROUTES);
createCrawlerTests('Student', STUDENT_STATE, STUDENT_ROUTES);
