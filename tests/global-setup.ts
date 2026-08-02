/**
 * Global Setup — Authenticates all test users and saves storage states.
 *
 * Runs once before all projects. Creates persisted auth sessions so
 * individual tests don't need to log in repeatedly.
 */
import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

// ─── Test Users (from seed scripts) ──────────────────────────────────────────
export const TEST_USERS = {
  admin: { email: 'admin@nmims.in', password: 'Admin@123', role: 'super_admin' },
  director: { email: 'director@nmims.in', password: 'Test@123', role: 'director' },
  dean: { email: 'dean.engg@nmims.in', password: 'Test@123', role: 'associate_dean' },
  coordinator: { email: 'coord.gdsc@nmims.in', password: 'Test@123', role: 'club_coordinator' },
  student: { email: 'student1@nmims.in', password: 'Test@123', role: 'student' },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;

const AUTH_DIR = path.resolve('tests/.auth');

async function globalSetup(_config: FullConfig) {
  // Ensure auth directory exists
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  // Verify API is healthy before proceeding
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error(`API health check failed: ${res.status}`);
    console.log('✅ API health check passed');
  } catch (err) {
    console.error('❌ API is not reachable. Ensure Docker services are running.');
    throw err;
  }

  const browser = await chromium.launch();

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const storageFile = path.join(AUTH_DIR, `${key}.json`);

    try {
      // Login via API to get tokens
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });

      if (!loginRes.ok) {
        console.warn(`⚠️  Could not authenticate ${key} (${user.email}): ${loginRes.status}`);
        // Write empty storage state so tests can handle gracefully
        fs.writeFileSync(storageFile, JSON.stringify({ cookies: [], origins: [] }));
        continue;
      }

      const loginData = await loginRes.json();
      const accessToken = loginData.access_token;
      const refreshToken = loginData.refresh_token;

      // Fetch user profile
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = meRes.ok ? await meRes.json() : null;

      // Create a browser context and inject auth state into localStorage
      const context = await browser.newContext({ baseURL: BASE_URL });
      const page = await context.newPage();
      await page.goto(BASE_URL);

      // Inject the Zustand persisted auth store into localStorage
      await page.evaluate(
        ({ user: u, accessToken: at, refreshToken: rt }) => {
          const storeState = {
            state: {
              user: u,
              accessToken: at,
              refreshToken: rt,
              isAuthenticated: true,
              isHydrated: true,
            },
            version: 0,
          };
          localStorage.setItem('ems-auth', JSON.stringify(storeState));
        },
        {
          user: userData
            ? {
                ...userData,
                is_active: userData.status === 'active',
                force_password_change: userData.is_first_login,
              }
            : { email: user.email, role: user.role, is_active: true, force_password_change: false },
          accessToken,
          refreshToken,
        }
      );

      await context.storageState({ path: storageFile });
      await context.close();
      console.log(`✅ Auth state saved for: ${key} (${user.email})`);
    } catch (err) {
      console.warn(`⚠️  Failed to setup auth for ${key}: ${err}`);
      fs.writeFileSync(storageFile, JSON.stringify({ cookies: [], origins: [] }));
    }
  }

  await browser.close();
}

export default globalSetup;
