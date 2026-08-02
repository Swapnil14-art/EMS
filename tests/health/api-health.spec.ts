/**
 * API Health Check Tests
 */
import { test, expect } from '@playwright/test';
import { API_URL, apiLogin } from '../helpers/test-helpers';

test.describe('API Health', () => {
  test('GET /health should return 200 OK', async () => {
    const res = await fetch(`${API_URL}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBeTruthy();
  });

  test('POST /auth/login should work with valid credentials', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nmims.in', password: 'Admin@123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.access_token).toBeTruthy();
    expect(data.refresh_token).toBeTruthy();
  });

  test('POST /auth/login should reject invalid credentials', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@nmims.in', password: 'wrong' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('GET /auth/me should reject unauthenticated requests', async () => {
    const res = await fetch(`${API_URL}/auth/me`);
    expect([401, 403]).toContain(res.status);
  });

  test('GET /auth/me should return user data with valid token', async () => {
    const loginData = await apiLogin('admin@nmims.in', 'Admin@123');
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.email).toBe('admin@nmims.in');
    expect(user.role).toBe('super_admin');
  });

  test('GET /departments/ should list departments', async () => {
    const loginData = await apiLogin('admin@nmims.in', 'Admin@123');
    const res = await fetch(`${API_URL}/departments/`, {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /venues/ should list venues', async () => {
    const loginData = await apiLogin('admin@nmims.in', 'Admin@123');
    const res = await fetch(`${API_URL}/venues/`, {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(res.status).toBe(200);
  });

  test('GET /clubs/ should list clubs', async () => {
    const loginData = await apiLogin('admin@nmims.in', 'Admin@123');
    const res = await fetch(`${API_URL}/clubs/`, {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(res.status).toBe(200);
  });
});
