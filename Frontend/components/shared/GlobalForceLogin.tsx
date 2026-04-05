'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { setAccessToken, setRefreshToken } from '@/lib/api';
import { systemService } from '@/lib/services';

/**
 * Module 1: HydrationGate — blocks rendering until Zustand has rehydrated
 * from localStorage. Uses a simple client-side useEffect to guarantee it
 * fires even when zustand's onRehydrateStorage is unreliable in SSR.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Manually inject tokens into the API client just to be absolutely sure
    // they are available before any components render and make requests.
    const state = useAuthStore.getState();
    if (state.accessToken) setAccessToken(state.accessToken);
    if (state.refreshToken) setRefreshToken(state.refreshToken);
    if (state.user && (state.accessToken || state.refreshToken)) {
      useAuthStore.setState({ isAuthenticated: true });
    }
    
    // Hydration is complete after first client-side render
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--page-bg)]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600" />
          <span className="text-sm font-medium text-[var(--text-muted)]">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Module 7: GlobalForceLogin — redirects unauthenticated/incomplete users.
 * Runs ONLY after hydration is complete.
 * Checks the backend system config to enforce Force Login Mode.
 */
export function GlobalForceLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [forceLogin, setForceLogin] = useState<boolean | null>(null);
  const configFetched = useRef(false);

  // Fetch the system config once to check Force Login Mode
  useEffect(() => {
    if (configFetched.current) return;
    configFetched.current = true;

    systemService.getPublicConfig()
      .then(data => {
        setForceLogin(data?.force_login ?? false);
      })
      .catch(() => {
        // If we can't fetch config (e.g., not logged in, 403), default to not forcing
        setForceLogin(false);
      });
  }, []);

  useEffect(() => {

    const isAuthRoute = 
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup') || 
      pathname.startsWith('/change-password') || 
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/complete-profile');

    if (user) {
      // Security Interceptors: force onboarding steps
      if (user.force_password_change && pathname !== '/change-password') {
        router.replace('/change-password');
      } else if (!user.force_password_change && !user.profile_completed && pathname !== '/complete-profile') {
        router.replace('/complete-profile');
      }
      return;
    }

    if (isAuthRoute) return;

    // Public routes accessible without authentication
    const isPublicRoute =
      pathname === '/' ||
      pathname.startsWith('/events') ||
      pathname.startsWith('/venue-calendar') ||
      pathname.startsWith('/about');

    // If Force Login Mode is ON, redirect all public routes to login
    if (forceLogin === true) {
      router.replace('/login');
      return;
    }

    // If Force Login Mode is OFF, allow public routes
    if (isPublicRoute) return;

    // For unauthenticated users on protected routes (dashboard, admin, etc.), redirect to login
    router.replace('/login');
  }, [pathname, user, router, forceLogin]);

  return null;
}
