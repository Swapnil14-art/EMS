/**
 * Role Fixture — per-role browser context with health monitoring.
 *
 * Merges auth.fixture and data.fixture into a single composable test extension.
 * Detects console errors, unhandled exceptions, and 5xx responses automatically.
 *
 * §5.1 fixtures/role.fixture.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { mergeTests, expect } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as dataTest } from './data.fixture';

// ─── Merged fixture ───────────────────────────────────────────────────────────
export const test = mergeTests(authTest, dataTest);
export { expect };

// ─── Storage state path helpers (for test.use({ storageState: ... })) ─────────
import path from 'path';

export const AUTH_STATES = {
  admin:               path.resolve('tests/.auth/admin.json'),
  director:            path.resolve('tests/.auth/director.json'),
  dean:                path.resolve('tests/.auth/dean.json'),
  coordinator:         path.resolve('tests/.auth/coordinator.json'),
  student:             path.resolve('tests/.auth/student.json'),
  additionalViewer:    path.resolve('tests/.auth/additional.viewer.json'),
  additionalManager:   path.resolve('tests/.auth/additional.manager.json'),
  additionalNone:      path.resolve('tests/.auth/additional.none.json'),
  additionalFull:      path.resolve('tests/.auth/additional.full.json'),
  studentCoordinator:  path.resolve('tests/.auth/student.coordinator.json'),
  facultyCoordinator:  path.resolve('tests/.auth/faculty.coordinator.json'),
  unauthenticated:     { cookies: [] as [], origins: [] as [] },
} as const;
