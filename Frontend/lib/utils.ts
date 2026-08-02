import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import type { EventStatus, UserRole } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), fmt); } catch { return '—'; }
}

export function formatDateTime(dateStr: string) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a'); } catch { return '—'; }
}

export function timeAgo(dateStr: string) {
  if (!dateStr) return '—';
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); } catch { return '—'; }
}

export function isEventPast(endDateStr: string) {
  if (!endDateStr) return false;
  return isPast(new Date(endDateStr));
}

export function isEventFuture(startDateStr: string) {
  if (!startDateStr) return false;
  return isFuture(new Date(startDateStr));
}

// ─── Frontend Time-Based Classification ──────────────────────────────────────

export function getEventTimeStatus(startDatetime: string, endDatetime: string): 'upcoming' | 'ongoing' | 'past' {
  if (!startDatetime || !endDatetime) return 'upcoming';
  const now = new Date().getTime();
  const start = new Date(startDatetime).getTime();
  const end = new Date(endDatetime).getTime();
  const startMinus10 = start - 10 * 60000;
  const endPlus10 = end + 10 * 60000;

  if (now < startMinus10) return 'upcoming';
  if (now >= startMinus10 && now <= endPlus10) return 'ongoing';
  return 'past';
}

// ─── Status display ───────────────────────────────────────────────────────────
// API mapped from event lifecycle statuses

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft:                            'Draft',
  pending_associate_dean:           'Pending Associate Dean',
  pending_coordinator_parallel:     'Pending Co-Coordinators',
  pending_director:                 'Pending Director',
  suggested_changes:                'Changes Suggested',
  approved:                         'Upcoming',
  rejected:                         'Rejected',
  cancelled:                        'Cancelled',
  ongoing:                          'Ongoing',
  completed:                        'Completed',
  archived:                         'Archived',
};

export const STATUS_COLORS: Record<EventStatus, string> = {
  draft:                            'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  pending_associate_dean:           'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  pending_coordinator_parallel:     'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
  pending_director:                 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
  suggested_changes:                'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  approved:                         'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  rejected:                         'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]',
  cancelled:                        'bg-[var(--surface-subtle)] text-[var(--text-muted)]',
  ongoing:                          'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  completed:                        'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
  archived:                         'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
};

// ─── Role display ─────────────────────────────────────────────────────────────
// API mapped from user roles

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:      'Super Admin',
  director:         'Director',
  associate_dean:   'Associate Dean',
  club_coordinator: 'Club Coordinator',
  student:          'Student',
  additional:       'Additional',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin:      'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]',
  director:         'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  associate_dean:   'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
  club_coordinator: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  student:          'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  additional:       'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
};

// ─── Role dashboard routes ────────────────────────────────────────────────────

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  super_admin:      '/admin',
  director:         '/director',
  associate_dean:   '/associate_dean',
  club_coordinator: '/club_coordinator',
  student:          '/student',
  additional:       '/additional',
};

// ─── Event type display ───────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<string, string> = {
  technical:  'Technical',
  cultural:   'Cultural',
  sports:     'Sports',
  seminar:    'Seminar',
  workshop:   'Workshop',
  hackathon:  'Hackathon',
  awareness:  'Awareness',
  other:      'Other',
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  technical:  '⚙️',
  cultural:   '🎭',
  sports:     '⚽',
  seminar:    '🎓',
  workshop:   '🛠️',
  hackathon:  '💻',
  awareness:  '📢',
  other:      '📌',
};

// ─── Courses & Specializations ────────────────────────────────────────────────

export const COURSES = [
  { value: 'btech',   label: 'B.Tech' },
  { value: 'mtech',   label: 'M.Tech' },
  { value: 'bpharm',  label: 'B.Pharm' },
  { value: 'mpharm',  label: 'M.Pharm' },
  { value: 'bsc_agri',label: 'B.Sc Agriculture' },
  { value: 'mba',     label: 'MBA' },
];

export const SPECIALIZATIONS: Record<string, { value: string; label: string }[]> = {
  btech: [
    { value: 'computer_engineering', label: 'Computer Engineering' },
    { value: 'mechanical_engineering', label: 'Mechanical Engineering' },
    { value: 'civil_engineering', label: 'Civil Engineering' },
    { value: 'electrical_engineering', label: 'Electrical Engineering' },
    { value: 'electronics_engineering', label: 'Electronics Engineering' },
  ],
  mtech: [
    { value: 'computer_science', label: 'Computer Science' },
    { value: 'structural_engineering', label: 'Structural Engineering' },
  ],
  bpharm: [{ value: 'pharmacy', label: 'Pharmacy' }],
  mpharm: [
    { value: 'pharmaceutics', label: 'Pharmaceutics' },
    { value: 'pharmacology', label: 'Pharmacology' },
  ],
  bsc_agri: [{ value: 'agriculture', label: 'Agriculture' }],
  mba: [
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
  ],
};

export const YEAR_OF_STUDY = [
  { value: 'Y1', label: 'First Year' },
  { value: 'Y2', label: 'Second Year' },
  { value: 'Y3', label: 'Third Year' },
  { value: 'Y4', label: 'Fourth Year' },
  { value: 'Alumni', label: 'Alumni' },
];

// ─── Format file size ─────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Truncate ─────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '…';
}

// ─── Get initials ─────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
