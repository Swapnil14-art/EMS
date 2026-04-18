'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Trash2, Send, Edit, Upload, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';
import { eventService, reportService } from '@/lib/services';
import { Button, Input, Tabs, Modal, Textarea, Pagination, EmptyState } from '@/components/ui';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';
import { TermsModal } from '@/components/shared/TermsModal';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending_associate_dean,pending_coordinator_parallel,pending_director,suggested_changes', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'rejected', label: 'Rejected' },
];

export function MyEvents({ basePath, hideHeader }: { basePath: string; hideHeader?: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [cancelEvent, setCancelEvent] = useState<Event | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [deadlineEvent, setDeadlineEvent] = useState<Event | null>(null);
  const [deadline, setDeadline] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  
  // Submission Terms State
  const [submitEvent, setSubmitEvent] = useState<Event | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);



  const fetchCounts = () => {
    Promise.all(STATUS_TABS.map(t => 
      eventService.list({ status: t.value || undefined, search: search || undefined, size: 1, my_events: true })
        .then(r => ({ k: t.value, v: r.total || 0 })).catch(() => ({ k: t.value, v: 0 }))
    )).then(res => {
      const map: Record<string, number> = {};
      res.forEach(r => map[r.k] = r.v);
      setTabCounts(map);
    });
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.list({ status: tab || undefined, search: search || undefined, page, size: 20, my_events: true });
      const events = Array.isArray(res) ? res : (res?.data || []);
      setEvents(events);
      setTotal(res?.total || events.length || 0);
    } catch { setEvents([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [tab, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchEvents();
      fetchCounts();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchCounts(); }, []);

  const initiateSubmit = (ev: Event) => {
    if (!ev.poster_path) {
      toast.error('Poster upload is required! Please "Edit" the draft to upload a poster first.', { duration: 5000 });
      return;
    }
    setSubmitEvent(ev);
    setIsTermsOpen(true);
  };

  const confirmSubmit = async () => {
    if (!submitEvent) return;
    setSubmitting(true);
    try {
      await eventService.submit(submitEvent.id);
      toast.success('Event submitted for approval');
      setIsTermsOpen(false);
      setSubmitEvent(null);
      fetchEvents();
      fetchCounts();
    } catch (err: any) { 
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed';
      if (typeof msg === 'string' && msg.toLowerCase().includes('poster')) {
        toast.error('Poster upload is required! Please "Edit" the draft to upload a poster first.', { duration: 5000 });
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Submission failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ev: Event) => {
    try {
      await eventService.delete(ev.id);
      toast.success('Draft deleted');
      fetchEvents();
      fetchCounts();
    } catch (err: any) { toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async () => {
    if (!cancelEvent || !cancelReason.trim()) { toast.error('Reason is required'); return; }
    setCancelling(true);
    try {
      await eventService.cancel(cancelEvent.id, cancelReason);
      toast.success('Event cancelled');
      setCancelEvent(null);
      setCancelReason('');
      fetchEvents();
      fetchCounts();
    } catch (err: any) { toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed'); }
    finally { setCancelling(false); }
  };

  const handleUpdateDeadline = async () => {
    if (!deadlineEvent) return;
    if (!deadline) { toast.error('Please select a date and time'); return; }
    if (!window.confirm("WARNING: Changing the deadline will reset the event's approval status. Are you sure?")) return;
    setSavingDeadline(true);
    try {
      await eventService.update(deadlineEvent.id, { registration_deadline: new Date(deadline).toISOString() });
      toast.success('Deadline updated (Event submitted for approval)');
      setDeadlineEvent(null);
      fetchEvents();
      fetchCounts();
    } catch (err: any) { toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed'); }
    finally { setSavingDeadline(false); }
  };

  const tabsWithCounts = STATUS_TABS.map(t => ({
    value: t.value,
    label: `${t.label} (${tabCounts[t.value] ?? '...'})`
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {!hideHeader && (
        <div className="flex items-start justify-between">
          <div><h1 className="page-title">My Events</h1><p className="page-subtitle">{total} events you have created or manage</p></div>
          <Link href={`${basePath}/events/create`}><Button icon={<Plus className="w-4 h-4" />}>Create Event</Button></Link>
        </div>
      )}

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Input placeholder="Search events…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Tabs tabs={tabsWithCounts} active={tab} onChange={t => { setTab(t); setPage(1); }} />
      </div>

      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-1/2 rounded" /><div className="skeleton h-3 w-1/3 rounded" /></div>)
        : events?.length === 0 ? (
          <div className="card"><EmptyState icon="📅" title="No events found" subtitle="Create your first event to get started"
            action={<Link href={`${basePath}/events/create`}><Button>Create Event</Button></Link>} /></div>
        ) : events?.map(ev => (
          <div key={ev.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-1">
                <EventTypeBadge type={ev.event_type} /><StatusBadge status={ev.status} />
                {ev.is_collaborative && <span className="badge bg-indigo-100 text-indigo-700">Collaborative</span>}
              </div>
              <h3 className="font-display font-bold text-[var(--text-primary)] truncate">{ev.title}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(ev.start_datetime)} · {ev.venue?.name || ev.venue_custom || 'Venue TBD'}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`${basePath}/events/${ev.id}`} title="View">
                <Button variant="secondary" size="sm" icon={<Eye className="w-4 h-4" />} />
              </Link>
              {!['cancelled', 'archived', 'completed'].includes(ev.status) && (
                <Link href={`${basePath}/events/${ev.id}/edit`} title="Edit">
                  <Button variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} />
                </Link>
              )}
              {ev.status === 'draft' && <>
                <Button size="sm" icon={<Send className="w-4 h-4" />} onClick={() => initiateSubmit(ev)}>Submit</Button>
                <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(ev)} />
              </>}
              {['approved','ongoing','pending_director'].includes(ev.status) && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => { 
                    setDeadlineEvent(ev); 
                    if (ev.registration_deadline) {
                      const d = new Date(ev.registration_deadline);
                      const tzOffset = d.getTimezoneOffset() * 60000;
                      const localIsoTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
                      setDeadline(localIsoTime);
                    } else {
                      setDeadline('');
                    }
                  }}>Edit Deadline</Button>
                  <Button variant="danger" size="sm" onClick={() => { setCancelEvent(ev); setCancelReason(''); }}>Cancel</Button>
                </>
              )}

            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />

      <Modal open={!!cancelEvent} onClose={() => { setCancelEvent(null); setCancelReason(''); }}
        title="Cancel Event"
        footer={<>
          <Button variant="secondary" onClick={() => { setCancelEvent(null); setCancelReason(''); }}>Back</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Confirm Cancellation</Button>
        </>}>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="font-semibold text-red-800">{cancelEvent?.title}</p>
            <p className="text-xs text-[var(--text-danger)] mt-0.5">All registered students will be notified via email.</p>
          </div>
          <Textarea label="Cancellation Reason (required)" placeholder="Explain why this event is being cancelled…"
            rows={4} value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
        </div>
      </Modal>

      <TermsModal
        open={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onConfirm={confirmSubmit}
        loading={submitting}
      />

      <Modal open={!!deadlineEvent} onClose={() => { setDeadlineEvent(null); }}
        title="Edit Registration Deadline"
        footer={<>
          <Button variant="secondary" onClick={() => setDeadlineEvent(null)}>Back</Button>
          <Button loading={savingDeadline} onClick={handleUpdateDeadline}>Save Deadline</Button>
        </>}>
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <p className="text-xs text-orange-800">
              <strong>Warning:</strong> Changing the deadline will trigger the approval chain again from the start.
            </p>
          </div>
          <Input type="datetime-local" label="Registration Deadline" 
            value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>
      </Modal>


    </div>
  );
}
