'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, FileText } from 'lucide-react';
import CreateEventForm from '@/components/events/CreateEventForm';
import { eventService } from '@/lib/services';
import type { Event } from '@/types';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [pendingEvent, setPendingEvent] = useState<Event | null>(null);

  useEffect(() => {
    eventService.list({ status: 'completed', size: 50, manage_only: true }).then((res) => {
      const completedEvent = res.data?.find((e: Event) => e.status === 'completed' && !e.report_path);
      if (completedEvent) {
        setPendingEvent(completedEvent);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="skeleton h-8 w-1/3 rounded"/><div className="skeleton h-64 rounded-2xl"/></div>;
  }

  if (pendingEvent) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 card text-center animate-fade-in border-2 border-[var(--status-warning-text)] bg-[var(--status-warning-bg)]">
        <div className="w-16 h-16 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Pending Report Action</h2>
        <p className="text-[var(--text-secondary)]">
          You cannot create a new event until you submit the post-event report for your last completed event: 
        </p>
        <div className="bg-white p-4 rounded-xl border border-[var(--card-border)]-subtle my-6 inline-block text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--btn-primary-bg)] rounded-l-xl"></div>
          <p className="font-semibold text-[var(--text-primary)] pl-2">{pendingEvent.title}</p>
        </div>
        <div>
          <Link href={`/club_coordinator/report`} className="btn-primary inline-flex justify-center flex-1 w-full max-w-xs items-center gap-2">
            <FileText className="w-4 h-4" /> Go to Event to Submit Report
          </Link>
        </div>
      </div>
    );
  }

  return <CreateEventForm basePath='/club_coordinator' />;
}
