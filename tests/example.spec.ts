import { test, expect } from '@playwright/test';

test.describe('EMS Frontend Tests', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('should load login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/Event Management System|EMS/i);
  });
});
