'use client';
import { useAuthStore } from '@/store/authStore';

interface PermGateProps {
  /** Permission code required for 'additional' role users */
  perm: string;
  /** Roles that always have access regardless of perm (default: all non-additional roles) */
  allowedRoles?: string[];
  children: React.ReactNode;
  /** Optional fallback if no access */
  fallback?: React.ReactNode;
}

/**
 * PermGate — renders children only if the current user has access.
 *
 * Rules:
 *  - super_admin: always allowed
 *  - additional role: must have `perm` in extra_permissions
 *  - All other roles listed in allowedRoles: always allowed
 *  - Everything else: renders fallback (default: null)
 */
export function PermGate({
  perm,
  allowedRoles = ['director', 'associate_dean', 'club_coordinator'],
  children,
  fallback = null,
}: PermGateProps) {
  const { user } = useAuthStore();
  if (!user) return <>{fallback}</>;

  if (user.role === 'super_admin') return <>{children}</>;
  if (allowedRoles.includes(user.role)) return <>{children}</>;
  if (user.role === 'additional') {
    const perms = user.extra_permissions ?? [];
    return perms.includes(perm) ? <>{children}</> : <>{fallback}</>;
  }
  return <>{fallback}</>;
}

/** Utility hook — returns true if current user has access */
export function useHasPerm(perm: string, allowedRoles = ['director', 'associate_dean', 'club_coordinator']): boolean {
  const { user } = useAuthStore();
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (allowedRoles.includes(user.role)) return true;
  if (user.role === 'additional') return (user.extra_permissions ?? []).includes(perm);
  return false;
}
