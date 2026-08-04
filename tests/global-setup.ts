/**
 * Global Setup — Authenticates all test users and saves storage states.
 *
 * Runs once before all projects. Authenticates via REST API and writes
 * persisted Zustand auth storage state files instantly.
 */
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

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
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  // Verify API health
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error(`API health check failed: ${res.status}`);
    console.log('✅ API health check passed');
  } catch (err) {
    console.error('❌ API is not reachable. Ensure Docker services are running.');
    throw err;
  }

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const storageFile = path.join(AUTH_DIR, `${key}.json`);

    try {
      // Authenticate via API
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });

      if (!loginRes.ok) {
        console.warn(`⚠️ Could not authenticate ${key} (${user.email}): ${loginRes.status}`);
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

      const userPayload = userData
        ? {
            ...userData,
            is_active: true,
            is_first_login: false,
            force_password_change: false,
          }
        : {
            email: user.email,
            role: user.role,
            is_active: true,
            force_password_change: false,
            is_first_login: false,
          };

      // Construct Playwright StorageState with Zustand auth state
      const storageState = {
        cookies: [],
        origins: [
          {
            origin: BASE_URL,
            localStorage: [
              {
                name: 'ems-auth',
                value: JSON.stringify({
                  state: {
                    user: userPayload,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isHydrated: true,
                  },
                  version: 0,
                }),
              },
            ],
          },
        ],
      };

      fs.writeFileSync(storageFile, JSON.stringify(storageState, null, 2));
      console.log(`✅ Saved instant auth state for: ${key} (${user.email})`);
    } catch (err) {
      console.warn(`⚠️ Failed to setup auth for ${key}: ${err}`);
      fs.writeFileSync(storageFile, JSON.stringify({ cookies: [], origins: [] }));
    }
  }
}

export default globalSetup;
