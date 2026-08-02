/**
 * Shared Pages: Calendar, Profile, Event Detail
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { navigateTo, waitForPageLoad, assertPageLoaded } from '../../helpers/test-helpers';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');

test.describe('Event Calendar (Shared)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load calendar page', async ({ page }) => {
    await navigateTo(page, '/calendar');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display venue-based calendar view', async ({ page }) => {
    await navigateTo(page, '/calendar');
    await waitForPageLoad(page);
    // Should have date navigation or calendar grid
    const hasCalendar = await page.locator('[class*="calendar"], table, [role="grid"]').first().isVisible().catch(() => false);
    const hasContent = await page.locator('.card, [class*="card"]').first().isVisible().catch(() => false);
    expect(hasCalendar || hasContent).toBeTruthy();
  });
});

test.describe('User Profile (Shared)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load profile page', async ({ page }) => {
    await navigateTo(page, '/profile');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display current user info', async ({ page }) => {
    await navigateTo(page, '/profile');
    await waitForPageLoad(page);
    await expect(page.getByText(/admin@nmims.in|Super Admin/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Browse Events (Dashboard Shared)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load shared events browsing page', async ({ page }) => {
    await navigateTo(page, '/events');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});
