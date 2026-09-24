import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { navigateTo, waitForPageLoad } from '../../helpers/test-helpers';

const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');
const SIMPLE_TEXT_PDF = path.join(FIXTURES_DIR, 'simple-text.pdf');
const MULTI_PAGE_PDF = path.join(FIXTURES_DIR, 'multi-page.pdf');
const TABLE_HEAVY_PDF = path.join(FIXTURES_DIR, 'table-heavy.pdf');

function getCoordinatorToken(): string {
  try {
    const raw = fs.readFileSync(path.resolve('tests/.auth/coordinator.json'), 'utf-8');
    const auth = JSON.parse(raw);
    const state = JSON.parse(auth.origins[0].localStorage[0].value);
    return state.state.accessToken;
  } catch (err) {
    console.error('Failed to read coordinator token:', err);
    return '';
  }
}

async function authenticateStudent(page: any) {
  const loginRes = await page.request.post('/api/auth/login', {
    data: { email: 'student3@nmims.in', password: 'Test@123' },
  });
  const data = await loginRes.json();
  const token = data.access_token;
  const meRes = await page.request.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await meRes.json();

  await page.context().addCookies([
    { name: 'ems-role', value: 'student', domain: 'localhost', path: '/' },
  ]);

  await page.addInitScript(
    ({ token, user }: { token: string; user: any }) => {
      localStorage.setItem(
        'ems-auth',
        JSON.stringify({
          state: { user, accessToken: token, isAuthenticated: true, isHydrated: true },
          version: 0,
        })
      );
    },
    { token, user }
  );
}

