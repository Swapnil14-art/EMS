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
    technical:'bg-[var(--status-info-bg)] text-[var(--status-info-text)]', cultural:'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
    sports:'bg-[var(--status-success-bg)] text-[var(--status-success-text)]', seminar:'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
    workshop:'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]', hackathon:'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
    awareness:'bg-[var(--status-info-bg)] text-[var(--status-info-text)]', other:'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  };
  const labels: Record<string,string> = {
    technical:'Technical', cultural:'Cultural', sports:'Sports', seminar:'Seminar',
    workshop:'Workshop', hackathon:'Hackathon', awareness:'Awareness', other:'Other',
  };
  return <span className={cn('badge', colors[type]||colors.other, className)}>{labels[type]||type}</span>;
}
