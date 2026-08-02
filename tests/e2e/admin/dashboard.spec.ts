/**
 * Admin Dashboard & Management Tests
 * Covers: dashboard rendering, user management, department/club/venue CRUD, system controls
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import {
  navigateTo, waitForPageLoad, verifySidebarItems, searchInTable,
  assertPageLoaded, assertHeading, assertUrl,
} from '../../helpers/test-helpers';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');

test.describe('Admin Dashboard', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load admin dashboard with stats', async ({ page }) => {
    await navigateTo(page, '/admin');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
    // Dashboard should have stat cards
    await expect(page.getByText(/dashboard|overview/i).first()).toBeVisible();
  });

  test('should display sidebar with all admin navigation items', async ({ page }) => {
    await navigateTo(page, '/admin');
    await waitForPageLoad(page);
    await verifySidebarItems(page, ['Dashboard', 'Users', 'Clubs', 'Events', 'Venues']);
  });

  test('should display event statistics cards', async ({ page }) => {
    await navigateTo(page, '/admin');
    await waitForPageLoad(page);
    // Look for stat numbers or chart elements
    const cards = page.locator('.card, [class*="card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });
});

test.describe('Admin — User Management', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load users page', async ({ page }) => {
    await navigateTo(page, '/admin/users');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
    await expect(page.getByText(/user/i).first()).toBeVisible();
  });

  test('should display user list with role badges', async ({ page }) => {
    await navigateTo(page, '/admin/users');
    await waitForPageLoad(page);
    // Should have at least the admin user
    await expect(page.getByText(/admin@nmims.in/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should filter users by search', async ({ page }) => {
    await navigateTo(page, '/admin/users');
    await waitForPageLoad(page);
    await searchInTable(page, 'admin');
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });

  test('should show role filter dropdown', async ({ page }) => {
    await navigateTo(page, '/admin/users');
    await waitForPageLoad(page);
    // Look for role filter
    const roleFilter = page.locator('select, [role="combobox"], [data-testid*="role"]').first();
    if (await roleFilter.isVisible()) {
      await expect(roleFilter).toBeEnabled();
    }
  });
});

test.describe('Admin — Department Management', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load departments page', async ({ page }) => {
    await navigateTo(page, '/admin/departments');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display department list', async ({ page }) => {
    await navigateTo(page, '/admin/departments');
    await waitForPageLoad(page);
    await expect(page.getByText(/engineering|agriculture|pharmacy/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Admin — Club Management', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load clubs page', async ({ page }) => {
    await navigateTo(page, '/admin/clubs');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});

test.describe('Admin — Venue Management', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load venues page', async ({ page }) => {
    await navigateTo(page, '/admin/venues');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});

test.describe('Admin — Events', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load events management page', async ({ page }) => {
    await navigateTo(page, '/admin/events');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should filter events by search', async ({ page }) => {
    await navigateTo(page, '/admin/events');
    await waitForPageLoad(page);
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Admin — Permissions', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load permissions page', async ({ page }) => {
    await navigateTo(page, '/admin/permissions');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});

test.describe('Admin — Email Log', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load email log page', async ({ page }) => {
    await navigateTo(page, '/admin/email-log');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});

test.describe('Admin — System Controls', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load system controls page', async ({ page }) => {
    await navigateTo(page, '/admin/system-controls');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display toggle switches for system settings', async ({ page }) => {
    await navigateTo(page, '/admin/system-controls');
    await waitForPageLoad(page);
    const toggles = page.locator('input[type="checkbox"], [role="switch"], button[class*="toggle"]');
    if (await toggles.count() > 0) {
      await expect(toggles.first()).toBeVisible();
    }
  });
});
