'use client';
import { useState, useEffect, useCallback } from 'react';
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
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--status-success-bg)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold shadow-lg">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
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
    <span className="px-3 py-1.5 bg-[var(--surface-subtle)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold shadow-lg">
      {status.toUpperCase()}
    </span>
  );
}

export default function HeroCarousel({ events }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const go = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((idx + events?.length) % events?.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, events?.length]);

  // Auto-advance every 5s
  useEffect(() => {
    if (events?.length <= 1) return;
    const t = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(t);
  }, [current, go, events?.length]);

  if (!events?.length) return (
    <div className="w-full h-[540px] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
      <div className="text-center text-[var(--btn-primary-text)]">
        <p className="font-display text-3xl font-bold opacity-60">No Featured Events</p>
        <p className="text-[rgb(var(--color-primary))]/20 mt-2">Check back soon for upcoming events</p>
      </div>
    </div>
  );

  const event = events[current];
  const bgGradient = PLACEHOLDER_COLORS[current % PLACEHOLDER_COLORS.length];

  return (
    <div className="relative w-full h-[540px] overflow-hidden">
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16 w-full">
          <div className={`max-w-2xl transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

            <div className="flex items-center gap-3 mb-4">
              <StatusPill status={event.status} />
              <EventTypeBadge type={event.event_type} className="bg-white/20 text-[var(--btn-primary-text)] border border-white/20 backdrop-blur-sm" />
            </div>

            <h2 className="font-display font-bold text-[var(--btn-primary-text)] text-4xl md:text-5xl leading-tight mb-4 drop-shadow-lg">
              {event.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-[rgb(var(--color-primary))]/10 text-sm">
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

            <div className="flex items-center gap-3">
              <Link href={`/events/${event.id}`} className="btn-primary px-6 py-3 text-base">
                View Details
              </Link>
              {event.status === 'approved' && (
                <Link href={`/events/${event.id}#register`}
                  className="px-6 py-3 text-base font-semibold text-[var(--btn-primary-text)] border-2 border-white/40 rounded-xl hover:bg-[rgb(var(--card-bg)/0.1)] transition-colors backdrop-blur-sm">
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
        <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2">
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
      <div className="absolute top-6 right-8 z-20 glass-card px-3 py-1.5 rounded-full text-[var(--btn-primary-text)] text-xs font-semibold">
        {current + 1} / {events?.length}
      </div>
    </div>
  );
}
