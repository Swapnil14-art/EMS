'use client';
import { useState, useEffect } from 'react';
import { Shield, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { approvalService } from '@/lib/services';
import { Button, Modal, Textarea, Alert, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

export default function OverrideRequestsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Event | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await approvalService.getPending();
      // Filter for events that have a venue clash warning
      setEvents(res.data || []);
    } catch { setEvents([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleOverride = async () => {
    if (!selected || !reason.trim()) { toast.error('Override reason is mandatory'); return; }
    setSubmitting(true);
    try {
      await approvalService.approve(selected.id, reason);
      toast.success('Override approved with reason recorded');
      setSelected(null);
      setReason('');
      fetchPending();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Override Requests</h1><p className="page-subtitle">Venue clash override approvals requiring written justification</p></div>
        <span className="badge bg-amber-100 text-amber-700 text-sm px-3 py-1">{events?.length} pending</span>
      </div>

      <Alert type="warning">
        <AlertTriangle className="w-4 h-4" />
        <span>These events have a <strong>venue clash</strong>. Approving grants an override — your written reason is recorded and shown to all subsequent approvers.</span>
      </Alert>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-6 space-y-3"><div className="skeleton h-5 w-1/2 rounded" /><div className="skeleton h-3 w-1/3 rounded" /></div>)}</div>
      ) : events?.length === 0 ? (
        <div className="card"><EmptyState icon={<Shield />} title="No override requests" subtitle="All events have valid venue bookings" /></div>
      ) : events?.map(ev => (
        <div key={ev.id} className="card p-6 border-l-4 border-amber-400">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-1">{ev.title}</h3>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] mb-3">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(ev.start_datetime)}</span>
                {(ev.venue?.name || ev.venue_custom) && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium"><MapPin className="w-3.5 h-3.5" />⚠ {ev.venue?.name || ev.venue_custom} — clash detected</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" icon={<Shield className="w-4 h-4" />} onClick={() => { setSelected(ev); setReason(''); }}>
                Approve with Override
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Modal open={!!selected} onClose={() => { setSelected(null); setReason(''); }}
        title="🛡️ Approve Venue Clash Override"
        footer={<>
          <Button variant="secondary" onClick={() => { setSelected(null); setReason(''); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleOverride}>Confirm Override</Button>
        </>}>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="font-semibold text-amber-800">{selected?.title}</p>
            <p className="text-xs text-amber-700 mt-1">Venue: {selected?.venue?.name || selected?.venue_custom}</p>
          </div>
          <Alert type="warning"><AlertTriangle className="w-4 h-4" /><span>Written reason is mandatory and will be visible to all subsequent approvers.</span></Alert>
          <Textarea label="Override Justification (required)" placeholder="Explain why this venue clash can be accepted…"
            rows={4} value={reason} onChange={e => setReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
