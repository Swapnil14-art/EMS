/**
 * Auth: Login Tests
 * Covers: normal login, invalid credentials, empty fields, edge cases
 */
import { test, expect } from '@playwright/test';
import {
  navigateTo, expectValidationError, EDGE_CASE_INPUTS,
  assertUrl, assertHeading,
} from '../../helpers/test-helpers';

test.describe('Login Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/login');
  });

  // ── Page Load ──
  test('should render login page with form elements', async ({ page }) => {
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible();
  });

  test('should have a link to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await expect(signupLink).toBeVisible();
  });

  test('should have a link to forgot password', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot|reset/i });
    await expect(forgotLink).toBeVisible();
  });

  // ── Validation ──
  test('should show error on empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Should show validation errors (zod validation)
    await expect(page.getByText(/email|required/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder(/email/i).first().fill(EDGE_CASE_INPUTS.email.invalid);
    await page.getByPlaceholder(/password/i).first().fill('somepassword');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await expect(page.getByText(/valid email/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.getByPlaceholder(/email/i).first().fill('wrong@nmims.in');
    await page.getByPlaceholder(/password/i).first().fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Wait for API response error
    await expect(
      page.getByText(/invalid|incorrect|wrong|not found/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Successful Login ──
  test('should login successfully as admin and redirect to dashboard', async ({ page }) => {
    await page.getByPlaceholder(/email/i).first().fill('admin@nmims.in');
    await page.getByPlaceholder(/password/i).first().fill('Admin@123');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Should redirect to admin dashboard
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15_000 });
    await expect(page.url()).toContain('/admin');
  });

  // ── Password Toggle ──
  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/password/i).first();
    await passwordInput.fill('TestPassword');
    // Should be password type by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // Click show/hide toggle
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  // ── Edge Cases ──
  test('should handle SQL injection in email field gracefully', async ({ page }) => {
    await page.getByPlaceholder(/email/i).first().fill(EDGE_CASE_INPUTS.sqlInjection);
    await page.getByPlaceholder(/password/i).first().fill('password');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Should show error, not crash
    await expect(page.getByText(/invalid|error|email/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle XSS in email field gracefully', async ({ page }) => {
    await page.getByPlaceholder(/email/i).first().fill(EDGE_CASE_INPUTS.xss);
    await page.getByPlaceholder(/password/i).first().fill('password');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Page should not execute script
    await expect(page.locator('script')).toHaveCount(0);
  });
});
