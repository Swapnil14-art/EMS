'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { eventService, rndReportService } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import { FileText, Upload, CheckCircle2, Download, Search, FlaskConical } from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

export default function AdditionalRndReportsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const perms = user?.extra_permissions ?? [];
  const canView   = perms.includes('view_rnd_reports');
  const canSubmit = perms.includes('submit_rnd_reports');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'additional' || (!canView && !canSubmit)) {
      router.replace('/additional'); return;
    }
    eventService.list({ status: 'completed,archived', size: 100 })
      .then(r => setEvents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  useEffect(() => {
    if (!selectedId) { setReportData(null); return; }
    setLoadingReport(true);
    rndReportService.get(selectedId)
      .then(r => setReportData(r))
      .catch(() => setReportData(null))
      .finally(() => setLoadingReport(false));
  }, [selectedId]);

  const selectedEvent = events.find(e => e.id === selectedId);
  const reportPath = reportData?.generated_report_path ?? null;

  const handleUpload = async () => {
    if (!selectedFile || !selectedId) return;
    setUploading(true);
    try {
      await rndReportService.uploadDoc(selectedId, selectedFile);
      toast.success('RnD Report submitted!');
      setSelectedFile(null);
      setSelectedId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = events.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">RnD Reports</h1>
        <p className="page-subtitle">
          {canSubmit ? 'View or submit RnD reports' : 'View submitted RnD reports'}
        </p>
      </div>

      <Alert type="info">
        <FlaskConical className="w-4 h-4" />
        <span>Submitting an RnD report does <strong>not</strong> affect the event lifecycle status.</span>
      </Alert>

      <div className="card p-6 space-y-5">
        {!selectedId ? (
          <div className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl outline-none focus:border-[var(--input-focus-ring)] transition-colors" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="card p-8 text-center text-[var(--text-muted)]">No events found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1">
                {filtered.map(ev => (
                  <div key={ev.id} onClick={() => setSelectedId(ev.id)} className="card p-4 hover:shadow-lg cursor-pointer transition-all border border-transparent hover:border-[rgb(var(--color-primary))]">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">{ev.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-[var(--surface-subtle)] text-[var(--text-secondary)] uppercase">{ev.status}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-2">{formatDate(ev.start_datetime)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 bg-[var(--page-bg)] rounded-xl relative border border-[var(--border-subtle)]">
              <button onClick={() => { setSelectedId(null); setSelectedFile(null); }} className="absolute top-4 right-4 text-xs font-semibold text-[rgb(var(--color-primary))] hover:underline">Change</button>
              <p className="font-semibold text-[var(--text-primary)] pr-24">{selectedEvent?.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(selectedEvent?.start_datetime ?? '')}</p>
            </div>

            {loadingReport ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative space-y-4">
                <div className="flex items-start justify-between pr-8">
                  <div>
                    <h3 className="section-title">RnD Report</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{reportPath ? 'An RnD report has been submitted.' : 'No RnD report submitted yet.'}</p>
                  </div>
                  {reportPath && <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)] absolute top-6 right-6" />}
                </div>

                {canView && reportPath && (
                  <a href={`/api/admin/files/${reportPath.replace(/^\/+/, '')}`} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 w-full justify-center h-11">
                    <Download className="w-4 h-4" /> Download RnD Report
                  </a>
                )}

                {canSubmit && (
                  <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                    <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-[var(--status-info-bg)] border border-[var(--status-info-text)] rounded-lg flex flex-col items-center">
                          <FileText className="w-6 h-6 text-[var(--status-info-text)] mb-1" />
                          <p className="text-sm font-medium text-[var(--status-info-text)] truncate max-w-full px-2">{selectedFile.name}</p>
                          <button onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-xs text-[var(--status-info-text)] hover:underline mt-1">Change File</button>
                        </div>
                        <Button loading={uploading} onClick={handleUpload} className="w-full justify-center h-11 bg-[var(--status-info-bg)] hover:bg-[var(--status-info-bg)] text-white border-0" icon={<CheckCircle2 className="w-4 h-4" />}>
                          SUBMIT RnD REPORT
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button variant={reportPath ? 'secondary' : 'primary'} icon={<Upload className="w-4 h-4" />} onClick={() => fileRef.current?.click()} className="w-full justify-center h-11">
                          {reportPath ? 'Upload New RnD Report' : 'Select RnD Report File'}
                        </Button>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2">PDF, Word · Max 20MB</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
