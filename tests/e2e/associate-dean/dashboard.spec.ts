/**
 * Associate Dean Dashboard & Approval Tests
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { navigateTo, waitForPageLoad, assertPageLoaded, verifySidebarItems } from '../../helpers/test-helpers';

const DEAN_STATE = path.resolve('tests/.auth/dean.json');

test.describe('Associate Dean Dashboard', () => {
  test.use({ storageState: DEAN_STATE });

  test('should load associate dean dashboard', async ({ page }) => {
    await navigateTo(page, '/associate_dean');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should display dean sidebar navigation', async ({ page }) => {
    await navigateTo(page, '/associate_dean');
    await waitForPageLoad(page);
    await verifySidebarItems(page, ['Dashboard', 'Events', 'History', 'Clubs', 'Venues']);
  });

  test('should load events page', async ({ page }) => {
    await navigateTo(page, '/associate_dean/events');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should load approval history', async ({ page }) => {
    await navigateTo(page, '/associate_dean/history');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should load department clubs', async ({ page }) => {
    await navigateTo(page, '/associate_dean/clubs');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });

  test('should load venues management', async ({ page }) => {
    await navigateTo(page, '/associate_dean/venues');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
  });
});
