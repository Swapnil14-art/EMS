/**
 * Accessibility Tests — Automated axe-core scanning
 *
 * Scans key pages for WCAG 2.1 AA violations.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');

// Pages to scan for accessibility
const A11Y_PAGES = [
  { name: 'Landing Page', path: '/', auth: false },
  { name: 'Login Page', path: '/login', auth: false },
  { name: 'Signup Page', path: '/signup', auth: false },
  { name: 'Admin Dashboard', path: '/admin', auth: true },
  { name: 'Admin Users', path: '/admin/users', auth: true },
  { name: 'Admin Events', path: '/admin/events', auth: true },
];

test.describe('Accessibility Scan', () => {
  for (const pg of A11Y_PAGES) {
    test(`${pg.name} (${pg.path}) should have no critical accessibility violations`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: pg.auth ? ADMIN_STATE : undefined,
      });
      const page = await context.newPage();

      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Let dynamic content render

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[aria-hidden="true"]') // Exclude hidden elements
        .analyze();

      // Filter for critical/serious violations only
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalViolations.length > 0) {
        const summary = criticalViolations
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`)
          .join('\n');
        console.warn(`Accessibility violations on ${pg.path}:\n${summary}`);
      }

      // Fail only on critical violations
      const critical = results.violations.filter((v) => v.impact === 'critical');
      expect(
        critical,
        `Critical accessibility violations found on ${pg.path}`
      ).toHaveLength(0);

      await context.close();
    });
  }
});
