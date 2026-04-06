'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { eventService, reportService } from '@/lib/services';
import { Select, Button, Alert } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

export default function ClubCoordinatorReportPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    eventService.list({ status: 'completed', size: 50 })
      .then(r => setEvents(r.data || []))
      .catch(() => {});
  }, []);

  const selectedEvent = events.find(e => e.id === selectedId);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !selectedId) { toast.error('Select an event and a file'); return; }
    setUploading(true);
    try {
      await reportService.uploadDoc(selectedId, file);
      setUploaded(true);
      toast.success('Report submitted! Event will be archived.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const eventOptions = events?.map(e => ({ value: String(e.id), label: e.title + ' (' + formatDate(e.start_datetime) + ')' }));

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Post-Event Report</h1>
        <p className="page-subtitle">Submit the post-event report to archive the event</p>
      </div>

      <Alert type="info">
        <FileText className="w-4 h-4" />
        <span>Submitting the report will <strong>immediately archive</strong> the event. Accepted: PDF, Word, any file up to 20MB.</span>
      </Alert>

      <div className="card p-6 space-y-5">
        <Select label="Select Completed Event" options={eventOptions} placeholder="Choose event…"
          value={selectedId ? String(selectedId) : ''}
          onChange={e => { setSelectedId(e.target.value ? Number(e.target.value) : null); setUploaded(false); }} />

        {selectedEvent && (
          <div className="p-4 bg-[var(--page-bg)] rounded-xl">
            <p className="font-semibold text-[var(--text-primary)]">{selectedEvent.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(selectedEvent.start_datetime)} · {selectedEvent.venue?.name || selectedEvent.venue_custom || '—'}</p>
            {selectedEvent.report_path && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />Report already submitted
              </div>
            )}
          </div>
        )}

        {uploaded ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <p className="font-display font-bold text-[var(--text-primary)] text-xl">Report Submitted!</p>
            <p className="text-sm text-[var(--text-muted)] text-center">The event has been archived successfully.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="label">Report File</label>
              <div className="border-2 border-dashed border-[var(--input-border)] rounded-2xl p-8 text-center hover:border-[var(--input-focus-ring)] hover:bg-[var(--card-bg)]/30 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Click to select file</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">PDF, Word, or any format · Max 20MB</p>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,*/*" />
              </div>
            </div>
            <Button loading={uploading} disabled={!selectedId} onClick={handleUpload} className="w-full justify-center py-3"
              icon={<Upload className="w-4 h-4" />}>
              Submit Report & Archive Event
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
