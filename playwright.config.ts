import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// ─── Environment ─────────────────────────────────────────────────────────────
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/.results',

  /* ── Execution ──────────────────────────────────────────────────────────── */
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 1,
  workers: IS_CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },

  /* ── Global Setup ───────────────────────────────────────────────────────── */
  globalSetup: path.resolve('./tests/global-setup.ts'),

  /* ── Reporters ──────────────────────────────────────────────────────────── */
  reporter: IS_CI
    ? [['html', { open: 'never' }], ['json', { outputFile: 'tests/.results/report.json' }]]
    : [['html', { open: 'on-failure' }], ['list']],

  /* ── Shared Options ─────────────────────────────────────────────────────── */
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    // Ignore HTTPS errors for local dev
    ignoreHTTPSErrors: true,
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept': 'application/json, text/html',
    },
  },

  /* ── Browser Projects ───────────────────────────────────────────────────── */
  projects: [
    // Auth setup — runs first, saves storage state for all roles
    {
      name: 'auth-setup',
      testDir: './tests',
      testMatch: /global-setup\.ts/,
      teardown: undefined,
    },

    // ── Desktop Browsers ──
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.resolve('tests/.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: path.resolve('tests/.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: path.resolve('tests/.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
    },

    // ── Mobile Viewports ──
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: path.resolve('tests/.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: path.resolve('tests/.auth/admin.json'),
      },
      dependencies: ['auth-setup'],
    },
  ],

  /* ── Dev Server ─────────────────────────────────────────────────────────── */
  // Docker Compose is managed externally; just verify it's up
  webServer: {
    command: 'echo "Docker services expected to be running"',
    url: `${API_URL}/health`,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});

// Export for use in fixtures
export { BASE_URL, API_URL };
