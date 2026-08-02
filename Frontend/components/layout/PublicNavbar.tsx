'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut, KeyRound, ChevronDown, Menu, X, User,
  LayoutDashboard, Bell, Settings, Shield, BookOpen,
  Users, Calendar, MapPin, Mail, BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services';
import { ROLE_LABELS, ROLE_DASHBOARD, getInitials } from '@/lib/utils';
import { RoleBadge } from '@/components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { BrandMark } from './BrandMark';

// Role-based menu items for mobile menu only
const ROLE_MENU_ITEMS: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  super_admin: [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Clubs', href: '/admin/clubs', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Events', href: '/admin/events', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Venues', href: '/admin/venues', icon: <MapPin className="w-4 h-4" /> },
    { label: 'Email Log', href: '/admin/email-log', icon: <Mail className="w-4 h-4" /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ],
  director: [
    { label: 'Dashboard', href: '/director', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Pending Approvals', href: '/director/pending', icon: <Bell className="w-4 h-4" /> },
    { label: 'History', href: '/director/history', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Venues', href: '/director/venues', icon: <MapPin className="w-4 h-4" /> },
  ],
  associate_dean: [
    { label: 'Dashboard', href: '/associate_dean', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Pending Approvals', href: '/associate_dean/pending', icon: <Bell className="w-4 h-4" /> },
    { label: 'Override Requests', href: '/associate_dean/overrides', icon: <Shield className="w-4 h-4" /> },
    { label: 'Clubs', href: '/associate_dean/clubs', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Venues', href: '/associate_dean/venues', icon: <MapPin className="w-4 h-4" /> },
  ],
  club_coordinator: [
    { label: 'Dashboard', href: '/club_coordinator', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Events', href: '/club_coordinator/events', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Create Event', href: '/club_coordinator/events/create', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Documents', href: '/club_coordinator/documents', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Report', href: '/club_coordinator/report', icon: <BarChart3 className="w-4 h-4" /> },
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Browse Events', href: '/student/events', icon: <Calendar className="w-4 h-4" /> },
    { label: 'My Registrations', href: '/student/registrations', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Venues', href: '/student/venues', icon: <MapPin className="w-4 h-4" /> },
  ],
};

export default function PublicNavbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const roleMenuItems = user ? ROLE_MENU_ITEMS[user.role] || [] : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <BrandMark className="max-w-[13rem] sm:max-w-none" />

          {/* Center nav links (public) */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/#events" className="nav-item text-sm">Events</Link>
            <Link href="/#calendar" className="nav-item text-sm">Event Calendar</Link>
            <Link href="/about" className="nav-item text-sm">About</Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Log In</Link>
                <Link href="/signup" className="btn-primary text-sm">Sign Up</Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* User email dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl hover:bg-[var(--page-bg)] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full flex items-center justify-center text-xs font-bold">
                      {getInitials(user!.name)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[140px]">{user!.email}</p>
                      <RoleBadge role={user!.role} className="text-[10px] px-1.5 py-0" />
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-card-lg border border-[var(--card-border)] py-2 animate-slide-down z-50">
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors cursor-pointer group">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[rgb(var(--color-primary))]">{user!.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user!.email}</p>
                        <RoleBadge role={user!.role} className="mt-1.5" />
                      </Link>
                      <div className="py-1">
                        <Link
                          href={ROLE_DASHBOARD[user!.role]}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[rgb(var(--color-primary))] transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>

                        <Link
                          href="/change-password"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[rgb(var(--color-primary))] transition-colors"
                        >
                          <KeyRound className="w-4 h-4" /> Change Password
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-[var(--page-bg)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--card-border)] py-3 space-y-1 animate-slide-down">
            {!isAuthenticated ? (
              <>
                <Link href="/#events" className="nav-item" onClick={() => setMobileOpen(false)}>Events</Link>
                <Link href="/#calendar" className="nav-item" onClick={() => setMobileOpen(false)}>Event Calendar</Link>
                <Link href="/about" className="nav-item" onClick={() => setMobileOpen(false)}>About</Link>
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="btn-secondary flex-1 justify-center text-sm" onClick={() => setMobileOpen(false)}>Log In</Link>
                  <Link href="/signup" className="btn-primary flex-1 justify-center text-sm" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </div>
              </>
            ) : (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2 flex items-center gap-3 hover:bg-[var(--card-bg)] rounded-xl mb-2 transition-colors group">
                  <div className="w-9 h-9 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {getInitials(user!.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[rgb(var(--color-primary))]">{user!.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user!.email}</p>
                  </div>
                </Link>
                {roleMenuItems?.map(item => (
                  <Link key={item.href} href={item.href} className="nav-item" onClick={() => setMobileOpen(false)}>
                    {item.icon} {item.label}
                  </Link>
                ))}
                <div className="border-t border-[var(--card-border)] pt-2 mt-2">

                  <Link href="/change-password" className="nav-item" onClick={() => setMobileOpen(false)}>
                    <KeyRound className="w-4 h-4" /> Change Password
                  </Link>
                  <button onClick={handleLogout} className="nav-item w-full text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] hover:text-[var(--text-danger)]">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
