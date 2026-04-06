'use client';
import { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, MapPin, Mail, TrendingUp, Activity, Building2 } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/shared/StatCard';
import { EventCardCompact } from '@/components/events/EventCard';
import { eventService, dashboardService } from '@/lib/services';
import type { Event, AdminDashboardStats } from '@/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // API mapped from GET /events and GET /dashboard/admin
  useEffect(() => {
    Promise.all([
      eventService.list({ size: 5 }).catch(() => ({ data: [] })),
      dashboardService.getAdmin().catch(() => null),
    ]).then(([eventsRes, dashStats]) => {
      const events = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || []);
      setRecentEvents(events);
      if (dashStats) setStats(dashStats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System overview — NMIMS Shirpur Campus</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : <>
          <StatCard title="Total Events" value={stats?.total_events ?? '—'} icon={<Calendar className="w-6 h-6" />} color="blue" subtitle="This semester" />
          <StatCard title="Total Registrations" value={stats?.total_registrations ?? '—'} icon={<Users className="w-6 h-6" />} color="green" subtitle="All events" />
          <StatCard title="Active Clubs" value={stats?.total_clubs ?? '—'} icon={<BookOpen className="w-6 h-6" />} color="purple" subtitle="Across departments" />
          <StatCard title="Venues" value={stats?.total_venues ?? '—'} icon={<MapPin className="w-6 h-6" />} color="amber" subtitle="Available" />
        </>}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage Users', href: '/admin/users', icon: <Users className="w-5 h-5" />, color: 'text-[rgb(var(--color-primary))] bg-[var(--card-bg)]' },
          { label: 'Manage Clubs', href: '/admin/clubs', icon: <BookOpen className="w-5 h-5" />, color: 'text-[var(--text-secondary)] bg-[var(--card-bg)]' },
          { label: 'Departments', href: '/admin/departments', icon: <Building2 className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'All Events', href: '/admin/events', icon: <Calendar className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className="card-hover p-4 flex flex-col items-center gap-2 text-center group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${q.color}`}>{q.icon}</div>
            <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[rgb(var(--color-primary))] transition-colors">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Events</h2>
          <Link href="/admin/events" className="text-sm font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]">View all →</Link>
        </div>
        <div className="space-y-3">
          {loading ? Array.from({length:3}).map((_,i)=>(
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          )) : recentEvents?.length === 0 ? (
            <div className="card p-8 text-center text-[var(--text-muted)]">No events yet</div>
          ) : recentEvents?.map(e => <EventCardCompact key={e.id} event={e} />)}
        </div>
      </div>
    </div>
  );
}
