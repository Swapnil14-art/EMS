'use client';
import { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { registrationService } from '@/lib/services';
import { Button, EmptyState } from '@/components/ui';
import type { Event } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function StudentRegistrationsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const res = await registrationService.myRegistrations();
      setEvents(Array.isArray(res) ? res : []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRegs(); }, []);

  const upcoming = events.filter(e => ['approved'].includes(e.status));
  const ongoing = events.filter(e => e.status === 'ongoing');
  const past = events.filter(e => ['completed', 'archived'].includes(e.status));

  const Section = ({ title, items }: { title: string; items: Event[] }) => (
    items?.length > 0 ? (
      <div>
        <h2 className="section-title mb-4">{title} <span className="text-base font-normal text-[var(--text-muted)] ml-1">({items?.length})</span></h2>
        <div className="space-y-3">
          {items?.map(ev => (
            <Link key={ev.id} href={`/events/${ev.id}`} className="card-hover block p-5">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-[var(--text-primary)] truncate mb-1">{ev.title}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(ev.start_datetime)}</span>
                  {(ev.venue?.name || ev.venue_custom) && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ev.venue?.name || ev.venue_custom}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div><h1 className="page-title">My Registrations</h1><p className="page-subtitle">{events?.length} total registrations</p></div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-1/2 rounded" /><div className="skeleton h-3 w-1/3 rounded" /></div>)}</div>
      ) : events?.length === 0 ? (
        <div className="card"><EmptyState icon="📋" title="No registrations yet"
          subtitle="Browse events and register to see them here"
          action={<Link href="/student/events"><Button>Browse Events</Button></Link>} /></div>
      ) : (
        <>
          <Section title="Ongoing" items={ongoing} />
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past" items={past} />
        </>
      )}
    </div>
  );
}
