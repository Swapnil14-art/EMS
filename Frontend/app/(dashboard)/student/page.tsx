'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, BookOpen, Star, Search, User } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/shared/StatCard';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { BrowseEvents } from '@/components/events/BrowseEvents';
import { eventService, registrationService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [ongoing, setOngoing] = useState<Event[]>([]);
  const [myRegs, setMyRegs] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventService.list({ status: 'upcoming', size: 4 }).catch(() => ({ data: [] })),
      eventService.list({ status: 'ongoing', size: 4 }).catch(() => ({ data: [] })),
      registrationService.myRegistrations().catch(() => []),
    ]).then(([upcomingRes, ongoingRes, regs]) => {
      const upcomingEvents = Array.isArray(upcomingRes) ? upcomingRes : (upcomingRes?.data || []);
      const ongoingEvents = Array.isArray(ongoingRes) ? ongoingRes : (ongoingRes?.data || []);
      setUpcoming(upcomingEvents);
      setOngoing(ongoingEvents);
      setMyRegs(Array.isArray(regs) ? regs : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const pastCount = myRegs.filter(e => e.status === 'completed' || (e.end_datetime && new Date(e.end_datetime) < now)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} 👋 Discover what's happening on campus</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : <>
          <StatCard title="My Registrations" value={myRegs?.length} icon={<BookOpen className="w-6 h-6"/>} color="blue"/>
          <StatCard title="Upcoming Events" value={upcoming?.length} icon={<Calendar className="w-6 h-6"/>} color="green"/>
          <StatCard title="Ongoing Events" value={ongoing?.length} icon={<Star className="w-6 h-6"/>} color="amber"/>
          <StatCard title="Past Attended" value={pastCount} icon={<Calendar className="w-6 h-6"/>} color="purple"/>
        </>}
      </div>

      {/* My registrations */}
      {myRegs?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Registered Events</h2>
            <Link href="/student/registrations" className="text-sm font-semibold text-[rgb(var(--color-primary))]">View All →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRegs.slice(0,3).map(e => <EventCard key={e.id} event={e}/>)}
          </div>
        </div>
      )}

      {/* Browse All Events */}
      <div className="pt-4 border-t border-[var(--card-border)]">
        <h2 className="section-title mb-4">Events</h2>
        <BrowseEvents hideHeader />
      </div>
    </div>
  );
}
