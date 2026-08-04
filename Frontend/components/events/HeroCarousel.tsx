'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// Using plain <img> for user-uploaded posters (served via Nginx static files)
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { EventTypeBadge } from '@/components/shared/StatusBadge';
import type { Event } from '@/types';

interface HeroCarouselProps {
  events: Event[];
}

const PLACEHOLDER_COLORS = [
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-[var(--status-info-text)] to-[var(--status-info-text)]',
  'from-cyan-600 to-cyan-900',
];

function StatusPill({ status }: { status: string }) {
  if (status === 'ongoing') return (
    <span className="flex items-center gap-1.5 rounded-full border border-[var(--status-success-text)] bg-[var(--status-success-bg)] px-3 py-1.5 text-xs font-bold text-[var(--status-success-text)] shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
      LIVE NOW
    </span>
  );
  if (status === 'approved') return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold shadow-lg">
      <Clock className="w-3 h-3" />
      UPCOMING
    </span>
  );
  return (
    <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] shadow-lg">
      {status.toUpperCase()}
    </span>
  );
}

export default function HeroCarousel({ events }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  const go = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((idx + events?.length) % events?.length);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, events?.length]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  // Auto-advance every 5s
  useEffect(() => {
    if (events?.length <= 1) return;
    const t = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(t);
  }, [current, go, events?.length]);

  if (!events?.length) return (
    <div className="flex h-[400px] w-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 sm:h-[500px] lg:h-[540px]">
      <div className="text-center text-[var(--btn-primary-text)]">
        <p className="font-display text-3xl font-bold opacity-60">No Featured Events</p>
        <p className="text-[rgb(var(--color-primary))]/20 mt-2">Check back soon for upcoming events</p>
      </div>
    </div>
  );

  const event = events[current];
  const bgGradient = PLACEHOLDER_COLORS[current % PLACEHOLDER_COLORS.length];

  return (
    <div className="relative h-[400px] w-full overflow-hidden sm:h-[500px] lg:h-[540px]">
      {/* Background image or gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} transition-all duration-700`}>
        {event.poster_url && (
          <img
            src={event.poster_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30 transition-opacity duration-700"
          />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16">
          <div className={`max-w-2xl transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <StatusPill status={event.status} />
              <EventTypeBadge type={event.event_type} className="bg-white/20 text-[var(--btn-primary-text)] border border-white/20 backdrop-blur-sm" />
            </div>

            <h2 className="mb-3 font-display text-2xl font-bold leading-tight text-[var(--btn-primary-text)] drop-shadow-lg sm:mb-4 sm:text-4xl md:text-5xl">
              {event.title}
            </h2>

            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[rgb(var(--color-primary))]/10 sm:mb-6 sm:gap-4 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(event.start_datetime)}
              </span>
              {(event.venue || event.venue_custom) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.venue?.name || event.venue_custom}
                </span>
              )}
              {event.club && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--btn-primary-bg)]/30" />
                  {event.club.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={`/events/${event.id}`} className="btn-primary px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base">
                View Details
              </Link>
              {event.status === 'approved' && (
                <Link href={`/events/${event.id}#register`}
                  className="rounded-xl border-2 border-white/40 px-4 py-2 text-sm font-semibold text-[var(--btn-primary-text)] backdrop-blur-sm transition-colors hover:bg-[rgb(var(--card-bg)/0.1)] sm:px-6 sm:py-3 sm:text-base">
                  Register
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {events?.length > 1 && (
        <>
          <button onClick={() => go(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full hidden md:flex items-center justify-center text-[var(--btn-primary-text)] hover:bg-white/25 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full hidden md:flex items-center justify-center text-[var(--btn-primary-text)] hover:bg-white/25 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {events?.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 sm:bottom-6 sm:right-8 sm:gap-2">
          {events?.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Event counter */}
      <div className="absolute right-4 top-4 z-20 rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--btn-primary-text)] glass-card sm:right-8 sm:top-6 sm:px-3 sm:py-1.5">
        {current + 1} / {events?.length}
      </div>
    </div>
  );
}
