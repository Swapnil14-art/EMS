'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, Link as LinkIcon, Upload, ExternalLink, Download, CheckCircle2, ArrowLeft, Search } from 'lucide-react';
import { eventService, resourceService, reportService } from '@/lib/services';
import { Button, Input, Select, Modal, Alert, EmptyState } from '@/components/ui';
import type { EventDocument, EventLink, Event } from '@/types';
import toast from 'react-hot-toast';

const LINK_TYPES = [
  { value: 'registration', label: 'Registration Form' },
  { value: 'payment', label: 'Payment Link' },
  { value: 'oc_form', label: 'OC Form' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'other', label: 'Other' },
];

export function EventDocuments({ basePath, viewOnly = false }: { basePath: string; viewOnly?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlEventId = searchParams.get('event') ? Number(searchParams.get('event')) : null;
  const initialTab = searchParams.get('tab') || 'internal';

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(urlEventId);
  const selectedEvent = myEvents.find(e => e.id === selectedEventId);

  const [docs, setDocs] = useState<EventDocument[]>([]);
  const [links, setLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ link_type: 'other', url: '', label: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const [uploadingInternal, setUploadingInternal] = useState(false);
  const [uploadingPart, setUploadingPart] = useState(false);
  const [uploadingAttendance, setUploadingAttendance] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadedAttendancePath, setUploadedAttendancePath] = useState<string | null>(null);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const partInputRef = useRef<HTMLInputElement>(null);
  const attendanceInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = () => {
    eventService.list({ size: 50, manage_only: true }).then(r => setMyEvents(r.data || [])).catch(() => { });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchDocsAndLinks = () => {
    if (!selectedEventId) return;
    setLoading(true);
    Promise.all([
      resourceService.getDocs(selectedEventId),
      resourceService.getLinks(selectedEventId),
      reportService.get(selectedEventId).catch(() => null),
    ]).then(([dRes, lRes, rRes]) => {
      setDocs(Array.isArray(dRes) ? dRes : []);
      setLinks(Array.isArray(lRes) ? lRes : []);
      setReportData(rRes);
    })
      .catch(() => { }).finally(() => setLoading(false));
  };

  useEffect(() => {
    setUploadedAttendancePath(null);
    fetchDocsAndLinks();
    // Scroll to report section if triggered from MyEvents
    if (initialTab === 'report') {
      setTimeout(() => document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' }), 500);
    }
  }, [selectedEventId]);

  const handleAddLink = async () => {
    if (!selectedEventId || !linkForm.url) { toast.error('URL is required'); return; }
    setSubmitting(true);
    try {
      const newLink = await resourceService.addLink(selectedEventId, linkForm as any);
      setLinks(l => [...l, newLink]);
      setAddLinkOpen(false);
      setLinkForm({ link_type: 'other', url: '', label: '' });
      toast.success('Link added');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!selectedEventId) return;
    try {
      await resourceService.deleteLink(selectedEventId, linkId);
      setLinks(l => l.filter(x => x.id !== linkId));
      toast.success('Link removed');
    } catch { toast.error('Failed to remove link'); }
  };

  const handleUploadInternal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;
    setUploadingInternal(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await resourceService.addDoc(selectedEventId, formData);
      toast.success('Internal document uploaded');
      fetchDocsAndLinks();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to upload'); }
    finally {
      setUploadingInternal(false);
      if (internalInputRef.current) internalInputRef.current.value = '';
    }
  };

  const handleUploadParticipant = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;
    setUploadingPart(true);
    try {
      await eventService.uploadParticipantDoc(selectedEventId, file);
      toast.success('Participant document uploaded successfully');
      fetchEvents();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to upload'); }
    finally {
      setUploadingPart(false);
      if (partInputRef.current) partInputRef.current.value = '';
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedEventId) return;
    setUploadingReport(true);
    try {
      const blob = await eventService.generateReport(selectedEventId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Event_Report_${selectedEventId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Automated report generated and downloaded!');
    } catch (err: any) {
      toast.error('Failed to generate report');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleUploadAttendance = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;
    setUploadingAttendance(true);
    try {
      const response: any = await reportService.uploadAttendance(selectedEventId, file);
      toast.success('Attendance document uploaded successfully');
      
      const newPath = response?.attendance_doc_path ?? response?.path ?? response?.generated_report_path ?? 'temp';
      if (newPath !== 'temp') setUploadedAttendancePath(newPath);

      // ── FIX: refresh both so the Download Current button and checkmark appear immediately
      await fetchDocsAndLinks();
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload');
    } finally {
      setUploadingAttendance(false);
      if (attendanceInputRef.current) attendanceInputRef.current.value = '';
    }
  };

  const filteredEvents = myEvents?.filter(e => {
    const isDocEligible = ['approved', 'ongoing', 'completed'].includes(e.status);
    if (!isDocEligible) return false;

    let matchesStatus = false;
    const now = new Date();
    const start = new Date(e.start_datetime);

    if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else if (statusFilter === 'APPROVED') {
      matchesStatus = e.status === 'approved';
    } else if (statusFilter === 'UPCOMING') {
      matchesStatus = e.status === 'approved' && start > now;
    } else if (statusFilter === 'ONGOING') {
      matchesStatus = e.status === 'ongoing';
    } else if (statusFilter === 'COMPLETED') {
      matchesStatus = e.status === 'completed';
    }

    const matchesSearch = searchTerm ? e.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesStatus && matchesSearch;
  });

  const eventOptions = filteredEvents?.map(e => ({ value: String(e.id), label: e.title }));
  const isCompleted = selectedEvent ? new Date(selectedEvent.end_datetime).getTime() < Date.now() || ['completed', 'archived'].includes(selectedEvent.status) : false;

  // Derived: attendance path can live in either reportData or selectedEvent
  const attendanceDocPath = uploadedAttendancePath || reportData?.attendance_doc_path || selectedEvent?.attendance_doc_path;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 btn-ghost p-1.5 -ml-2 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))]"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Event Documents & Links</h1>
          <p className="page-subtitle">Manage documents, reports, and tracking links for your events</p>
        </div>
      </div>

      {/* Event selector */}
      {!selectedEventId && (
        <div className="card w-full p-4 space-y-4">
          <div className="flex items-center gap-3 w-full">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'UPCOMING', label: 'Upcoming' },
                { value: 'ONGOING', label: 'Ongoing' },
                { value: 'COMPLETED', label: 'Completed' }
              ]}
              className="w-48 flex-shrink-0"
            />
            <div className="flex-1 w-full">
              <Input
                className="w-full"
                placeholder="Search events by name..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      )}

      {!selectedEventId || !selectedEvent ? (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="card"><EmptyState icon={<FileText />} title="No events found" subtitle="No events match your current filters" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2 -m-2">
              {filteredEvents.map(e => (
                <div key={e.id} onClick={() => setSelectedEventId(e.id)} className="card p-4 hover:shadow-lg cursor-pointer transition-all border border-transparent hover:border-[rgb(var(--color-primary))]">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">{e.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">{e.status}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 uppercase tracking-wide">{e.event_type} • {e.target_audience?.replace('_', ' ') || 'General'}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-4 font-medium">{new Date(e.start_datetime).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 space-y-2"><div className="skeleton h-4 w-1/2 rounded" /></div>)}</div>
      ) : (
        <div className="space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title">External Links</h2>
                {!viewOnly && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddLinkOpen(true)}>Add Link</Button>}
              </div>
              <div className="card border-border bg-white">
                {links?.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)] text-sm">No external links added</div>
                ) : (
                  <div className="divide-y divide-border">
                    {links?.map(link => (
                      <div key={link.id} className="p-4 flex items-center gap-3">
                        <LinkIcon className="w-5 h-5 text-[rgb(var(--color-primary))] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[var(--text-primary)]">{link.label || link.link_type}</p>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[rgb(var(--color-primary))] hover:underline truncate block">{link.url}</a>
                        </div>
                        {!viewOnly && (
                          <button onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Participation Document — unchanged */}
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="section-title">Participation Document</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">This document is visible to students on the event registration page.</p>
                </div>
                {selectedEvent.participant_doc_url && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>

              {selectedEvent.participant_doc_url && (
                <div className="mb-4">
                  <a href={selectedEvent.participant_doc_url} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 w-full justify-center">
                    <Download className="w-4 h-4" /> Download Current
                  </a>
                </div>
              )}

              {!viewOnly && !isCompleted ? (
                <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                  <input type="file" ref={partInputRef} className="hidden" onChange={handleUploadParticipant} accept="application/pdf" />
                  <Button variant={selectedEvent.participant_doc_url ? 'secondary' : 'primary'} loading={uploadingPart} icon={<Upload className="w-4 h-4" />} onClick={() => partInputRef.current?.click()} className="w-full justify-center">
                    {selectedEvent.participant_doc_url ? 'Upload New Document' : 'Upload Participation Document'}
                  </Button>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2">PDF files only. Replaces existing file.</p>
                </div>
              ) : !viewOnly ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-slate-200">
                  Upload restricted (Event has ended)
                </div>
              ) : null}
            </div>

            {/* ── Attendance Document — FIXED ───────────────────────────────── */}
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
              <div className="flex items-start justify-between mb-4 pr-8">
                <div>
                  <h3 className="section-title">Attendance Document</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Upload the finalized attendance sheet before report submission (optional).</p>
                </div>
                {/* checkmark driven by unified attendanceDocPath */}
                {attendanceDocPath && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 absolute top-6 right-6" />
                )}
              </div>

              {/* Download button — appears as soon as attendanceDocPath is truthy */}
              {attendanceDocPath && (
                <div className="mb-4">
                  <a
                    href={`/api/admin/files/${attendanceDocPath.replace(/^\/+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary gap-2 w-full justify-center h-11"
                  >
                    <Download className="w-4 h-4" /> Download Current
                  </a>
                </div>
              )}

              {!viewOnly && !reportData?.generated_report_path ? (
                <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                  <input type="file" ref={attendanceInputRef} className="hidden" onChange={handleUploadAttendance} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" />
                  <Button
                    variant={attendanceDocPath ? 'secondary' : 'primary'}
                    loading={uploadingAttendance}
                    icon={<Upload className="w-4 h-4" />}
                    onClick={() => attendanceInputRef.current?.click()}
                    className="w-full justify-center h-11"
                  >
                    {attendanceDocPath ? 'Upload New Document' : 'Upload Attendance Document'}
                  </Button>
                  {attendanceDocPath && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">Files only. Replaces existing file.</p>
                  )}
                </div>
              ) : !viewOnly ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-slate-200">
                  Upload restricted (Report Submitted)
                </div>
              ) : null}
            </div>

            {/* Final Event Report — unchanged */}
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
              <div className="flex items-start justify-between mb-4 pr-8">
                <div>
                  <h3 className="section-title">Final Event Report</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Final report submitted/generated for this event.</p>
                </div>
                {reportData?.generated_report_path && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 absolute top-6 right-6" />
                )}
              </div>

              {reportData?.generated_report_path && (
                <div className="mb-4">
                  <a
                    href={`/api/admin/files/${reportData.generated_report_path.replace(/^\/+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary gap-2 w-full justify-center h-11"
                  >
                    <Download className="w-4 h-4" /> Download Current Report
                  </a>
                </div>
              )}

              {!viewOnly && !reportData?.generated_report_path ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-slate-200">
                  No report submitted yet. Go to <button onClick={() => router.push(`${basePath}/report?event=${selectedEventId}`)} className="text-[rgb(var(--color-primary))] font-semibold hover:underline">Report Tab</button> to submit.
                </div>
              ) : !viewOnly ? (
                <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                  <input type="file" ref={reportInputRef} className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedEventId) return;
                    setUploadingReport(true);
                    try {
                      await reportService.uploadDoc(selectedEventId, file);
                      toast.success('Report updated successfully');
                      fetchDocsAndLinks();
                    } catch (err: any) { toast.error('Failed to upload'); }
                    finally { setUploadingReport(false); if (reportInputRef.current) reportInputRef.current.value = ''; }
                  }} accept=".pdf,.doc,.docx" />
                  <Button
                    variant="secondary"
                    loading={uploadingReport}
                    icon={<Upload className="w-4 h-4" />}
                    onClick={() => reportInputRef.current?.click()}
                    className="w-full justify-center h-11"
                  >
                    Upload New Document
                  </Button>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2">Replaces existing report.</p>
                </div>
              ) : null}
            </div>
          </div>

        </div>
      )}

      <Modal open={addLinkOpen} onClose={() => setAddLinkOpen(false)} title="Add External Link"
        footer={<>
          <Button variant="secondary" onClick={() => setAddLinkOpen(false)}>Cancel</Button>
          <Button loading={submitting} onClick={handleAddLink}>Add Link</Button>
        </>}>
        <div className="space-y-4">
          <Select label="Link Type" options={LINK_TYPES} value={linkForm.link_type}
            onChange={e => setLinkForm(f => ({ ...f, link_type: e.target.value }))} />
          <Input label="URL" type="url" placeholder="https://…" value={linkForm.url}
            onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} />
          <Input label="Label (optional)" placeholder="e.g. Day 1 Photos" value={linkForm.label}
            onChange={e => setLinkForm(f => ({ ...f, label: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
