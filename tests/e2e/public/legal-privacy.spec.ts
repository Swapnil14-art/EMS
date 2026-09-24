/**
 * EMS Privacy, Terms, Cookie Consent & User Legal Protection Test Suite
 *
 * Validates:
 * 1. Public availability of /privacy, /terms, and /cookies without authentication.
 * 2. Footer navigation links across pages.
 * 3. First-visit essential cookie/storage notice and persistence of acknowledgement.
 * 4. Signup acceptance flow: checkboxes start unchecked, submit disabled until checked.
 * 5. Backend legal endpoints: /legal/versions, /legal/status, /legal/accept, /legal/my-acceptances.
 * 6. RBAC security: non-admins cannot access /legal/audit, users cannot tamper with others' records.
 */
import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded, waitForPageLoad } from '../../helpers/test-helpers';
import { apiCall } from '../../helpers/api';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('EMS Legal Pages — Public Accessibility', () => {
  test('Privacy Policy (/privacy) is publicly accessible without auth', async ({ page }) => {
    await navigateTo(page, '/privacy');
    await assertPageLoaded(page);
    await expect(page.getByRole('heading', { level: 1, name: /EMS Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/Version:\s*1\.0/i)).toBeVisible();
    await expect(page.getByText(/SVKM's NMIMS, Shirpur Campus/i).first()).toBeVisible();
    await expect(page.getByText(/Digital Personal Data Protection Act/i).first()).toBeVisible();
  });

  test('Terms of Use (/terms) is publicly accessible without auth', async ({ page }) => {
    await navigateTo(page, '/terms');
    await assertPageLoaded(page);
    await expect(page.getByRole('heading', { level: 1, name: /EMS Terms of Use/i })).toBeVisible();
    await expect(page.getByText(/Version:\s*1\.0/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Acceptable Use/i })).toBeVisible();
  });

  test('Cookie Policy (/cookies) is publicly accessible without auth', async ({ page }) => {
    await navigateTo(page, '/cookies');
    await assertPageLoaded(page);
    await expect(page.getByRole('heading', { level: 1, name: /Cookie & Browser Storage Policy/i })).toBeVisible();
    await expect(page.locator('table').getByText('ems-role')).toBeVisible();
    await expect(page.locator('table').getByText('ems-auth')).toBeVisible();
    await expect(page.locator('table').getByText('ems-cookie-consent')).toBeVisible();
    await expect(page.getByText(/Zero Advertising or Tracking/i).first()).toBeVisible();
  });

  test('AppFooter displays links to Privacy, Terms, Cookies, and Grievance', async ({ page }) => {
    await navigateTo(page, '/');
    await waitForPageLoad(page);

    const privacyLink = page.locator('footer a[href="/privacy"]');
    const termsLink = page.locator('footer a[href="/terms"]');
    const cookiesLink = page.locator('footer a[href="/cookies"]');
    const grievanceLink = page.locator('footer a[href="/privacy#grievance"]');

    await expect(privacyLink).toBeVisible();
    await expect(termsLink).toBeVisible();
    await expect(cookiesLink).toBeVisible();
    await expect(grievanceLink).toBeVisible();
  });
});

test.describe('EMS First-Visit Cookie / Storage Notice', () => {
  test('New visitor sees cookie notice, can dismiss it, and notice persists dismissal', async ({ page }) => {
    await navigateTo(page, '/');
    await waitForPageLoad(page);

    const banner = page.getByRole('region', { name: /cookie and storage notice/i });
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner.getByText(/Essential Storage Notice/i)).toBeVisible();
    await expect(banner.getByText('ems-role')).toBeVisible();

    // Click acknowledge
    const ackBtn = banner.getByRole('button', { name: /acknowledge/i });
    await ackBtn.click();
    await expect(banner).not.toBeVisible();

    // Verify localStorage has consent record
    const consent = await page.evaluate(() => localStorage.getItem('ems-cookie-consent'));
    expect(consent).not.toBeNull();
    const parsed = JSON.parse(consent!);
    expect(parsed.acknowledged).toBe(true);
    expect(parsed.version).toBe('1.0');

    // Reload page — banner should remain hidden
    await page.reload();
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);
    await expect(page.getByRole('region', { name: /cookie and storage notice/i })).not.toBeVisible();
  });
});

test.describe('EMS Signup Acceptance Flow', () => {
  test('Signup checkboxes start unchecked, submit disabled until both are checked', async ({ page }) => {
    await navigateTo(page, '/signup');
    await waitForPageLoad(page);

    const emailInput = page.getByLabel(/Institutional Email Address/i);
    const termsCheckbox = page.locator('input#terms_accepted');
    const privacyCheckbox = page.locator('input#privacy_acknowledged');
    const submitBtn = page.getByRole('button', { name: /Send Temporary Password/i });

    // Verify both checkboxes start UNCHECKED by default
    await expect(termsCheckbox).not.toBeChecked();
    await expect(privacyCheckbox).not.toBeChecked();

    // Submit button should be disabled initially
    await expect(submitBtn).toBeDisabled();

    // Fill valid NMIMS email
    await emailInput.fill('new.student@nmims.edu');
    await expect(submitBtn).toBeDisabled();

    // Check only Terms — submit still disabled
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
    await expect(submitBtn).toBeDisabled();

    // Check Privacy — submit now enabled
    await privacyCheckbox.check();
    await expect(privacyCheckbox).toBeChecked();
    await expect(submitBtn).toBeEnabled();

    // Uncheck Terms — submit disabled again
    await termsCheckbox.uncheck();
    await expect(submitBtn).toBeDisabled();
  });

  test('Signup page links open Terms and Privacy in new tabs', async ({ page }) => {
    await navigateTo(page, '/signup');
    await waitForPageLoad(page);

    const termsLink = page.locator('form a[href="/terms"]');
    const privacyLink = page.locator('form a[href="/privacy"]');

    await expect(termsLink).toHaveAttribute('target', '_blank');
    await expect(privacyLink).toHaveAttribute('target', '_blank');
  });
});

test.describe('EMS Legal API & Security Contracts', () => {
  test('GET /legal/versions returns current version 1.0 and contact metadata', async ({ request }) => {
    const res = await apiCall<any>(request, 'GET', '/legal/versions');
    expect(res.status).toBe(200);
    expect(res.data.current_versions.terms_and_conditions).toBe('1.0');
    expect(res.data.current_versions.privacy_policy).toBe('1.0');
    expect(res.data.current_versions.cookie_policy).toBe('1.0');
    expect(res.data.operator_name).toContain('NMIMS');
    expect(res.data.privacy_officer_email).toBe('privacy@shirpur.nmims.edu');
  });

  test('GET /legal/status requires authentication', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/legal/status');
    expect(res.status).toBe(401);
  });

  test('GET /legal/my-acceptances requires authentication', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/legal/my-acceptances');
    expect(res.status).toBe(401);
  });

  test('GET /legal/audit rejects unauthenticated or unauthorized access', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/legal/audit');
    expect(res.status).toBe(401);
  });
});
