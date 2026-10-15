'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, User, ArrowLeft, Download, Users, Upload, CheckCircle2, FileText, ImageIcon, X, Layers } from 'lucide-react';
import { eventService, approvalService, reportService } from '@/lib/services';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import ApprovalChain from '@/components/events/ApprovalChain';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { Event, EventApproval } from '@/types';
import toast from 'react-hot-toast';
import FullEventDetailsView from '@/components/events/FullEventDetailsView';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [approvals, setApprovals] = useState<EventApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventService.get(Number(id)),
      approvalService.getHistory(Number(id)).catch(() => []),
    ]).then(([ev, chain]) => {
      setEvent(ev);
      setApprovals(chain);
    }).catch(() => router.push('/'))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-4 animate-pulse"><div className="skeleton h-8 w-1/2 rounded"/><div className="skeleton h-64 rounded-2xl"/></div>;
  if (!event) return <div className="card p-8 text-center text-[var(--text-muted)]">Event not found.</div>;

  const hasDeanOrDirectorSuggestion = approvals.some(approval =>
    approval.status === 'suggested_changes'
    && ['dean', 'associate_dean', 'director'].includes(approval.role_at_approval)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Full Event Details (same view as director/dean/super_admin) */}
      <FullEventDetailsView event={event} />

      {/* Coordinator-specific: Approval Chain + Registration + Report */}
      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
          {/* Approval chain sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="section-title mb-4">Approval Chain</h2>
              <ApprovalChain approvals={approvals} currentStep={event.current_approval_step || 0}/>
            </div>
            {(hasDeanOrDirectorSuggestion || event.status === 'suggested_changes' || event.status === 'draft') && (
              <Link href={`/club_coordinator/events/${event.id}/edit`} className="block">
                <Button className="w-full">Edit Event / Apply Changes</Button>
              </Link>
            )}
            {event.registration_count !== undefined && (
              <div className="card p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[rgb(var(--color-primary))]"/>
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-xl">{event.registration_count}</p>
                  <p className="text-xs text-[var(--text-muted)]">Registered students</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

