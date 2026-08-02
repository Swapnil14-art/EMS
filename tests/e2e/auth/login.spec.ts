/**
 * Auth: Login Tests
 * Covers: normal login, invalid credentials, empty fields, edge cases
 */
import { test, expect } from '@playwright/test';
import {
  navigateTo, EDGE_CASE_INPUTS,
} from '../../helpers/test-helpers';

test.describe('Login Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/login');
  });

  // ── Page Load ──
  test('should render login page with form elements', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible();
  });

  test('should have a link to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
  });

  test('should have a link to forgot password', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
  });

  // ── Validation ──
  test('should show error on empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await expect(page.getByText(/email|required|valid/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill(EDGE_CASE_INPUTS.email.invalid);
    await page.locator('input[type="password"]').fill('somepassword');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await expect(page.getByText(/email|@nmims\.in/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.locator('input[type="email"]').fill('wrong@nmims.in');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await expect(
      page.getByText(/invalid|incorrect|wrong|not found|failed/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Successful Login ──
  test('should login successfully as admin and redirect to dashboard', async ({ page }) => {
    await page.locator('input[type="email"]').fill('admin@nmims.in');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15_000 });
    await expect(page.url()).toContain('/admin');
  });

  // ── Password Toggle ──
  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('TestPassword');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleButton = page.getByRole('button', { name: /show password|hide password/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).last()
    );
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      const updatedInput = page.locator('input[placeholder*="password"], input[type="text"]').first();
      await expect(updatedInput).toBeVisible();
    }
  });

  // ── Edge Cases ──
  test('should handle SQL injection in email field gracefully', async ({ page }) => {
    await page.locator('input[type="email"]').fill(EDGE_CASE_INPUTS.sqlInjection);
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await expect(page.getByText(/invalid|error|email/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle XSS in email field gracefully', async ({ page }) => {
    await page.locator('input[type="email"]').fill(EDGE_CASE_INPUTS.xss);
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await expect(page.locator('script')).toHaveCount(0);
  });
});
