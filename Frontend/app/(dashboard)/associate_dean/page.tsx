'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Shield, Calendar, BookOpen, ChevronRight, CheckCircle2, MapPin, BarChart3, User, XCircle } from 'lucide-react';
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
          <p className="page-subtitle">Welcome, {user?.name?.split(' ')[0]} · School institutional review · {user?.department?.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : <>
          <StatCard title="Pending Approvals" value={pending?.length || 0} icon={<Bell className="w-6 h-6"/>} color="red"/>
          <StatCard title="Approved" value={stats?.events_by_status?.['approved'] || 0} icon={<CheckCircle2 className="w-6 h-6"/>} color="green"/>
          <StatCard title="Rejected" value={stats?.events_by_status?.['rejected'] || 0} icon={<XCircle className="w-6 h-6"/>} color="amber"/>
          <StatCard title="School Events" value={stats?.total_events || 0} icon={<Calendar className="w-6 h-6"/>} color="blue"/>
        </>}
      </div>
      <div>
        <h2 className="section-title mb-4">Pending Approvals</h2>
        <PendingApprovalsPage hideHeader />
      </div>
    </div>
  );
}
