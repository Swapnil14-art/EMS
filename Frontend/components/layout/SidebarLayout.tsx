'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, Calendar, MapPin, Mail, Settings,
  Bell, BarChart3, Shield, ChevronLeft, ChevronRight, LogOut, KeyRound,
  ChevronDown, GraduationCap, Building2, SlidersHorizontal, Home, Menu, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services';
import { ROLE_LABELS, getInitials, cn } from '@/lib/utils';
import { RoleBadge } from '@/components/shared/StatusBadge';
import toast from 'react-hot-toast';

type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: number };

// API mapped from user roles — navigation items per role
const NAV_MAP: Record<string, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-4.5 h-4.5" /> },
    { label: 'Clubs', href: '/admin/clubs', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { label: 'Schools', href: '/admin/departments', icon: <Building2 className="w-4.5 h-4.5" /> },
    { label: 'Events', href: '/admin/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Venues', href: '/admin/venues', icon: <MapPin className="w-4.5 h-4.5" /> },
    { label: 'Email Log', href: '/admin/email-log', icon: <Mail className="w-4.5 h-4.5" /> },
    { label: 'System Controls', href: '/admin/system-controls', icon: <SlidersHorizontal className="w-4.5 h-4.5" /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4.5 h-4.5" /> },
  ],
  director: [
    { label: 'Dashboard', href: '/director', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Events', href: '/director/events', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'History', href: '/director/history', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { label: 'Venues', href: '/director/venues', icon: <MapPin className="w-4.5 h-4.5" /> },
  ],
  associate_dean: [
    { label: 'Dashboard', href: '/associate_dean', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'Events', href: '/associate_dean/events', icon: <Calendar className="w-4.5 h-4.5" /> },
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
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { label: 'Event Calendar', href: '/calendar', icon: <Calendar className="w-4.5 h-4.5" /> },
    { label: 'My Registrations', href: '/student/registrations', icon: <GraduationCap className="w-4.5 h-4.5" /> },
    { label: 'Venues', href: '/student/venues', icon: <MapPin className="w-4.5 h-4.5" /> },
  ],
};

const DASHBOARD_ROOTS = ['/admin', '/student', '/club_coordinator', '/director', '/associate_dean'];

interface SidebarLayoutProps { children: React.ReactNode; }

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) { router.replace('/login'); }
    else if (user.force_password_change) { router.replace('/change-password'); }
  }, [user, router]);

  if (!user) return null;

  const userNavItems = NAV_MAP[user.role] || [];
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
    const isActive = pathname === item.href || (!DASHBOARD_ROOTS.includes(item.href) && pathname.startsWith(item.href));
    return (
      <Link href={item.href}
        className={cn('nav-item relative', isActive && 'nav-item-active')}>
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {item.badge && !collapsed && (
          <span className="ml-auto px-1.5 py-0.5 bg-[var(--btn-danger-bg)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold">{item.badge}</span>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--btn-danger-bg)] text-[var(--btn-primary-text)] rounded-full text-[10px] font-bold flex items-center justify-center">{item.badge}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + collapse */}
      <div className={cn("flex items-center p-4 border-b border-[var(--card-border)]", collapsed ? "flex-col justify-center gap-4" : "justify-between")}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[var(--btn-primary-text)] font-bold font-display text-sm">E</span>
            </div>
            <div>
              <p className="font-display font-bold text-[var(--text-primary)] text-sm leading-none">EMS</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">NMIMS Shirpur</p>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--btn-primary-text)] font-bold font-display text-sm">E</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted text-[var(--text-muted)] transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 -mr-1.5 rounded-lg hover:bg-slate-100 text-[var(--text-muted)] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems?.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-[var(--card-border)] p-3">
        <div className={cn('relative', collapsed && 'flex justify-center')}>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn('flex items-center gap-2.5 w-full rounded-xl p-2 hover:bg-slate-50 transition-colors', collapsed && 'justify-center w-auto')}>
            <div className="w-8 h-8 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div className={cn(
              'absolute bottom-full mb-2 bg-white rounded-2xl shadow-card-lg border border-[var(--card-border)] py-2 z-50 w-56',
              collapsed ? 'left-full ml-2' : 'left-0 right-0'
            )}>
              <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors cursor-pointer group">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[rgb(var(--color-primary))]">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                <RoleBadge role={user.role} className="mt-1.5" />
              </Link>
              <Link href="/change-password" onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[rgb(var(--color-primary))] transition-colors">
                <KeyRound className="w-4 h-4" /> Change Password
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-danger)] hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--card-bg)] overflow-hidden relative">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col flex-shrink-0 bg-white border-r border-[var(--card-border)] sidebar-transition h-full',
        'fixed lg:relative z-50 lg:z-auto top-0 left-0 bottom-0',
        'transition-transform duration-300 ease-in-out',
        !mobileOpen && '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-60 lg:w-16' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-[var(--card-border)] px-4 lg:px-6 h-14 flex items-center gap-4 flex-shrink-0">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 text-[var(--text-secondary)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-sm font-medium text-[var(--text-primary)]">
            Welcome, {user.name?.split(' ')[0] || 'User'}
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
