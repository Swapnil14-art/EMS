'use client';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo';
  subtitle?: string;
  trend?: { value: string; up: boolean };
}

const colorMap = {
  blue:   { bg: 'bg-[var(--status-info-bg)]', icon: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]', val: 'text-[var(--status-info-text)]' },
  green:  { bg: 'bg-[var(--status-success-bg)]', icon: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]', val: 'text-[var(--status-success-text)]' },
  amber:  { bg: 'bg-[var(--status-warning-bg)]', icon: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]', val: 'text-[var(--status-warning-text)]' },
  red:    { bg: 'bg-[var(--status-danger-bg)]', icon: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]', val: 'text-[var(--status-danger-text)]' },
  purple: { bg: 'bg-[var(--surface-subtle)]', icon: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]', val: 'text-[var(--text-secondary)]' },
  indigo: { bg: 'bg-[var(--status-info-bg)]', icon: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]', val: 'text-[var(--status-info-text)]' },
};

export function StatCard({ title, value, icon, color = 'blue', subtitle, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-5 hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 truncate" title={title}>{title}</p>
          <p className={cn('font-display font-bold text-2xl sm:text-3xl', c.val)}>{value}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1 truncate" title={subtitle}>{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-semibold mt-1', trend.up ? 'text-[var(--status-success-text)]' : 'text-[var(--text-danger)]')}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', c.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Skeleton version
export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-8 w-16 rounded mb-2" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}
