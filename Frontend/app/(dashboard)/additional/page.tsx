'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  Calendar, FileText, FlaskConical, ShieldCheck, Eye,
  Upload, Lock, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const PERM_TILES = [
  {
    perms: ['view_events', 'view_event_details'],
    label: 'Events',
    desc: 'Browse and view event details',
    href: '/additional/events',
    icon: Calendar,
    color: 'from-[var(--status-info-text)] to-[var(--status-info-text)]',
    bg: 'bg-[var(--status-info-bg)]',
    text: 'text-[var(--status-info-text)]',
  },
  {
    perms: ['view_reports', 'submit_reports'],
    label: 'Reports',
    desc: 'View or submit post-event reports',
    href: '/additional/reports',
    icon: FileText,
    color: 'from-[var(--status-success-text)] to-[var(--status-info-text)]',
    bg: 'bg-[var(--status-success-bg)]',
    text: 'text-[var(--status-success-text)]',
  },
  {
    perms: ['view_rnd_reports', 'submit_rnd_reports'],
    label: 'RnD Reports',
    desc: 'View or submit RnD reports',
    href: '/additional/rnd-reports',
    icon: FlaskConical,
    color: 'from-[var(--status-info-text)] to-[var(--status-info-text)]',
    bg: 'bg-[var(--status-info-bg)]',
    text: 'text-[var(--status-info-text)]',
  },
  {
    perms: ['manage_permissions'],
    label: 'Permissions',
    desc: 'Grant or revoke access for Additional users',
    href: '/additional/permissions',
    icon: ShieldCheck,
    color: 'from-[var(--status-warning-text)] to-[var(--status-warning-text)]',
    bg: 'bg-[var(--status-warning-bg)]',
    text: 'text-[var(--status-warning-text)]',
  },
];

export default function AdditionalDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'additional') router.replace('/');
  }, [user, router]);

  if (!user) return null;

  const perms: string[] = user.extra_permissions ?? [];
  const grantedTiles = PERM_TILES.filter(t => t.perms.some(p => perms.includes(p)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">
          Welcome, {user.name?.split(' ')[0]}. Your access is determined by permissions granted to you.
        </p>
      </div>

      {grantedTiles.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] flex items-center justify-center">
            <Lock className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">No permissions assigned yet</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">Contact your system administrator to get access.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grantedTiles.map(tile => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.label}
                href={tile.href}
                className="card p-6 group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg">{tile.label}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{tile.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tile.perms.filter(p => perms.includes(p)).map(p => (
                    <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tile.bg} ${tile.text} uppercase tracking-wide`}>
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Locked tiles */}
      {PERM_TILES.filter(t => !t.perms.some(p => perms.includes(p))).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Not accessible</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERM_TILES.filter(t => !t.perms.some(p => perms.includes(p))).map(tile => {
              const Icon = tile.icon;
              return (
                <div key={tile.label} className="card p-5 opacity-40 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{tile.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{tile.desc}</p>
                    </div>
                    <Lock className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
