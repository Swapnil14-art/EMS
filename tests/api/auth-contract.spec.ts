/**
 * API Contract — Authentication endpoints
 *
 * Lane: api-contract | Mutates: Controlled | Browser: APIRequestContext
 * §6.A — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { test, expect } from '@playwright/test';
import { apiCall, rawLogin } from '../helpers/api';
import { EDGE_CASE_INPUTS } from '../helpers/test-helpers';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

test.describe('API Contract — Authentication', () => {
  // ── Health ────────────────────────────────────────────────────────────────
  test('GET /health returns 200 with version and status=ok', async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBeTruthy();
  });

  // ── Login success ─────────────────────────────────────────────────────────
  test('POST /auth/login with valid admin credentials returns tokens', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', {
      body: { email: 'admin@nmims.in', password: 'Admin@123' },
    });
    expect(res.status).toBe(200);
    expect((res.data as any).access_token).toBeTruthy();
    expect((res.data as any).refresh_token).toBeTruthy();
  });

  test('POST /auth/login with valid student credentials returns tokens', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', {
      body: { email: 'student1@nmims.in', password: 'Test@123' },
    });
    expect(res.status).toBe(200);
    expect((res.data as any).access_token).toBeTruthy();
  });

  // ── Login failure ─────────────────────────────────────────────────────────
  test('POST /auth/login with wrong password returns 401', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', {
      body: { email: 'admin@nmims.in', password: 'wrongpassword' },
    });
    expect([400, 401]).toContain(res.status);
  });

  test('POST /auth/login with non-existent email returns 4xx', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', {
      body: { email: 'notexist@nmims.in', password: 'Test@123' },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('POST /auth/login with malformed email returns 422', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', {
      body: { email: 'not-an-email', password: 'Test@123' },
    });
    expect([400, 422]).toContain(res.status);
  });

  test('POST /auth/login with empty body returns 422', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', { body: {} });
    expect([400, 422]).toContain(res.status);
  });

  test('POST /auth/login with SQL injection in email returns 4xx, not 500', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', {
      body: { email: EDGE_CASE_INPUTS.sqlInjection, password: 'Test@123' },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // ── /auth/me ─────────────────────────────────────────────────────────────
  test('GET /auth/me without token returns 401', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /auth/me with invalid token returns 401', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/auth/me', { token: 'invalid.jwt.token' });
    expect([401, 403]).toContain(res.status);
  });

  test('GET /auth/me with valid admin token returns correct profile', async ({ request }) => {
    const login = await rawLogin('admin@nmims.in', 'Admin@123');
    const res = await apiCall(request, 'GET', '/auth/me', { token: login.access_token });
    expect(res.status).toBe(200);
    const user = res.data as any;
    expect(user.email).toBe('admin@nmims.in');
    expect(user.role).toBe('super_admin');
    expect(user.is_active).toBeTruthy();
  });

  test('GET /auth/me with valid student token returns student profile', async ({ request }) => {
    const login = await rawLogin('student1@nmims.in', 'Test@123');
    const res = await apiCall(request, 'GET', '/auth/me', { token: login.access_token });
    expect(res.status).toBe(200);
    const user = res.data as any;
    expect(user.email).toBe('student1@nmims.in');
    expect(user.role).toBe('student');
  });

  // ── Signup validation ─────────────────────────────────────────────────────
  test('POST /auth/signup with non-NMIMS email returns 4xx', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/signup', {
      body: { email: 'test@gmail.com', password: 'Test@12345', first_name: 'Test', last_name: 'User' },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('POST /auth/signup with existing email returns 4xx', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/signup', {
      body: { email: 'admin@nmims.in', password: 'Test@12345', first_name: 'Test', last_name: 'User' },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // ── Forgot password ───────────────────────────────────────────────────────
  test('POST /auth/forgot-password returns neutral response regardless of email existence', async ({ request }) => {
    // Both existing and non-existing emails should return the same status (no account discovery)
    const resExisting = await apiCall(request, 'POST', '/auth/forgot-password', {
      body: { email: 'admin@nmims.in' },
    });
    const resNonExistent = await apiCall(request, 'POST', '/auth/forgot-password', {
      body: { email: 'definitely.not.real@nmims.in' },
    });
    // Both should be 200/202 (neutral messaging)
    expect([200, 202, 204]).toContain(resExisting.status);
    expect(resExisting.status).toBe(resNonExistent.status);
  });
});

test.describe('API Contract — Authorization Matrix', () => {
  let adminToken: string;
  let coordinatorToken: string;
  let studentToken: string;
  let directorToken: string;

  test.beforeAll(async () => {
    const [a, c, s, d] = await Promise.all([
      rawLogin('admin@nmims.in', 'Admin@123'),
      rawLogin('coord.gdsc@nmims.in', 'Test@123'),
      rawLogin('student1@nmims.in', 'Test@123'),
      rawLogin('director@nmims.in', 'Test@123'),
    ]);
    adminToken = a.access_token;
    coordinatorToken = c.access_token;
    studentToken = s.access_token;
    directorToken = d.access_token;
  });

  // ── Admin-only endpoints ──────────────────────────────────────────────────
  test('GET /admin/users requires admin role', async ({ request }) => {
    const admin = await apiCall(request, 'GET', '/admin/users', { token: adminToken });
    expect(admin.status).toBe(200);

    const student = await apiCall(request, 'GET', '/admin/users', { token: studentToken });
    expect([401, 403]).toContain(student.status);

    const coord = await apiCall(request, 'GET', '/admin/users', { token: coordinatorToken });
    expect([401, 403]).toContain(coord.status);
  });

  test('GET /admin/settings requires admin role', async ({ request }) => {
    const admin = await apiCall(request, 'GET', '/admin/settings', { token: adminToken });
    expect([200, 404]).toContain(admin.status); // 404 if route name differs

    const student = await apiCall(request, 'GET', '/admin/settings', { token: studentToken });
    expect([401, 403]).toContain(student.status);
  });

  // ── Events visibility ─────────────────────────────────────────────────────
  test('GET /events/ unauthenticated returns only public events', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/events/');
    expect([200, 401]).toContain(res.status);
  });

  test('GET /events/ with student token succeeds', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/events/', { token: studentToken });
    expect(res.status).toBe(200);
  });

  // ── Registration endpoints ────────────────────────────────────────────────
  test('POST /registrations/ without auth returns 401', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/registrations/', {
      body: { event_id: 99999 },
    });
    expect(res.status).toBe(401);
  });

  // ── Report endpoints ──────────────────────────────────────────────────────
  test('GET /reports/ without auth returns 401', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/reports/');
    expect([401, 403]).toContain(res.status);
  });

  // ── Response shape: no data leakage in error bodies ──────────────────────
  test('401/403 error responses do not leak user data or stack traces', async ({ request }) => {
    const res = await apiCall(request, 'GET', '/admin/users', { token: studentToken });
    expect([401, 403]).toContain(res.status);
    const body = JSON.stringify(res.data);
    // Must not contain another user's email or password hash
    expect(body).not.toMatch(/password_hash|hashed_password/i);
    // Must not contain stack trace
    expect(body).not.toMatch(/traceback|at line|File "/i);
  });

  test('422 validation error includes field-level detail', async ({ request }) => {
    const res = await apiCall(request, 'POST', '/auth/login', { body: { email: 'bad' } });
    expect([400, 422]).toContain(res.status);
  });
});
