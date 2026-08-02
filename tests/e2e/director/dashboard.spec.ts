/**
 * Director Dashboard & Approval Tests
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { navigateTo, waitForPageLoad, assertPageLoaded, verifySidebarItems } from '../../helpers/test-helpers';

const DIRECTOR_STATE = path.resolve('tests/.auth/director.json');

test.describe('Director Dashboard', () => {
  test.use({ storageState: DIRECTOR_STATE });

  test('should load director dashboard', async ({ page }) => {
    await navigateTo(page, '/director');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display director sidebar navigation', async ({ page }) => {
    await navigateTo(page, '/director');
    await waitForPageLoad(page);
    await verifySidebarItems(page, ['Dashboard', 'Events', 'History', 'Venues']);
  });

  test('should load events page (pending approvals)', async ({ page }) => {
    await navigateTo(page, '/director/events');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should load approval history page', async ({ page }) => {
    await navigateTo(page, '/director/history');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should load venue management page', async ({ page }) => {
    await navigateTo(page, '/director/venues');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});
