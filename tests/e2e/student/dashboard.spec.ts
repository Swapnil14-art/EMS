/**
 * Student Dashboard & Registration Tests
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { navigateTo, waitForPageLoad, assertPageLoaded, verifySidebarItems } from '../../helpers/test-helpers';

const STUDENT_STATE = path.resolve('tests/.auth/student.json');

test.describe('Student Dashboard', () => {
  test.use({ storageState: STUDENT_STATE });

  test('should load student dashboard', async ({ page }) => {
    await navigateTo(page, '/student');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display student sidebar navigation', async ({ page }) => {
    await navigateTo(page, '/student');
    await waitForPageLoad(page);
    await verifySidebarItems(page, ['Dashboard', 'My Registrations', 'Venues']);
  });
});

test.describe('Student — Browse Events', () => {
  test.use({ storageState: STUDENT_STATE });

  test('should load events browsing page', async ({ page }) => {
    await navigateTo(page, '/student/events');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should allow event search', async ({ page }) => {
    await navigateTo(page, '/student/events');
    await waitForPageLoad(page);
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Student — Registrations', () => {
  test.use({ storageState: STUDENT_STATE });

  test('should load my registrations page', async ({ page }) => {
    await navigateTo(page, '/student/registrations');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should show empty state or registration list', async ({ page }) => {
    await navigateTo(page, '/student/registrations');
    await waitForPageLoad(page);
    // Either shows events or an empty state
    const hasContent = await page.locator('.card, [class*="card"], table').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no registration|no event|empty/i).first().isVisible().catch(() => false);
    expect(hasContent || hasEmpty).toBeTruthy();
  });
});

test.describe('Student — Venues', () => {
  test.use({ storageState: STUDENT_STATE });

  test('should not load venue calendar', async ({ page }) => {
    const response = await page.goto('/student/venues');
    expect(response?.status()).toBe(404);
  });
});
