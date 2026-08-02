'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Plus, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { eventService } from '@/lib/services';
import { Button, Input, Select, Pagination, EmptyState, Tabs, Modal } from '@/components/ui';
import toast from 'react-hot-toast';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending_associate_dean,pending_coordinator_parallel,pending_director,suggested_changes', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      await eventService.delete(eventToDelete.id);
      toast.success('Event deleted successfully');
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setTotal(prev => prev - 1);
      setEventToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.list({ status: statusFilter || undefined, search: search || undefined, page, size: 20 });
      setEvents(res.data || []);
      setTotal(res.total || 0);
    } catch { setEvents([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [statusFilter, page]);
  useEffect(() => {
    const t = setTimeout(fetchEvents, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">All Events</h1><p className="page-subtitle">System-wide event management — {total} total</p></div>
        <Link href="/admin/events/create">
          <Button icon={<Plus className="w-4 h-4" />}>Create Event</Button>
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Input placeholder="Search events…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <select className="input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="ems-table">
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th>School</th><th>Created By</th><th></th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}><td colSpan={7}><div className="skeleton h-4 rounded" /></td></tr>
            )) : events?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">No events found</td></tr>
            ) : events?.map(ev => (
              <tr key={ev.id}>
                <td><span className="font-medium text-[var(--text-primary)] line-clamp-1 max-w-[200px]">{ev.title}</span></td>
                <td><EventTypeBadge type={ev.event_type} /></td>
                <td><StatusBadge status={ev.status} /></td>
                <td className="text-xs text-[var(--text-muted)]">{formatDate(ev.start_datetime)}</td>
                <td className="text-xs text-[var(--text-muted)]">{ev.school_department}</td>
                <td className="text-xs text-[var(--text-muted)]">{ev.creator?.name || '—'}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={"/events/" + ev.id} className="p-1.5 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] hover:bg-[var(--card-bg)] rounded-lg transition-colors inline-flex" title="View">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setEventToDelete(ev)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors inline-flex" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />

      <Modal
        open={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        title="Delete Event"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEventToDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>Delete Event</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-center text-[var(--text-primary)]">
            Are you sure you want to delete the event <strong>{eventToDelete?.title}</strong>?
            This action will permanently delete the event and its associated documents.
          </p>
        </div>
      </Modal>
    </div>
  );
}
