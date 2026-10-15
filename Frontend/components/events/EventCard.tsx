'use client';
// Using plain <img> for user-uploaded posters (served via Nginx static files)
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { formatDate, formatDateTime, truncate, EVENT_TYPE_ICONS, getEventTimeStatus } from '@/lib/utils';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'horizontal';
  showStatus?: boolean; 
}

const GRADIENT_FALLBACKS = [
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-cyan-400 to-cyan-600',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
];

function fallbackGradient(id: number) {
  return GRADIENT_FALLBACKS[id % GRADIENT_FALLBACKS.length];
}

// Default card - for grids
export function EventCard({ event, showStatus = true }: EventCardProps) {
  const timeStatus = getEventTimeStatus(event.start_datetime, event.end_datetime);
  const isOngoing = timeStatus === 'ongoing' && ['approved', 'ongoing'].includes(event.status);
  const isUpcoming = timeStatus === 'upcoming' && event.status === 'approved';

  return (
    <Link href={`/events/${event.id}`} className="block group event-card card-hover overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
      {/* Image area */}
      <div className="event-img-wrap relative h-40 overflow-hidden bg-gradient-to-br sm:h-48">
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient(event.id)} flex items-center justify-center`}>
            <span className="text-5xl opacity-60">{EVENT_TYPE_ICONS[event.event_type] || '📅'}</span>
          </div>
        )}
        {/* Status overlay */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {event.is_rnd_event && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white rounded-full text-xs font-bold shadow">
              R&D
            </span>
          )}
          {isOngoing && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--status-success-bg)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
          <EventTypeBadge type={event.event_type} className="shadow bg-white/90 backdrop-blur-sm" />
        </div>
        {/* Registration count */}
        {event.registration_count !== undefined && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 text-[var(--btn-primary-text)] rounded-full text-xs backdrop-blur-sm">
            <Users className="w-3 h-3" />
            {event.registration_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-bold text-[var(--text-primary)] text-base leading-snug mb-2 group-hover:text-[rgb(var(--color-primary))] transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1.5 text-xs text-[var(--text-secondary)] mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
            <span>{formatDate(event.start_datetime)}</span>
            {isUpcoming && (
              <span className="ml-auto text-[rgb(var(--color-primary))] font-semibold">
                <Clock className="w-3 h-3 inline mr-0.5" />
                Upcoming
              </span>
            )}
          </div>
          {(event.venue?.name || event.venue_custom) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
              <span className="truncate">{event.venue?.name || event.venue_custom}</span>
            </div>
          )}
          {event.club?.name && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--btn-primary-bg)]" />
              </span>
              <span className="truncate">{event.club.name}</span>
            </div>
          )}
        </div>

        {showStatus && (
          <div className="flex items-center justify-between">
            <StatusBadge status={event.status} />
            <span className="text-[rgb(var(--color-primary))] group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Compact card - for lists
export function EventCardCompact({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`}
      className="flex items-center gap-4 p-4 card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Mini poster */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title} className="object-cover w-full h-full" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient(event.id)} flex items-center justify-center`}>
            <span className="text-xl">{EVENT_TYPE_ICONS[event.event_type] || '📅'}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)] text-sm truncate group-hover:text-[rgb(var(--color-primary))] transition-colors">{event.title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {formatDate(event.start_datetime)}
        </p>
        {event.club?.name && <p className="text-xs text-[var(--text-muted)] truncate">{event.club.name}</p>}
      </div>
      <div className="flex-shrink-0">
        <StatusBadge status={event.status} />
      </div>
    </Link>
  );
}

// Skeleton loaders
export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-3 rounded w-2/3" />
      </div>
    </div>
  );
}
