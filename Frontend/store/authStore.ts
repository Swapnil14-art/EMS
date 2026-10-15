import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { setAccessToken, clearAccessToken, setRefreshToken, clearRefreshToken } from '@/lib/api';

// ─── Cookie helpers (readable by Next.js middleware for server-side RBAC) ─────
function setRoleCookie(role: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `ems-role=${role}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
}

function clearRoleCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'ems-role=; path=/; SameSite=Lax; max-age=0';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (accessToken) setAccessToken(accessToken);
        if (refreshToken) setRefreshToken(refreshToken);
        setRoleCookie(user.role);
        set({
          user,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        clearAccessToken();
        clearRefreshToken();
        clearRoleCookie();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'ems-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore both tokens to in-memory on hydration
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
        if (state?.refreshToken) {
          setRefreshToken(state.refreshToken);
        }
        // If we have all three, mark as authenticated immediately
        if (state?.user && (state?.accessToken || state?.refreshToken)) {
          useAuthStore.setState({ isAuthenticated: true });
        }
        // Always mark hydrated — use setState directly so it works even
        // when state is undefined (empty localStorage, new tab, errors)
        useAuthStore.setState({ isHydrated: true });
      },
    }
  )
);

// Derived selectors
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUserRole = (): UserRole | null => useAuthStore((s) => s.user?.role ?? null);
export const useDepartmentId = () => useAuthStore((s) => s.user?.department_id ?? null);
