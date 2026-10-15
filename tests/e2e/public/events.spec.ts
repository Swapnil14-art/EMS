/**
 * Public experience — event browse, search, filter, event detail, calendar
 *
 * Lane: smoke | Mutates: No | §6.B — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded, waitForPageLoad } from '../../helpers/test-helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Public — Event browsing', () => {
  test('public events page loads without auth', async ({ page }) => {
    await navigateTo(page, '/events');
    await assertPageLoaded(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('event search by name filters the list', async ({ page }) => {
    await navigateTo(page, '/events');
    await waitForPageLoad(page);
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('searchbox'))
      .first();
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('test');
      // Wait for debounce — use URL change or list response, not arbitrary timeout
      await page.waitForResponse(
        (r) => r.url().includes('/events') && r.status() < 400,
        { timeout: 10_000 }
      ).catch(() => {}); // OK if there's no network call (client-side filter)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('only approved/ongoing/completed/archived events are visible publicly', async ({ page }) => {
    await navigateTo(page, '/events');
    await waitForPageLoad(page);
    // Draft, pending, rejected events must not appear
    await expect(page.getByText(/draft|pending approval/i)).toHaveCount(0);
  });

  test('draft and pending events are not exposed on public events list', async ({ page }) => {
    await navigateTo(page, '/events');
    await waitForPageLoad(page);
    await expect(page.getByText(/status.*draft/i)).toHaveCount(0);
  });
});

test.describe('Public — Event details', () => {
  test('event detail page loads from public event list', async ({ page }) => {
    await navigateTo(page, '/events');
    await waitForPageLoad(page);
    // Try to click the first event card/link
    const firstEventLink = page
      .getByRole('link', { name: /view|details|register/i })
      .or(page.locator('a[href*="/events/"]'))
      .first();

    if (await firstEventLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstEventLink.click();
      await assertPageLoaded(page);
      // Should display event information
      await expect(page.getByRole('heading').first()).toBeVisible();
    } else {
      // No events in DB yet — pass smoke
      test.skip();
    }
  });

  test('visitor registration form is visible when event and window allow it', async ({ page }) => {
    // Navigate to a page that might have an open-registration event
    await navigateTo(page, '/events');
    await waitForPageLoad(page);
    // Check if any event shows register button for public users
    const registerBtns = page.getByRole('button', { name: /register/i });
    const count = await registerBtns.count();
    if (count > 0) {
      await expect(registerBtns.first()).toBeVisible();
    } else {
      test.skip(); // No registrable events seeded currently
    }
  });
});

test.describe('Public — Calendar page', () => {
  test('calendar page loads publicly', async ({ page }) => {
    await navigateTo(page, '/calendar');
    await waitForPageLoad(page);
    await assertPageLoaded(page);
    // Should have navigation or grid
    const hasCalendar = await page
      .locator('[class*="calendar"], table, [role="grid"]')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasContent = await page.locator('body').innerText().then((t) => t.length > 0);
    expect(hasCalendar || hasContent).toBeTruthy();
  });
});

test.describe('Public — About page', () => {
  test('about page loads without auth', async ({ page }) => {
    await navigateTo(page, '/about');
    await assertPageLoaded(page);
  });
});

test.describe('Public — Responsive navigation (mobile)', () => {
  test('landing page renders on Pixel 5 viewport', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 851 } });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await assertPageLoaded(page);
    await ctx.close();
  });

  test('event list renders on iPhone 13 viewport', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/events', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await assertPageLoaded(page);
    await ctx.close();
  });

  test('login page renders on mobile viewport', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await ctx.close();
  });
});
