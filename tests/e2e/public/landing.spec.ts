/**
 * Public Pages: Landing & About
 */
import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded } from '../../helpers/test-helpers';

test.describe('Landing Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load landing page', async ({ page }) => {
    await navigateTo(page, '/');
    await assertPageLoaded(page);
    await expect(page.getByText(/event|EMS|NMIMS/i).first()).toBeVisible();
  });

  test('should display login/signup links', async ({ page }) => {
    await navigateTo(page, '/');
    await expect(page.getByRole('link', { name: /sign in|log in|login/i }).first()).toBeVisible();
  });

  test('should display NMIMS branding', async ({ page }) => {
    await navigateTo(page, '/');
    await expect(page.locator('img[alt*="NMIMS"], img[alt*="Logo"]').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateTo(page, '/');
    await assertPageLoaded(page);
  });
});

test.describe('About Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load about page', async ({ page }) => {
    await navigateTo(page, '/about');
    await assertPageLoaded(page);
  });
});
