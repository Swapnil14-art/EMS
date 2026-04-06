'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Shield, Calendar, BookOpen, ChevronRight, CheckCircle2, MapPin, BarChart3, User } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/shared/StatCard';
import PendingApprovalsPage from '@/components/events/PendingApprovalsPage';
import { approvalService, dashboardService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

export default function AssociateDeanDashboard() {
  const { user } = useAuthStore();
  const [pending, setPending] = useState<Event[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      approvalService.getPending(),
      dashboardService.getAssociateDean()
    ]).then(([pResp, sResp]) => {
      setPending(Array.isArray(pResp) ? pResp : (pResp.data || []));
      setStats(sResp);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Associate Dean Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name?.split(' ')[0]} · Department institutional review · {user?.department?.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : <>
          <StatCard title="Pending Approvals" value={pending?.length || 0} icon={<Bell className="w-6 h-6"/>} color="red"/>
          <StatCard title="Approved" value={stats?.events_by_status?.['approved'] || 0} icon={<CheckCircle2 className="w-6 h-6"/>} color="green"/>
          <StatCard title="Override Requests" value="—" icon={<Shield className="w-6 h-6"/>} color="amber"/>
          <StatCard title="Dept Events" value={stats?.total_events || 0} icon={<Calendar className="w-6 h-6"/>} color="blue"/>
        </>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Venues',href:'/associate_dean/venues',icon:<MapPin className="w-5 h-5"/>,color:'text-teal-600 bg-teal-50'},
          {label:'Override Requests',href:'/associate_dean/overrides',icon:<Shield className="w-5 h-5"/>,color:'text-amber-600 bg-amber-50'},
          {label:'History',href:'/associate_dean/history',icon:<BarChart3 className="w-5 h-5"/>,color:'text-[rgb(var(--color-primary))] bg-[var(--card-bg)]'},
          {label:'Clubs',href:'/associate_dean/clubs',icon:<BookOpen className="w-5 h-5"/>,color:'text-[var(--text-secondary)] bg-[var(--card-bg)]'},
        ].map(q=>(
          <Link key={q.href} href={q.href} className="card-hover p-4 flex flex-col items-center gap-2 text-center group">
            <div className={"w-10 h-10 rounded-2xl flex items-center justify-center "+q.color}>{q.icon}</div>
            <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[rgb(var(--color-primary))]">{q.label}</span>
          </Link>
        ))}
      </div>
      <div>
        <h2 className="section-title mb-4">Pending Approvals</h2>
        <PendingApprovalsPage hideHeader />
      </div>
    </div>
  );
}
