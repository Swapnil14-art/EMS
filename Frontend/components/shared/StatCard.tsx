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
  blue:   { bg: 'bg-[var(--card-bg)]',   icon: 'bg-[rgb(var(--btn-primary-bg)/0.1)] text-[rgb(var(--color-primary))]',   val: 'text-[rgb(var(--color-primary))]' },
  green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700' },
  amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',  val: 'text-amber-700' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-[var(--text-danger)]',      val: 'text-[var(--text-danger)]' },
  purple: { bg: 'bg-[var(--card-bg)]', icon: 'bg-[rgb(var(--color-secondary)/0.1)] text-[var(--text-secondary)]',val: 'text-[var(--text-secondary)]' },
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600',val: 'text-indigo-700' },
};

export function StatCard({ title, value, icon, color = 'blue', subtitle, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-5 hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{title}</p>
          <p className={cn('font-display font-bold text-3xl', c.val)}>{value}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-semibold mt-1', trend.up ? 'text-emerald-600' : 'text-[var(--text-danger)]')}>
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
