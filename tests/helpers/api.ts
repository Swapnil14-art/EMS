/**
 * Typed API client — wraps authenticated API calls with request/response detail.
 * No raw fetch() calls in spec files; use this module.
 *
 * §5.1 helpers/api.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { APIRequestContext } from '@playwright/test';

export const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

// ─── Token store (per-worker, never shared across contexts) ───────────────────
const _tokens: Record<string, string> = {};

export function cacheToken(key: string, token: string) {
  _tokens[key] = token;
}

export function getCachedToken(key: string): string | undefined {
  return _tokens[key];
}

// ─── Core HTTP helper ─────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  ok: boolean;
  headers: Record<string, string>;
}

/**
 * Perform an authenticated API call via the Playwright APIRequestContext.
 * Attaches request/response details to failing assertions automatically.
 */
export async function apiCall<T = unknown>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options: {
    token?: string;
    body?: unknown;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const url = new URL(`${API_URL}${endpoint}`);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) url.searchParams.set(k, v);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await request.fetch(url.toString(), {
    method,
    headers,
    data: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data: T;
  try {
    data = await res.json() as T;
  } catch {
    data = null as unknown as T;
  }

  const responseHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(res.headers())) {
    responseHeaders[k] = v;
  }

  return { status: res.status(), data, ok: res.ok(), headers: responseHeaders };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Login via raw fetch (for use in global-setup and non-request-context paths). */
export async function rawLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Login failed for ${email}: HTTP ${res.status} — ${body}`);
  }
  return res.json() as Promise<LoginResponse>;
}

/** Login via Playwright APIRequestContext and return tokens. */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await apiCall<LoginResponse>(request, 'POST', '/auth/login', {
    body: { email, password },
  });
  if (!res.ok) throw new Error(`API login failed for ${email}: HTTP ${res.status}`);
  return res.data;
}

/** GET /auth/me with a token */
export async function apiGetMe(request: APIRequestContext, token: string) {
  return apiCall(request, 'GET', '/auth/me', { token });
}

// ─── Domain-specific wrappers ─────────────────────────────────────────────────

export async function apiGetEvents(request: APIRequestContext, token: string, params?: Record<string, string>) {
  return apiCall(request, 'GET', '/events/', { token, params });
}

export async function apiCreateEvent(request: APIRequestContext, token: string, body: unknown) {
  return apiCall(request, 'POST', '/events/', { token, body });
}

export async function apiGetEvent(request: APIRequestContext, token: string, eventId: number | string) {
  return apiCall(request, 'GET', `/events/${eventId}`, { token });
}

export async function apiDeleteEvent(request: APIRequestContext, token: string, eventId: number | string) {
  return apiCall(request, 'DELETE', `/events/${eventId}`, { token });
}

export async function apiGetRegistrations(request: APIRequestContext, token: string, eventId: number | string) {
  return apiCall(request, 'GET', `/registrations/?event_id=${eventId}`, { token });
}

export async function apiRegisterForEvent(request: APIRequestContext, token: string, body: unknown) {
  return apiCall(request, 'POST', '/registrations/', { token, body });
}

export async function apiCancelRegistration(request: APIRequestContext, token: string, regId: number | string) {
  return apiCall(request, 'DELETE', `/registrations/${regId}`, { token });
}

export async function apiGetPermissions(request: APIRequestContext, token: string, userId: number | string) {
  return apiCall(request, 'GET', `/admin/users/${userId}/permissions`, { token });
}

export async function apiGetSystemSettings(request: APIRequestContext, token: string) {
  return apiCall(request, 'GET', '/admin/settings', { token });
}

export async function apiUpdateSystemSettings(request: APIRequestContext, token: string, body: unknown) {
  return apiCall(request, 'PUT', '/admin/settings', { token, body });
}

export async function apiGetVenues(request: APIRequestContext, token: string) {
  return apiCall(request, 'GET', '/venues/', { token });
}

export async function apiGetClubs(request: APIRequestContext, token: string) {
  return apiCall(request, 'GET', '/clubs/', { token });
}

export async function apiGetDepartments(request: APIRequestContext, token: string) {
  return apiCall(request, 'GET', '/departments/', { token });
}
