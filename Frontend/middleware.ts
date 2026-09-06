import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Role → allowed route prefix mapping.
 * Each role may only access its own prefix and common routes.
 */
const ROLE_ROUTES: Record<string, string> = {
  super_admin:      '/admin',
  director:         '/director',
  associate_dean:   '/associate_dean',
  club_coordinator: '/club_coordinator',
  student:          '/student',
  additional:       '/additional',
};

const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin:      '/admin',
  director:         '/director',
  associate_dean:   '/associate_dean',
  club_coordinator: '/club_coordinator',
  student:          '/student',
  additional:       '/additional',
};

/** Routes that are accessible without any authentication. */
function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/calendar' ||
    pathname.startsWith('/calendar/') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/venue-calendar') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  );
}

/** Protected dashboard prefixes — redirect to login if no auth. */
function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/director') ||
    pathname.startsWith('/associate_dean') ||
    pathname.startsWith('/club_coordinator') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/additional') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/change-password') ||
    pathname.startsWith('/complete-profile')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public / static paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Read the lightweight role cookie set by the frontend on login
  const roleCookie = request.cookies.get('ems-role')?.value;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // No role cookie → not authenticated → send to login
  if (!roleCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Role cookie present — enforce route ownership
  for (const [role, prefix] of Object.entries(ROLE_ROUTES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (roleCookie !== role) {
        // Wrong role — redirect to the user's own dashboard
        const dashUrl = request.nextUrl.clone();
        dashUrl.pathname = ROLE_DASHBOARDS[roleCookie] || '/';
        return NextResponse.redirect(dashUrl);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
