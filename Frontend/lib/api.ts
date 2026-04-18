import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

import { extractApiError } from '@/lib/transformers';

// ─── Module 9: Environment validation ─────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

if (typeof window !== 'undefined' && !BASE_URL) {
  console.warn(
    '[EMS] NEXT_PUBLIC_API_URL is not set. API calls will fail. ' +
    'Add NEXT_PUBLIC_API_URL to your .env.local file.'
  );
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s timeout — generous for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token storage (in-memory, not persisted) ─────────────────────────────────
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export const setAccessToken = (token: string) => {
  _accessToken = token;
};

export const clearAccessToken = () => {
  _accessToken = null;
};

export const setRefreshToken = (token: string) => {
  _refreshToken = token;
};

export const clearRefreshToken = () => {
  _refreshToken = null;
};

export const getAccessToken = () => _accessToken;
export const getRefreshToken = () => _refreshToken;

// ─── Normalized API Error ─────────────────────────────────────────────────────
/**
 * Standardized error shape returned from all service calls.
 * The response interceptor normalizes error.message via extractApiError()
 * so components should simply use err.message for toast display.
 */
export interface ApiErrorResponse {
  status: number;
  detail: string;
  raw?: any;
}

export function isApiError(err: unknown): err is AxiosError {
  return axios.isAxiosError(err);
}

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: silent refresh on 401 ─────────────────────────────
// Module 1: Safety limits on concurrent refresh queuing
const MAX_QUEUED_REQUESTS = 20;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ─── Module 7: Handle 403 Forbidden ─────────────────────────────────────
    if (error.response?.status === 403) {
      const detail = (error.response?.data as any)?.detail;
      error.message = typeof detail === 'string' && detail
        ? detail
        : 'You do not have permission to perform this action.';
      toast.error(error.message, { id: 'forbidden-error' });
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or login requests
      if (
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        return Promise.reject(error);
      }

      // No refresh token available — force logout
      if (!_refreshToken) {
        clearAccessToken();
        clearRefreshToken();
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      // Queue concurrent requests while refreshing
      if (isRefreshing) {
        // Module 1: Guard against infinite queue growth
        if (failedQueue.length >= MAX_QUEUED_REQUESTS) {
          return Promise.reject(new Error('Too many concurrent retries. Please refresh the page.'));
        }
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint directly (bypass interceptors)
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: _refreshToken }
        );
        const newToken = data.access_token;
        const newRefresh = data.refresh_token;

        // Store new tokens
        setAccessToken(newToken);
        if (newRefresh) setRefreshToken(newRefresh);

        // Update Zustand store with new tokens
        const store = useAuthStore.getState();
        if (store.user) {
          store.setAuth(store.user, newToken, newRefresh || _refreshToken || '');
        }

        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state; layouts will handle redirecting to /login
        clearAccessToken();
        clearRefreshToken();
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ─── Module 2 + 11: Centralize error messages and toast network failures ──
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const msg = 'Cannot connect to server. Please check your internet connection.';
      error.message = msg;
      // Module 11: Always toast network errors (deduplicated by ID)
      toast.error(msg, { id: 'network-error' });
    } else {
      error.message = extractApiError(error, 'Something went wrong');
    }

    return Promise.reject(error);
  }
);

export default api;
