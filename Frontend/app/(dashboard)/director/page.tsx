'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, XCircle, BarChart3, ChevronRight, User } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/shared/StatCard';
import PendingApprovalsPage from '@/components/events/PendingApprovalsPage';
import { approvalService, dashboardService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

export default function DirectorDashboard() {
  const { user } = useAuthStore();
  const [pending, setPending] = useState<Event[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      approvalService.getPending(),
      dashboardService.getAdmin()
    ]).then(([pResp, sResp]) => {
      setPending(Array.isArray(pResp) ? pResp : (pResp.data || []));
      setStats(sResp);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Director Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name?.split(' ')[0]} · Final approval authority — College-wide</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : <>
          <StatCard title="Pending Approvals" value={pending?.length || 0} icon={<Bell className="w-6 h-6"/>} color="red" subtitle="Awaiting decision"/>
          <StatCard title="Approved" value={stats?.events_by_status?.['approved'] || 0} icon={<CheckCircle2 className="w-6 h-6"/>} color="green"/>
          <StatCard title="Rejected" value={stats?.events_by_status?.['rejected'] || 0} icon={<XCircle className="w-6 h-6"/>} color="amber"/>
          <StatCard title="Total Reviewed" value={(stats?.events_by_status?.['approved'] || 0) + (stats?.events_by_status?.['rejected'] || 0) + (stats?.events_by_status?.['suggested_changes'] || 0)} icon={<BarChart3 className="w-6 h-6"/>} color="blue"/>
        </>}
      </div>
      <div>
        <h2 className="section-title mb-4">Pending Approvals {pending?.length > 0 && <span className="ml-2 px-2 py-0.5 bg-[var(--status-danger-bg)] text-[var(--text-danger)] rounded-full text-xs font-bold">{pending?.length}</span>}</h2>
        <PendingApprovalsPage hideHeader />
      </div>
    </div>
  );
}
