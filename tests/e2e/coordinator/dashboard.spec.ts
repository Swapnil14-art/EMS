/**
 * Club Coordinator Dashboard & Event Management Tests
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import {
  navigateTo, waitForPageLoad, assertPageLoaded, verifySidebarItems,
} from '../../helpers/test-helpers';

const COORD_STATE = path.resolve('tests/.auth/coordinator.json');

test.describe('Coordinator Dashboard', () => {
  test.use({ storageState: COORD_STATE });

  test('should load coordinator dashboard', async ({ page }) => {
    await navigateTo(page, '/club_coordinator');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display coordinator sidebar navigation', async ({ page }) => {
    await navigateTo(page, '/club_coordinator');
    await waitForPageLoad(page);
    await verifySidebarItems(page, ['Dashboard', 'My Events', 'Create Event']);
  });

  test('should show event statistics or empty state', async ({ page }) => {
    await navigateTo(page, '/club_coordinator');
    await waitForPageLoad(page);
    const cards = page.locator('.card, [class*="card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });
});

test.describe('Coordinator — My Events', () => {
  test.use({ storageState: COORD_STATE });

  test('should load my events page', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/events');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should allow search/filter on events', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/events');
    await waitForPageLoad(page);
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Coordinator — Create Event', () => {
  test.use({ storageState: COORD_STATE });

  test('should load create event page with form', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/events/create');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
    // Should have a form with event fields
    const inputs = page.locator('input, select, textarea');
    expect(await inputs.count()).toBeGreaterThan(3);
  });

  test('should not submit empty event form', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/events/create');
    await waitForPageLoad(page);
    // Try to find and click submit without filling
    const submitBtn = page.getByRole('button', { name: /create|submit|save|next/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      // Should stay on the same page (validation prevents submission)
      await expect(page.url()).toContain('/create');
    }
  });
});

test.describe('Coordinator — Reports', () => {
  test.use({ storageState: COORD_STATE });

  test('should load report page', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/report');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should load RnD report page', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/rnd-report');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});

test.describe('Coordinator — Documents', () => {
  test.use({ storageState: COORD_STATE });

  test('should load documents page', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/documents');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});

test.describe('Coordinator — Venues', () => {
  test.use({ storageState: COORD_STATE });

  test('should load venue calendar from coordinator', async ({ page }) => {
    await navigateTo(page, '/club_coordinator/venues');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});
