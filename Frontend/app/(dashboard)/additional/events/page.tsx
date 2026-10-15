'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { eventService } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import { Calendar, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Event } from '@/types';

export default function AdditionalEventsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const perms = user.extra_permissions ?? [];
    if (user.role !== 'additional' || !perms.includes('view_events')) {
      router.replace('/additional');
      return;
    }
    eventService.list({ size: 100 })
      .then(r => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    approved: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
    ongoing:  'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
    completed:'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
    archived: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Events</h1>
        <p className="page-subtitle">Browse approved and completed events</p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl outline-none focus:border-[var(--input-focus-ring)] transition-colors"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)]">No events found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(ev => (
            <div key={ev.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">{ev.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${statusColor[ev.status] || 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'}`}>
                  {ev.status}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(ev.start_datetime)}
                {ev.venue?.name || ev.venue_custom ? ` · ${ev.venue?.name || ev.venue_custom}` : ''}
              </p>
              {(user?.extra_permissions ?? []).includes('view_event_details') && (
                <Link
                  href={`/events/${ev.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--color-primary))] hover:underline"
                >
                  View Details <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
