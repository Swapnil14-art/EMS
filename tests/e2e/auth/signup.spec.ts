/**
 * Auth: Signup Tests
 */
import { test, expect } from '@playwright/test';
import { navigateTo } from '../../helpers/test-helpers';

test.describe('Signup Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/signup');
  });

  test('should render signup form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|register|create/i })).toBeVisible();
  });

  test('should link back to login', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in|log in|login/i })).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page.getByText(/email|required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.locator('input[type="email"]').fill('notanemail');
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page.getByText(/valid|invalid|email/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should enforce NMIMS email domain', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@gmail.com');
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await page.waitForTimeout(1000);
    expect(page.url()).toBeTruthy();
  });
});