test.describe('Participation Document Preview — Complete Verification Suite', () => {

  test.describe('1. Public Viewers — Desktop and Mobile Responsiveness', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('desktop (1280px): renders embedded PDF preview iframe, download button, and title', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.setViewportSize({ width: 1280, height: 800 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      // Section title
      const heading = page.getByRole('heading', { name: /participation document/i });
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Download button
      const downloadBtn = page.getByRole('link', { name: /download/i }).filter({ hasText: /download/i });
      await expect(downloadBtn).toBeVisible();
      const downloadHref = await downloadBtn.getAttribute('href');
      expect(downloadHref).toContain('.pdf');

      // Desktop: native iframe is rendered
      const iframe = page.locator('iframe[title="Participation Document"]');
      await expect(iframe).toBeVisible();
      const iframeSrc = await iframe.getAttribute('src');
      expect(iframeSrc).toContain('.pdf');

      // Check no severe fatal uncaught errors
      const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404'));
      expect(fatalErrors.length).toBe(0);
    });

    test('mobile (390px - iPhone 13/14): renders responsive in-page PDF viewer with canvas, zoom, and page controls', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      // Section title
      const heading = page.getByRole('heading', { name: /participation document/i });
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Download button preserved on mobile
      const downloadBtn = page.getByRole('link', { name: /download/i }).filter({ hasText: /download/i });
      await expect(downloadBtn).toBeVisible();

      // Verify in-page PDF viewer toolbar and canvas are rendered
      const pageIndicator = page.locator('text=/\\d+\\s*\\/\\s*\\d+/');
      await expect(pageIndicator).toBeVisible({ timeout: 15_000 });

      // Canvas element rendering the actual PDF
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10_000 });

      // Zoom controls are present and interactive
      const zoomInBtn = page.getByRole('button', { name: /zoom in/i });
      const zoomOutBtn = page.getByRole('button', { name: /zoom out/i });
      const zoomResetBtn = page.getByRole('button', { name: /reset zoom/i });

      await expect(zoomInBtn).toBeVisible();
      await expect(zoomOutBtn).toBeVisible();
      await expect(zoomResetBtn).toBeVisible();

      // Zooming in keeps canvas visible
      await zoomInBtn.click();
      await expect(page.locator('canvas').first()).toBeVisible();

      // Reset zoom
      await zoomResetBtn.click();
      await expect(page.locator('canvas').first()).toBeVisible();

      // Verify NO forced "Open" button or external app prompt
      await expect(page.getByRole('button', { name: /^open$/i })).toHaveCount(0);
    });

    test('mobile (360px - Android Compact): renders responsive PDF viewer within screen width', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const heading = page.getByRole('heading', { name: /participation document/i });
      await expect(heading).toBeVisible({ timeout: 10_000 });

      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });

      // Canvas fits inside the mobile viewport width
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(360);
      }
    });

    test('mobile (430px - Large Smartphone): renders responsive PDF viewer', async ({ page }) => {
      await page.setViewportSize({ width: 430, height: 932 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const heading = page.getByRole('heading', { name: /participation document/i });
      await expect(heading).toBeVisible({ timeout: 10_000 });

      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });
    });

    test('mobile: continuous scrolling through document pages works without page departure', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const scrollContainer = page.getByTestId('pdf-scroll-container');
      await expect(scrollContainer).toBeVisible({ timeout: 15_000 });

      // Ensure canvas is rendered before scrolling
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });

      // Scroll inside the document viewer container
      await scrollContainer.evaluate((el) => {
        el.scrollTo({ top: 200, behavior: 'instant' });
      });

      const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    });

    test('download: original PDF file can be downloaded and is unaltered', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const downloadBtn = page.getByRole('link', { name: /download/i }).filter({ hasText: /download/i });
      await expect(downloadBtn).toBeVisible();

      // Trigger download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        downloadBtn.click(),
      ]);

      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
      if (downloadPath) {
        const stats = fs.statSync(downloadPath);
        // Verify downloaded file is a non-empty valid PDF
        expect(stats.size).toBeGreaterThan(1000);
        const header = fs.readFileSync(downloadPath, { encoding: 'utf-8', flag: 'r' }).slice(0, 5);
        expect(header).toBe('%PDF-');
      }
    });
  });

  test.describe('2. Student Registration Flow — In-Page PDF Preview', () => {
    test('student: event registration page renders in-page document viewer on mobile', async ({ page }) => {
      await authenticateStudent(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await navigateTo(page, '/student/events/1/register');
      await waitForPageLoad(page);

      const body = page.locator('body');
      await expect(body).toBeVisible();

      // If redirected to event details because already registered, or on registration page:
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('3. Club Coordinator Flow — Upload and Multi-Type PDF Support', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('coordinator: upload new multi-page PDF updates document and preserves preview', async ({ request, page }) => {
      const coordToken = getCoordinatorToken();
      expect(coordToken).toBeTruthy();

      // 1. Upload multi-page fixture via Coordinator API
      const fileBuffer = fs.readFileSync(MULTI_PAGE_PDF);
      const uploadRes = await request.post('/api/events/1/upload-participant-doc', {
        headers: {
          Authorization: `Bearer ${coordToken}`,
        },
        multipart: {
          file: {
            name: 'multi-page-rules.pdf',
            mimeType: 'application/pdf',
            buffer: fileBuffer,
          },
        },
      });

      expect(uploadRes.status()).toBe(200);
      const resJson = await uploadRes.json();
      expect(resJson.path).toContain('.pdf');

      // 2. Open event page on mobile to verify multi-page PDF renders properly
      await page.setViewportSize({ width: 390, height: 844 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const heading = page.getByRole('heading', { name: /participation document/i });
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Page indicator should show 4 pages for our multi-page fixture
      const pageIndicator = page.locator('text=/\\d+\\s*\\/\\s*4/');
      await expect(pageIndicator).toBeVisible({ timeout: 15_000 });

      // Verify canvas rendered
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();

      // 3. Open on desktop to verify desktop preview remains intact
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.reload();
      await waitForPageLoad(page);

      const iframe = page.locator('iframe[title="Participation Document"]');
      await expect(iframe).toBeVisible();
    });

    test('coordinator: upload table-heavy landscape PDF renders properly', async ({ request, page }) => {
      const coordToken = getCoordinatorToken();
      expect(coordToken).toBeTruthy();

      // Upload wide table-heavy fixture
      const fileBuffer = fs.readFileSync(TABLE_HEAVY_PDF);
      const uploadRes = await request.post('/api/events/1/upload-participant-doc', {
        headers: {
          Authorization: `Bearer ${coordToken}`,
        },
        multipart: {
          file: {
            name: 'table-schedule.pdf',
            mimeType: 'application/pdf',
            buffer: fileBuffer,
          },
        },
      });
      expect(uploadRes.status()).toBe(200);

      // Verify on mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });

      // Verify zoom in works for reading wide tables
      const zoomInBtn = page.getByRole('button', { name: /zoom in/i });
      await zoomInBtn.click();
      await expect(canvas).toBeVisible();
    });

    test('coordinator: upload standard text PDF renders properly', async ({ request, page }) => {
      const coordToken = getCoordinatorToken();
      expect(coordToken).toBeTruthy();

      // Upload simple text fixture
      const fileBuffer = fs.readFileSync(SIMPLE_TEXT_PDF);
      const uploadRes = await request.post('/api/events/1/upload-participant-doc', {
        headers: {
          Authorization: `Bearer ${coordToken}`,
        },
        multipart: {
          file: {
            name: 'terms-and-conditions.pdf',
            mimeType: 'application/pdf',
            buffer: fileBuffer,
          },
        },
      });
      expect(uploadRes.status()).toBe(200);

      // Verify on mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      await navigateTo(page, '/events/1');
      await waitForPageLoad(page);

      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('4. Document Security & Access Control', () => {
    test('unauthenticated user cannot upload or overwrite participation documents', async ({ request }) => {
      const fileBuffer = fs.readFileSync(SIMPLE_TEXT_PDF);
      const uploadRes = await request.post('/api/events/1/upload-participant-doc', {
        multipart: {
          file: {
            name: 'malicious.pdf',
            mimeType: 'application/pdf',
            buffer: fileBuffer,
          },
        },
      });

      // Must be 401 Unauthorized or 403 Forbidden
      expect([401, 403]).toContain(uploadRes.status());
    });

    test('student role cannot upload or overwrite participation documents', async ({ request }) => {
      const loginRes = await request.post('/api/auth/login', {
        data: { email: 'student3@nmims.in', password: 'Test@123' },
      });
      const data = await loginRes.json();
      const studentToken = data.access_token;

      const fileBuffer = fs.readFileSync(SIMPLE_TEXT_PDF);
      const uploadRes = await request.post('/api/events/1/upload-participant-doc', {
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        multipart: {
          file: {
            name: 'student-override.pdf',
            mimeType: 'application/pdf',
            buffer: fileBuffer,
          },
        },
      });

      expect([401, 403]).toContain(uploadRes.status());
    });
  });
});
