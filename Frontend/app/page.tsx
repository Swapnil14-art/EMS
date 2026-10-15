'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, MapPin, ArrowRight, Zap, ChevronRight
} from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import HeroCarousel from '@/components/events/HeroCarousel';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Tabs } from '@/components/ui';
import EventCalendar from '@/components/calendar/EventCalendar';
import { AppFooter } from '@/components/layout/AppFooter';
import { eventService, venueService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import type { Event, Venue } from '@/types';

function SectionHeader({ title, count, href }: { title: string; count?: number; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="section-title flex items-center gap-3">
          {title}
          {count !== undefined && (
            <span className="px-2.5 py-0.5 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full text-sm font-bold">{count}</span>
          )}
        </h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-colors">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="text-center py-16 col-span-full">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-[var(--text-secondary)] font-medium">{message}</p>
    </div>
  );
}

// ─── Venue Card ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <div className="card p-5 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-12 h-12 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center mb-3">
        <MapPin className="w-6 h-6 text-[rgb(var(--color-primary))]" />
      </div>
      <h3 className="font-display font-bold text-[var(--text-primary)] text-base mb-1">{venue.name}</h3>
      {venue.location && (
        <p className="text-xs text-[var(--text-muted)] mb-2">{venue.location}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <Users className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        <span>Capacity: {venue.max_capacity}</span>
      </div>
    </div>
  );
}

function VenueCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton w-12 h-12 rounded-2xl mb-3" />
      <div className="skeleton h-5 rounded w-3/4 mb-2" />
      <div className="skeleton h-3 rounded w-1/2 mb-2" />
      <div className="skeleton h-3 rounded w-2/3" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Featured = ongoing first, then upcoming
  const featuredEvents = [...ongoingEvents, ...upcomingEvents].slice(0, 8);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const ongoingRes = await eventService.list({ status: 'ongoing', size: 12 }).catch(() => ({ data: [] }));
        const upcomingRes = await eventService.list({ status: 'upcoming', size: 12 }).catch(() => ({ data: [] }));
        const pastRes = await eventService.list({ status: 'past', size: 12 }).catch(() => ({ data: [] }));

        let ongoingData = Array.isArray(ongoingRes) ? ongoingRes : (ongoingRes?.data || []);
        let upcomingData = Array.isArray(upcomingRes) ? upcomingRes : (upcomingRes?.data || []);
        let pastData = Array.isArray(pastRes) ? pastRes : (pastRes?.data || []);

        setOngoingEvents(ongoingData);
        setUpcomingEvents(upcomingData);
        setPastEvents(pastData);
      } catch (e) {
        console.error("Failed to load events", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch venues
  useEffect(() => {
    setVenuesLoading(true);
    venueService.list()
      .then(r => setVenues(r.data || []))
      .catch(() => setVenues([]))
      .finally(() => setVenuesLoading(false));
  }, []);

  const tabData = [
    { value: 'ongoing',  label: 'Ongoing',  count: ongoingEvents?.length },
    { value: 'upcoming', label: 'Upcoming', count: upcomingEvents?.length },
    { value: 'past',     label: 'Past',     count: pastEvents?.length },
  ];

  const activeEvents = {
    ongoing:  ongoingEvents,
    upcoming: upcomingEvents,
    past:     pastEvents,
  }[activeTab] || [];

  return (
    <div className="landing-page min-h-screen bg-[var(--card-bg)]">
      <PublicNavbar />

      {/* Hero carousel - full width, below nav */}
      <div className="pt-16">
        {loading ? (
          <div className="h-[480px] w-full skeleton sm:h-[580px] lg:h-[620px]" />
        ) : (
          <HeroCarousel events={featuredEvents} />
        )}
      </div>

      {/* ── Main Sections ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-10 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12 lg:px-8">

        {/* Ongoing Events (always visible at top if any) */}
        {(ongoingEvents?.length > 0 || loading) && (
          <section>
            <SectionHeader
              title="Happening Now"
              count={ongoingEvents?.length}
              href="/events?status=ongoing"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
                : ongoingEvents?.length === 0
                  ? <EmptySection message="No events happening right now" />
                  : ongoingEvents?.map(e => <EventCard key={e.id} event={e} />)
              }
            </div>
          </section>
        )}

        {/* Tabbed section: Upcoming / Ongoing / Past */}
        <section id="events">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="section-title">All Events</h2>
            <Tabs tabs={tabData} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[200px]">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)
              : activeEvents?.length === 0
                ? (
                  <div className="col-span-full text-center py-16">
                    <div className="text-5xl mb-4">
                      {activeTab === 'ongoing' ? '🎯' : activeTab === 'upcoming' ? '🗓️' : '📚'}
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium">
                      {activeTab === 'ongoing'
                        ? 'No events are currently ongoing'
                        : activeTab === 'upcoming'
                          ? 'No upcoming events scheduled yet'
                          : 'No past events to show'}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Check back later</p>
                  </div>
                )
                : activeEvents?.map(e => <EventCard key={e.id} event={e} />)
            }
          </div>

          {/* View more */}
          {activeEvents?.length >= 8 && (
            <div className="flex justify-center mt-8">
              <Link
                href={`/events?status=${activeTab}`}
                className="btn-secondary gap-2"
              >
                See All {tabData.find(t => t.value === activeTab)?.label} Events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* ── Event Calendar Section ────────────────────────────────────────────── */}
        <section id="calendar">
          <EventCalendar isPublic={true} />
        </section>

        {/* CTA Section - For Students */}
        <section className="blue-section relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-12">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[var(--status-warning-text)]" />
                <span className="text-[rgb(var(--color-primary))]/20 text-sm font-semibold uppercase tracking-wider">For Students</span>
              </div>
              <h2 className="font-display font-bold text-[var(--btn-primary-text)] text-3xl md:text-4xl mb-3">
                Discover & Participate<br />in Campus Events
              </h2>
              <Link href="/about" className="inline-flex flex-col text-white transition-opacity hover:opacity-80">
                <span className="font-bold">About EMS</span>
                <span className="mt-1 text-sm text-white/80">Learn how EMS works <ArrowRight className="inline-block w-3.5 h-3.5" /></span>
              </Link>
            </div>
            {isHydrated && !isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link href="/signup"
                  className="px-6 py-3 bg-white text-[rgb(var(--color-primary))] rounded-xl font-bold text-sm hover:bg-[var(--card-bg)] transition-colors shadow-lg text-center">
                  Create Account
                </Link>
                <Link href="/login"
                  className="px-6 py-3 bg-[rgb(var(--card-bg)/0.1)] text-[var(--btn-primary-text)] border border-white/20 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm text-center">
                  Log In
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
      <AppFooter />
    </div>
  );
}
