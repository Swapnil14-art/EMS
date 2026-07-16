'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Edit, CheckCircle2, Users, PlusCircle, Search, MapPin, User, Bell } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/shared/StatCard';
import { MyEvents } from '@/components/events/MyEvents';
import PendingApprovalsPage from '@/components/events/PendingApprovalsPage';
import { eventService, approvalService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

export default function ClubCoordinatorDashboard() {
  const { user } = useAuthStore();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    eventService.list({ size: 5, my_events: true }).then((r: any) => {
      const events = Array.isArray(r) ? r : (r.data || []);
      setMyEvents(events);
    }).catch(() => {}).finally(() => setLoading(false));
    // Fetch pending approval count for collaborative events
    approvalService.getPending().then((res: any) => {
      const items = Array.isArray(res) ? res : (res?.data || []);
      setPendingCount(items.length);
    }).catch(() => {});
  }, []);
  const drafts = myEvents.filter(e => e.status === 'draft').length;
  const approved = myEvents.filter(e => ['approved','ongoing'].includes(e.status)).length;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Club Coordinator Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name?.split(' ')[0]} · Organize and manage events</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/club_coordinator/events/create" className="btn-primary"><PlusCircle className="w-4 h-4"/> Create Event</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : <>
          <StatCard title="Total Events" value={myEvents?.length} icon={<Calendar className="w-6 h-6"/>} color="blue"/>
          <StatCard title="Drafts" value={drafts} icon={<Edit className="w-6 h-6"/>} color="amber"/>
          <StatCard title="Approved" value={approved} icon={<CheckCircle2 className="w-6 h-6"/>} color="green"/>
          <StatCard title="Pending Approvals" value={pendingCount} icon={<Bell className="w-6 h-6"/>} color="red"/>
        </>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          {label:'Browse Events',href:'/events',icon:<Search className="w-5 h-5"/>,color:'text-indigo-600 bg-indigo-50'},
          {label:'Create Event',href:'/club_coordinator/events/create',icon:<PlusCircle className="w-5 h-5"/>,color:'text-[rgb(var(--color-primary))] bg-[var(--card-bg)]'},
          {label:'Documents',href:'/club_coordinator/documents',icon:<Edit className="w-5 h-5"/>,color:'text-[var(--text-secondary)] bg-[var(--card-bg)]'},
          {label:'Submit Report',href:'/club_coordinator/report',icon:<MapPin className="w-5 h-5"/>,color:'text-amber-600 bg-amber-50'},
          {label:'RnD Report',href:'/club_coordinator/rnd-report',icon:<MapPin className="w-5 h-5"/>,color:'text-rose-600 bg-rose-50'},
        ].map(q=>(
          <Link key={q.href} href={q.href} className="card-hover p-4 flex flex-col items-center gap-2 text-center group">
            <div className={"w-10 h-10 rounded-2xl flex items-center justify-center "+q.color}>{q.icon}</div>
            <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[rgb(var(--color-primary))]">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Pending Collaborative Approvals */}
      {pendingCount > 0 && (
        <div className="pt-4 border-t border-[var(--card-border)]">
          <PendingApprovalsPage />
        </div>
      )}

      <div className="pt-4 border-t border-[var(--card-border)]">
        <h2 className="section-title mb-4">My Events</h2>
        <MyEvents basePath="/club_coordinator" hideHeader={true} />
      </div>
    </div>
  );
}
