'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, CheckCircle2, Sparkles, ChevronDown, Download } from 'lucide-react';
import { eventService, reportService } from '@/lib/services';
import { Select, Button, Alert } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Lazy load the report generator to keep page.tsx bundle lean
const ReportGenerator = dynamic(() => import('@/components/events/ReportGenerator'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ClubCoordinatorReportPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [uploadedReportPath, setUploadedReportPath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchEvents = () => {
    eventService.list({ status: 'completed', size: 50, manage_only: true })
      .then(r => setEvents(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchReport = (id: number) => {
    setLoadingReport(true);
    reportService.get(id)
      .then(rRes => {
        setReportData(rRes);
        setUploadedReportPath(rRes?.generated_report_path ?? null);
      })
      .catch(() => setReportData(null))
      .finally(() => setLoadingReport(false));
  };

  useEffect(() => {
    if (selectedId) {
      fetchReport(selectedId);
      setUploaded(false);
      setShowGenerator(false);
      setSelectedFile(null);
    } else {
      setReportData(null);
      setSelectedFile(null);
    }
  }, [selectedId]);

  const selectedEvent = events.find(e => e.id === selectedId);

  const reportFilePath = uploadedReportPath ?? reportData?.generated_report_path ?? null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !selectedId) { 
      toast.error('Select an event and a file'); 
      return; 
    }
    setUploading(true);
    try {
      const result = await reportService.uploadDoc(selectedId, selectedFile);
      const newPath = result?.generated_report_path ?? result?.path ?? null;
      if (newPath) setUploadedReportPath(newPath);
      setUploaded(true);
      fetchEvents(); // Refresh to remove archived event
      toast.success('Report submitted! Event will be archived.');
      // Keep in sync
      fetchReport(selectedId);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally { 
      setUploading(false); 
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filteredEvents = events?.filter(e => {
    const matchesSearch = searchTerm ? e.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesSearch;
  });

  const handleGenerateComplete = () => {
    setUploaded(true);
    setShowGenerator(false);
    fetchEvents(); // Refresh to remove archived event
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Post-Event Report</h1>
        <p className="page-subtitle">Submit the post-event report to archive the event</p>
      </div>

      <Alert type="info">
        <FileText className="w-4 h-4" />
        <span>Submitting the report will <strong>immediately archive</strong> the event. You can upload a pre-made report OR generate one inline.</span>
      </Alert>

      <div className="card p-6 space-y-5">
        {/* ── Shared Event Selector ─────────────────────────────────────────── */}
        {/* ── Shared Event Selector ─────────────────────────────────────────── */}
        {!selectedId ? (
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search completed events by name..." 
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="w-full h-11 pl-11 pr-4 bg-white border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl outline-none focus:border-[var(--input-focus-ring)] transition-colors"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="card p-8 text-center text-[var(--text-muted)]">No completed events found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1">
                {filteredEvents.map(e => (
                   <div key={e.id} onClick={() => setSelectedId(e.id)} className="card p-4 hover:shadow-lg cursor-pointer transition-all border border-transparent hover:border-[rgb(var(--color-primary))]">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">{e.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">{e.status}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mt-4 font-medium">{formatDate(e.start_datetime)} · {e.venue?.name || e.venue_custom || '—'}</p>
                   </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedEvent && (
          <div className="p-4 bg-[var(--page-bg)] rounded-xl relative border border-slate-200">
            <button onClick={() => { setSelectedId(null); setUploaded(false); setShowGenerator(false); }} className="absolute top-4 right-4 text-xs font-semibold text-[rgb(var(--color-primary))] hover:underline pr-1">Change Event</button>
            <p className="font-semibold text-[var(--text-primary)] pr-24">{selectedEvent.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(selectedEvent.start_datetime)} · {selectedEvent.venue?.name || selectedEvent.venue_custom || '—'}</p>
            {selectedEvent.report_path && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />Report already submitted
              </div>
            )}
          </div>
        )}

        {loadingReport ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (uploaded || reportData?.generated_report_path) ? (
          <div className="space-y-4">
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
              <div className="flex items-start justify-between mb-4 pr-8">
                <div>
                  <h3 className="section-title">Final Event Report</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {reportData?.is_submitted ? "The post-event report has been submitted and the event is archived." : "A report has been generated. Ensure all details are correct before finalizing."}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500 absolute top-6 right-6" />
              </div>

              <div className="mb-4">
                {(reportData?.generated_report_path || uploaded) && (
                  <a 
                    href={`/api/admin/files/${reportData?.generated_report_path?.replace(/^\/+/, '') || ''}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-secondary gap-2 w-full justify-center h-11"
                  >
                    <Download className="w-4 h-4" /> Download Current
                  </a>
                )}
              </div>

              <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,*/*" onChange={handleFileSelect} />
                
                {selectedFile ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 mb-1" />
                      <p className="text-sm font-medium text-blue-900 truncate max-w-full px-2" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <button 
                        onClick={() => { setSelectedFile(null); if(fileRef.current) fileRef.current.value=''; }}
                        className="text-xs text-blue-600 hover:underline mt-1 font-medium"
                      >
                        Change File
                      </button>
                    </div>
                    <Button
                      loading={uploading}
                      onClick={handleConfirmUpload}
                      className="w-full justify-center h-11 bg-green-600 hover:bg-green-700 text-white border-0"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      disabled={!selectedId}
                    >
                      APPROVE AND SUBMIT
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="secondary"
                      loading={uploading} 
                      icon={<Upload className="w-4 h-4" />} 
                      onClick={() => fileRef.current?.click()} 
                      className="w-full justify-center h-11"
                    >
                      Upload New Document
                    </Button>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">Replaces existing report and ensures event is archived.</p>
                  </>
                )}
              </div>
            </div>
            
            <Button variant="ghost" onClick={() => { setSelectedId(null); setUploaded(false); fetchEvents(); }} className="w-full">
              Back to Events List
            </Button>
          </div>
        ) : (
          <>
            {/* ── Flow A: Upload Report (modified) ─────────────── */}
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
              <div className="flex items-start justify-between mb-4 pr-8">
                <div>
                  <h3 className="section-title">Upload Report File</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Upload the final event report document.
                  </p>
                </div>
                {/* ── FIX: checkmark appears once a file has been uploaded */}
                {reportFilePath && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 absolute top-6 right-6" />
                )}
              </div>

              {/* ── FIX: Download Current — visible as soon as reportFilePath is truthy */}
              {reportFilePath && (
                <div className="mb-4">
                  <a
                    href={`/api/admin/files/${reportFilePath.replace(/^\/+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary gap-2 w-full justify-center h-11"
                  >
                    <Download className="w-4 h-4" /> Download Current
                  </a>
                </div>
              )}

              <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                <input
                  type="file"
                  ref={fileRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx"
                />
                
                {selectedFile ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 mb-1" />
                      <p className="text-sm font-medium text-blue-900 truncate max-w-full px-2" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <button 
                        onClick={() => { setSelectedFile(null); if(fileRef.current) fileRef.current.value=''; }}
                        className="text-xs text-blue-600 hover:underline mt-1 font-medium"
                      >
                        Change File
                      </button>
                    </div>
                    <Button
                      loading={uploading}
                      onClick={handleConfirmUpload}
                      className="w-full justify-center h-11 bg-green-600 hover:bg-green-700 text-white border-0"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      disabled={!selectedId}
                    >
                      APPROVE AND SUBMIT
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant={reportFilePath ? 'secondary' : 'primary'}
                      loading={uploading}
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => fileRef.current?.click()}
                      className="w-full justify-center h-11"
                      disabled={!selectedId}
                    >
                      {/* ── FIX: label switches after first upload */}
                      {reportFilePath ? 'Upload New Document' : 'Select Report File'}
                    </Button>
                    {/* ── FIX: hint text appears once a file exists */}
                    {reportFilePath ? (
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">
                        PDF or Word only. Replaces existing file.
                      </p>
                    ) : (
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">
                        PDF, Word, or any format · Max 20MB
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── OR Divider ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-[var(--card-border)]" />
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest select-none">or</span>
              <div className="h-px flex-1 bg-[var(--card-border)]" />
            </div>

            {/* ── Flow B: Generate Report (new) ────────────────────────────── */}
            <div className="relative">
              <button
                disabled={!selectedId}
                onClick={() => setShowGenerator(prev => !prev)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] ${
                  !selectedId
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-600'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {showGenerator ? 'Collapse Generator' : 'Generate Report'}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showGenerator ? 'rotate-180' : ''}`} />
              </button>
              {!selectedId && (
                <p className="text-xs text-center text-[var(--text-muted)] mt-1.5 italic">
                  Available after selecting a completed event
                </p>
              )}
            </div>

            {/* ── Inline Generator Expansion ────────────────────────────────── */}
            {showGenerator && selectedEvent && (
              <div className="pt-2">
                <ReportGenerator event={selectedEvent} onComplete={handleGenerateComplete} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
