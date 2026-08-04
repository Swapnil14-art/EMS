/**
 * Visual Regression — Screenshot Testing
 *
 * Captures baseline screenshots of key pages for visual diff detection.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');

const VISUAL_PAGES = [
  { name: 'landing', path: '/', auth: false },
  { name: 'login', path: '/login', auth: false },
  { name: 'admin-dashboard', path: '/admin', auth: true },
  { name: 'admin-users', path: '/admin/users', auth: true },
  { name: 'admin-events', path: '/admin/events', auth: true },
];

test.describe('Visual Regression', () => {
  for (const pg of VISUAL_PAGES) {
    test(`${pg.name} should match screenshot baseline`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: pg.auth ? ADMIN_STATE : undefined,
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();

      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Wait for animations to settle

      // Remove dynamic content that changes between runs
      await page.evaluate(() => {
        // Hide timestamps, relative times, live counters
        document.querySelectorAll('[data-testid*="time"], .animate-spin').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });

      await expect(page).toHaveScreenshot(`${pg.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.02, // Allow 2% pixel difference
        threshold: 0.3,
      });

      await context.close();
    });
  }
});
