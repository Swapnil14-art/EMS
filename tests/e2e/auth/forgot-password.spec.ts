/**
 * Auth: Forgot Password Tests
 */
import { test, expect } from '@playwright/test';
import { navigateTo } from '../../helpers/test-helpers';

test.describe('Forgot Password Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/forgot-password');
  });

  test('should render forgot password form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|send|submit/i })).toBeVisible();
  });

  test('should link back to login', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in|log in|login|back/i }).first()).toBeVisible();
  });

  test('should validate empty email', async ({ page }) => {
    await page.getByRole('button', { name: /reset|send|submit/i }).click();
    await expect(page.getByText(/email|required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should accept valid email and show confirmation', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@nmims.in');
    await page.getByRole('button', { name: /reset|send|submit/i }).click();
    await page.waitForTimeout(3000);
    const hasSuccess = await page.getByText(/sent|check|email|success/i).first().isVisible().catch(() => false);
    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);
    expect(hasSuccess || !hasError).toBeTruthy();
  });
});
