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
  draft:                            'bg-gray-100 text-gray-700',
  pending_associate_dean:           'bg-orange-100 text-orange-800',
  pending_coordinator_parallel:     'bg-sky-100 text-sky-800',
  pending_director:                 'bg-[rgb(var(--btn-primary-bg)/0.1)] text-[rgb(var(--color-primary))]',
  suggested_changes:                'bg-yellow-100 text-yellow-800',
  approved:                         'bg-emerald-100 text-emerald-800',
  rejected:                         'bg-red-100 text-red-800',
  cancelled:                        'bg-gray-100 text-[var(--text-muted)]',
  ongoing:                          'bg-green-100 text-green-800',
  completed:                        'bg-[rgb(var(--color-secondary)/0.1)] text-[var(--text-secondary)]',
  archived:                         'bg-muted text-slate-700',
};

// ─── Role display ─────────────────────────────────────────────────────────────
// API mapped from user roles

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:      'Super Admin',
  director:         'Director',
  associate_dean:   'Associate Dean',
  club_coordinator: 'Club Coordinator',
  student:          'Student',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin:      'bg-red-100 text-red-800',
  director:         'bg-[rgb(var(--color-secondary)/0.1)] text-[var(--text-secondary)]',
  associate_dean:   'bg-[rgb(var(--btn-primary-bg)/0.1)] text-[rgb(var(--color-primary))]',
  club_coordinator: 'bg-amber-100 text-amber-800',
  student:          'bg-gray-100 text-gray-700',
};

// ─── Role dashboard routes ────────────────────────────────────────────────────

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  super_admin:      '/admin',
  director:         '/director',
  associate_dean:   '/associate_dean',
  club_coordinator: '/club_coordinator',
  student:          '/student',
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

// ─── School Display and Tooltips ──────────────────────────────────────────────

export const SCHOOL_MAP: Record<string, { abbreviation: string; fullName: string }> = {
  ENGG: { abbreviation: 'MPSTME', fullName: 'Mukesh Patel School of Technology Management & Engineering' },
  AGRI: { abbreviation: 'SAST', fullName: 'School of Agricultural Sciences & Technology' },
  PHRM: { abbreviation: 'SPTM', fullName: 'School of Pharmacy & Technology Management' },
  
  ENGINEERING: { abbreviation: 'MPSTME', fullName: 'Mukesh Patel School of Technology Management & Engineering' },
  AGRICULTURE: { abbreviation: 'SAST', fullName: 'School of Agricultural Sciences & Technology' },
  PHARMACY: { abbreviation: 'SPTM', fullName: 'School of Pharmacy & Technology Management' },
};

export function getSchoolInfo(codeOrName: string) {
  if (!codeOrName) return null;
  const key = String(codeOrName).trim().toUpperCase();
  return SCHOOL_MAP[key] || null;
}

