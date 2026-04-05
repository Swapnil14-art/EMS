'use client';
import { cn, STATUS_LABELS, STATUS_COLORS, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import type { EventStatus, UserRole } from '@/types';

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}
export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return <span className={cn('badge', ROLE_COLORS[role], className)}>{ROLE_LABELS[role]}</span>;
}
export function EventTypeBadge({ type, className }: { type: string; className?: string }) {
  const colors: Record<string,string> = {
    technical:'bg-[rgb(var(--btn-primary-bg)/0.1)] text-[rgb(var(--color-primary))]', cultural:'bg-[rgb(var(--color-secondary)/0.1)] text-[var(--text-secondary)]',
    sports:'bg-green-100 text-green-700', seminar:'bg-amber-100 text-amber-700',
    workshop:'bg-orange-100 text-orange-700', hackathon:'bg-indigo-100 text-indigo-700',
    awareness:'bg-teal-100 text-teal-700', other:'bg-muted text-slate-700',
  };
  const labels: Record<string,string> = {
    technical:'Technical', cultural:'Cultural', sports:'Sports', seminar:'Seminar',
    workshop:'Workshop', hackathon:'Hackathon', awareness:'Awareness', other:'Other',
  };
  return <span className={cn('badge', colors[type]||colors.other, className)}>{labels[type]||type}</span>;
}
