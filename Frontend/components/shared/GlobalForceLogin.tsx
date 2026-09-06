'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { setAccessToken, setRefreshToken } from '@/lib/api';
import { systemService } from '@/lib/services';

import { ROLE_DASHBOARD } from '@/lib/utils';

/**
 * Module 1: HydrationGate — blocks rendering until Zustand has rehydrated
 * from localStorage. Uses a simple client-side useEffect to guarantee it
 * fires even when zustand's onRehydrateStorage is unreliable in SSR.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Manually inject tokens into the API client just to be absolutely sure
    // they are available before any components render and make requests.
    const state = useAuthStore.getState();
    if (state.accessToken) setAccessToken(state.accessToken);
    if (state.refreshToken) setRefreshToken(state.refreshToken);
    if (state.user && (state.accessToken || state.refreshToken)) {
      useAuthStore.setState({ isAuthenticated: true });
    }
    useAuthStore.setState({ isHydrated: true });
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--page-bg)]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--status-info-text)] to-[var(--status-info-text)]" />
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
  const { user, isHydrated } = useAuthStore();
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
    if (!isHydrated) return;

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
        return;
      }

      // Profile completion is only required for students and club coordinators
      const requiresProfile = ['student', 'club_coordinator'].includes(user.role);
      // Profile is complete if explicitly flagged, or if user has a valid name populated
      const isProfileCompleted = user.profile_completed ?? !!(user.name?.trim());

      if (!user.force_password_change && requiresProfile && !isProfileCompleted && pathname !== '/complete-profile') {
        router.replace('/complete-profile');
        return;
      }

      // Role-based route enforcement across dashboard areas
      const roleRoutes: Record<string, string> = {
        '/admin': 'super_admin',
        '/director': 'director',
        '/associate_dean': 'associate_dean',
        '/club_coordinator': 'club_coordinator',
        '/student': 'student',
        '/additional': 'additional',
      };

      for (const [prefix, requiredRole] of Object.entries(roleRoutes)) {
        if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
          if (user.role !== requiredRole) {
            router.replace(ROLE_DASHBOARD[user.role] || '/');
            return;
          }
        }
      }
      return;
    }

    if (isAuthRoute) return;

    // Immediately protect dashboards from unauthenticated access
    const isProtectedDashboard =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/director') ||
      pathname.startsWith('/associate_dean') ||
      pathname.startsWith('/club_coordinator') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/additional') ||
      pathname.startsWith('/profile');

    if (isProtectedDashboard) {
      router.replace('/login');
      return;
    }

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
  }, [pathname, user, isHydrated, router, forceLogin]);

  return null;
}
