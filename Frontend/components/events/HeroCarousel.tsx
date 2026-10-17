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

  // Drag & swipe state
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const draggedJustNow = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary mouse button (left click) or touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (events?.length <= 1) return;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    isDragging.current = true;
    hasDragged.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const diffX = e.clientX - dragStartX.current;
    const diffY = e.clientY - dragStartY.current;
    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
      hasDragged.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const diffX = e.clientX - dragStartX.current;
    const diffY = e.clientY - dragStartY.current;

    if (hasDragged.current) {
      draggedJustNow.current = true;
      setTimeout(() => {
        draggedJustNow.current = false;
      }, 80);
    }

    const threshold = 45;
    // Ensure horizontal swipe is dominant over vertical movement
    if (Math.abs(diffX) >= threshold && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        go(current + 1); // Dragged/swiped left -> next
      } else {
        go(current - 1); // Dragged/swiped right -> previous
      }
    }
  };

  const handlePointerCancel = () => {
    isDragging.current = false;
  };

  if (!events?.length) return (
    <div className="flex h-[505px] max-h-[72vh] w-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 sm:h-[610px] lg:h-[655px]">
      <div className="text-center text-[var(--btn-primary-text)]">
        <p className="font-display text-3xl font-bold opacity-60">No Featured Events</p>
        <p className="text-[rgb(var(--color-primary))]/20 mt-2">Check back soon for upcoming events</p>
      </div>
    </div>
  );

  const event = events[current];
  const bgGradient = PLACEHOLDER_COLORS[current % PLACEHOLDER_COLORS.length];

  return (
    <div
      className="relative h-[505px] max-h-[72vh] w-full overflow-hidden bg-neutral-950 sm:h-[610px] lg:h-[655px] cursor-grab active:cursor-grabbing select-none touch-pan-y"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={(e) => {
        if (draggedJustNow.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDragStart={(e) => e.preventDefault()}
      tabIndex={0}
      role="region"
      aria-label="Event Carousel"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(current - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(current + 1);
        }
      }}
    >
      {/* Background layer: Duplicated blurred & ambient event poster */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center blur-3xl sm:blur-[60px] scale-125 brightness-[0.6] opacity-90 transition-all duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bgGradient} opacity-70 transition-all duration-700`} />
        )}
        {/* Soft contrast veil to make foreground poster pop while keeping background glow visible */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Subtle edge & bottom gradients to blend into container borders and maintain text readability */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-12 sm:w-24 md:w-36 bg-gradient-to-r from-black/75 to-transparent transition-opacity duration-300"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[3] w-12 sm:w-24 md:w-36 bg-gradient-to-l from-black/75 to-transparent transition-opacity duration-300"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-14 sm:h-20 bg-gradient-to-b from-black/50 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 sm:h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
        aria-hidden="true"
      />

      {/* Foreground main poster: object-contain, centered, zero cropping */}
      {event.poster_url && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-contain object-center transition-opacity duration-700 drop-shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="w-full px-5 pb-4 sm:px-8 sm:pb-6 md:px-12 lg:px-16 xl:px-20 lg:pb-7">
          <div className={`max-w-2xl transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="mb-2 flex items-center gap-2 sm:mb-2.5 sm:gap-3">
              <StatusPill status={event.status} />
              <EventTypeBadge type={event.event_type} className="bg-white/20 text-[var(--btn-primary-text)] border border-white/20 backdrop-blur-sm" />
            </div>

            <h2 className="mb-2 font-display text-2xl font-bold leading-tight text-white sm:mb-3 sm:text-4xl md:text-5xl [text-shadow:_-1px_-1px_0_rgba(0,0,0,0.85),_1px_-1px_0_rgba(0,0,0,0.85),_-1px_1px_0_rgba(0,0,0,0.85),_1px_1px_0_rgba(0,0,0,0.85),_0_4px_14px_rgba(0,0,0,0.95)]">
              {event.title}
            </h2>

            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white sm:mb-4 sm:gap-4 sm:text-sm [text-shadow:_0_1px_2px_rgba(0,0,0,0.9),_0_2px_8px_rgba(0,0,0,0.9)]">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  {event.club.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={`/events/${event.id}`} className="btn-primary px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base">
                View Details
              </Link>
              {event.status === 'approved' && (
                <Link href={`/events/${event.id}#register`}
                  className="rounded-xl border-2 border-white/40 px-4 py-2 text-sm font-semibold text-[var(--btn-primary-text)] backdrop-blur-sm transition-colors hover:bg-[rgb(var(--card-bg)/0.1)] sm:px-6 sm:py-2.5 sm:text-base">
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

      {event.club && (
        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black shadow-sm sm:left-8 sm:top-6">
          {event.club.name}
        </div>
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
      <div className="absolute right-4 top-4 z-20 rounded-full px-2.5 py-1 text-xs font-semibold text-black glass-card sm:right-8 sm:top-6 sm:px-3 sm:py-1.5">
        {current + 1} / {events?.length}
      </div>
    </div>
  );
}
