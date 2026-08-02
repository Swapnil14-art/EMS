/**
 * Additional Role Dashboard & Management Tests
 * Dynamic permission-based navigation and views
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { navigateTo, waitForPageLoad, assertPageLoaded } from '../../helpers/test-helpers';

const ADMIN_STATE = path.resolve('tests/.auth/admin.json');

test.describe('Additional Role Dashboard (as Admin context test)', () => {
  test.use({ storageState: ADMIN_STATE });

  test('should load admin view of additional role permissions', async ({ page }) => {
    await navigateTo(page, '/admin/permissions');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
    await expect(page.getByText(/permission|role/i).first()).toBeVisible();
  });
});
