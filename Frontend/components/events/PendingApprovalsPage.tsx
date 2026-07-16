'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Calendar, MapPin, User, AlertTriangle, MessageSquare } from 'lucide-react';
import { approvalService } from '@/lib/services';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import { Button, Modal, Textarea, Alert, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { extractApiError } from '@/lib/transformers';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

export default function PendingApprovalsPage({ hideHeader }: { hideHeader?: boolean } = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await approvalService.getPending();
      setEvents(Array.isArray(res) ? res : (res?.data || []));
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {!hideHeader && (
        <div className="page-header">
          <div>
            <h1 className="page-title">Pending Approvals</h1>
            <p className="page-subtitle">Events awaiting your decision</p>
          </div>
          <span className="badge bg-red-100 text-[var(--text-danger)] text-sm px-3 py-1">{events?.length} pending</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-1/2 rounded mb-3" />
              <div className="skeleton h-3 w-1/3 rounded mb-6" />
              <div className="flex gap-3"><div className="skeleton h-9 w-24 rounded-xl" /><div className="skeleton h-9 w-24 rounded-xl" /></div>
            </div>
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 className="w-16 h-16 text-emerald-300" />}
            title="All clear!"
            subtitle="No events are waiting for your approval right now."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {events?.map(event => (
            <div key={event.id} className="card p-6 hover:shadow-card-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <EventTypeBadge type={event.event_type} />
                    <StatusBadge status={event.status} />
                    {event.is_collaborative && (
                      <span className="badge bg-indigo-100 text-indigo-700">Collaborative</span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-1 truncate">
                    <Link href={`/events/${event.id}`} className="hover:text-[rgb(var(--color-primary))] transition-colors">
                      {event.title}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(event.start_datetime)} – {formatDate(event.end_datetime)}</span>
                    {(event.venue?.name || event.venue_custom) && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue?.name || event.venue_custom}</span>
                    )}
                    {event.creator && (
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{event.creator.name}</span>
                    )}
                  </div>
                  {event.is_sponsored && (
                    <p className="text-xs text-amber-600 font-medium mt-2">💰 Sponsored event</p>
                  )}
                </div>

                {/* Action — redirect to event details for review */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/events/${event.id}`}>
                    <Button variant="primary" size="sm">Review & Approve Details →</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

