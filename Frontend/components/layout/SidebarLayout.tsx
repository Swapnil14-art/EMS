'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, Calendar, MapPin, Mail, Settings,
  BarChart3, LogOut, KeyRound, GraduationCap, Building2, SlidersHorizontal, Home, Menu,
  FileText, FlaskConical, ShieldCheck, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services';
import { getInitials, cn } from '@/lib/utils';
import { RoleBadge } from '@/components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { BrandMark } from './BrandMark';
import { AppFooter } from './AppFooter';

type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: number };

const NAV_MAP: Record<string, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Events', href: '/admin/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Documents', href: '/admin/documents', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-4.5 h-4.5" /> },
    { label: 'Clubs', href: '/admin/clubs', icon: <GraduationCap className="w-4.5 h-4.5" /> },
    { label: 'Schools', href: '/admin/departments', icon: <Building2 className="w-4.5 h-4.5" /> },
    { label: 'Venues', href: '/admin/venues', icon: <MapPin className="w-4.5 h-4.5" /> },
    { label: 'Permissions', href: '/admin/permissions', icon: <ShieldCheck className="w-4.5 h-4.5" /> },
    { label: 'Email Log', href: '/admin/email-log', icon: <Mail className="w-4.5 h-4.5" /> },
    { label: 'System Controls', href: '/admin/system-controls', icon: <SlidersHorizontal className="w-4.5 h-4.5" /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4.5 h-4.5" /> },
  ],
  director: [
    { label: 'Dashboard', href: '/director', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Events', href: '/director/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Documents', href: '/director/documents', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { label: 'History', href: '/director/history', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { label: 'Venues', href: '/director/venues', icon: <MapPin className="w-4.5 h-4.5" /> },
  ],
  associate_dean: [
    { label: 'Dashboard', href: '/associate_dean', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Events', href: '/associate_dean/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Documents', href: '/associate_dean/documents', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { label: 'History', href: '/associate_dean/history', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { label: 'Clubs', href: '/associate_dean/clubs', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { label: 'Venues', href: '/associate_dean/venues', icon: <MapPin className="w-4.5 h-4.5" /> },
  ],
  club_coordinator: [
    { label: 'Dashboard', href: '/club_coordinator', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Browse Events', href: '/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'My Events', href: '/club_coordinator/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Create Event', href: '/club_coordinator/events/create', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Documents', href: '/club_coordinator/documents', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { label: 'Report', href: '/club_coordinator/report', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { label: 'RnD Report', href: '/club_coordinator/rnd-report', icon: <BarChart3 className="w-4.5 h-4.5" /> },
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'My Registrations', href: '/student/registrations', icon: <GraduationCap className="w-4.5 h-4.5" /> },
  ],
};

const DASHBOARD_ROOTS = ['/admin', '/student', '/club_coordinator', '/director', '/associate_dean', '/additional'];

function buildAdditionalNav(perms: string[]): NavItem[] {
  const items: NavItem[] = [
    { label: 'Dashboard', href: '/additional', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
  ];
  if (perms.includes('view_events') || perms.includes('view_event_details')) {
    items.push({ label: 'Events', href: '/additional/events', icon: <Calendar className="w-4.5 h-4.5" /> });
  }
  if (perms.includes('view_reports') || perms.includes('submit_reports')) {
    items.push({ label: 'Reports', href: '/additional/reports', icon: <FileText className="w-4.5 h-4.5" /> });
  }
  if (perms.includes('view_rnd_reports') || perms.includes('submit_rnd_reports')) {
    items.push({ label: 'RnD Reports', href: '/additional/rnd-reports', icon: <FlaskConical className="w-4.5 h-4.5" /> });
  }
  if (perms.includes('manage_permissions')) {
    items.push({ label: 'Permissions', href: '/additional/permissions', icon: <ShieldCheck className="w-4.5 h-4.5" /> });
  }
  return items;
}

interface SidebarLayoutProps { children: React.ReactNode; }

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) { router.replace('/login'); }
    else if (user.force_password_change) { router.replace('/change-password'); }
  }, [user, router]);

  if (!user) return null;

  const userNavItems = user.role === 'additional'
    ? buildAdditionalNav(user.extra_permissions ?? [])
    : (NAV_MAP[user.role] || []);
  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-4.5 h-4.5" /> },
    ...userNavItems
  ];

  const handleLogout = async () => {
    try { await authService.logout(); } catch { }
    clearAuth();
    toast.success('Logged out');
    router.push('/');
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    // Find the single best (longest) matching nav item for the current pathname
    const bestMatchingHref = navItems
      .map(n => n.href)
      .filter(h => {
        if (h === '/') return pathname === '/';
        if (DASHBOARD_ROOTS.includes(h)) return pathname === h;
        return pathname === h || pathname.startsWith(`${h}/`);
      })
      .sort((a, b) => b.length - a.length)[0];

    const isActive = item.href === bestMatchingHref;
    return (
      <Link href={item.href}
        title={sidebarCollapsed ? item.label : undefined}
        className={cn('nav-item relative select-none', sidebarCollapsed && 'lg:px-3', isActive && 'nav-item-active')}>
        <span className="flex-shrink-0">{item.icon}</span>
        <span className={cn('truncate', sidebarCollapsed && 'lg:sr-only')}>{item.label}</span>
        {item.badge && (
          <span className={cn('ml-auto px-1.5 py-0.5 bg-[var(--btn-danger-bg)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold', sidebarCollapsed && 'lg:absolute lg:right-1 lg:top-1')}>{item.badge}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <nav className={cn('min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3', sidebarCollapsed && 'lg:px-2')} aria-label="Main navigation">
      {navItems.map(item => <NavLink key={item.href} item={item} />)}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--page-bg)]">
      {/* Full-width dashboard header */}
      <header className="z-30 flex h-16 flex-shrink-0 items-center gap-3 border-b border-[var(--card-border)] bg-[var(--surface-bg)] px-4 sm:gap-5 lg:px-6">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="-ml-1.5 rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-subtle)] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BrandMark abbreviated link={false} className="min-w-0 flex-1" />
        <div className="relative flex items-center gap-3">
          <p className="hidden text-sm font-medium text-[var(--text-secondary)] lg:block">Welcome, <span className="font-semibold text-[var(--text-primary)]">{user.name?.split(' ')[0] || 'User'}</span></p>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen} aria-label="Open profile menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand-primary)] ring-1 ring-[rgb(var(--nmims-navy)/0.12)] transition-colors hover:bg-[var(--status-info-bg)]">
            {getInitials(user.name)}
          </button>
          {userMenuOpen && <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--surface-bg)] py-1.5 shadow-card-lg">
            <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block border-b border-[var(--card-border)] px-4 py-3 transition-colors hover:bg-[var(--surface-subtle)]"><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.name}</p><p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p><RoleBadge role={user.role} className="mt-2" /></Link>
            <Link href="/change-password" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--brand-primary)]"><KeyRound className="h-4 w-4" />Change Password</Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-danger)] transition-colors hover:bg-[var(--status-danger-bg)]"><LogOut className="h-4 w-4" />Log Out</button>
          </div>}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-[rgb(var(--neutral-900)/0.35)] backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          'flex h-full flex-shrink-0 flex-col border-r border-[var(--card-border)] bg-[var(--surface-bg)]',
          'fixed lg:relative z-50 lg:z-auto top-0 left-0 bottom-0',
          'w-72 transition-[transform,width] duration-300 ease-in-out lg:w-60',
          !mobileOpen && '-translate-x-full lg:translate-x-0',
          sidebarCollapsed && 'lg:w-[4.75rem]'
        )}>
          <div className={cn('border-b border-[var(--card-border)] px-4 py-3', sidebarCollapsed && 'lg:px-3')}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label="Toggle navigation menu"
                aria-pressed={sidebarCollapsed}
                title="Menu"
                className={cn('hidden select-none items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--brand-primary)] lg:flex', sidebarCollapsed && 'lg:px-2')}
              >
                <span className="relative h-4 w-4" aria-hidden="true">
                  <span className={cn('absolute left-0 top-1 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-in-out', sidebarCollapsed && 'top-[7px] rotate-45')} />
                  <span className={cn('absolute left-0 top-[7px] block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-in-out', sidebarCollapsed && 'scale-x-0 opacity-0')} />
                  <span className={cn('absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-in-out', sidebarCollapsed && 'top-[7px] -rotate-45')} />
                </span>
                <span className={cn(sidebarCollapsed && 'lg:sr-only')}>Menu</span>
              </button>
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-subtle)] lg:hidden">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
      <AppFooter compact />
    </div>
  );
}
