'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, Link as LinkIcon, Upload, Download, CheckCircle2, ArrowLeft, Search } from 'lucide-react';
import { eventService, resourceService, reportService, rndReportService } from '@/lib/services';
import { Button, Input, Select, Modal, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
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
  const { user } = useAuthStore();
  const isCoordinator = user?.role === 'club_coordinator';
  const effectiveViewOnly = viewOnly || !isCoordinator;

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlEventId = searchParams.get('event') ? Number(searchParams.get('event')) : null;
  const initialTab = searchParams.get('tab') || 'internal';

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL'); // ALL, REPORT, DOCUMENT, ATTENDANCE
  const [selectedEventId, setSelectedEventId] = useState<number | null>(urlEventId);
  const selectedEvent = myEvents.find(e => e.id === selectedEventId);

  const DOC_TYPE_OPTIONS = [
    { value: 'ALL', label: 'All Document Types' },
    { value: 'REPORT', label: 'Report' },
    { value: 'DOCUMENT', label: 'Document' },
    { value: 'ATTENDANCE', label: 'Attendance' },
  ];

  const [docs, setDocs] = useState<EventDocument[]>([]);
  const [links, setLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ link_type: 'other', url: '', label: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [rndReportData, setRndReportData] = useState<any>(null);

  const [uploadingInternal, setUploadingInternal] = useState(false);
  const [uploadingPart, setUploadingPart] = useState(false);
  const [uploadingAttendance, setUploadingAttendance] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadingRndReport, setUploadingRndReport] = useState(false);
  const [uploadedAttendancePath, setUploadedAttendancePath] = useState<string | null>(null);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const partInputRef = useRef<HTMLInputElement>(null);
  const attendanceInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);
  const rndReportInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = (documentType = docTypeFilter) => {
    const listParams = isCoordinator ? { size: 50, manage_only: true } : { size: 50 };
    eventService.list({
      ...listParams,
      document_type: documentType === 'ALL' ? undefined : documentType as 'DOCUMENT' | 'ATTENDANCE' | 'REPORT',
    }).then(r => setMyEvents(r.data || [])).catch(() => { });
  };

  useEffect(() => {
    if (!selectedEventId) fetchEvents();
  }, [docTypeFilter, selectedEventId, isCoordinator]);

  useEffect(() => {
    if (selectedEventId && !myEvents.some(e => e.id === selectedEventId)) {
      eventService.get(selectedEventId).then(ev => {
        if (ev) setMyEvents(prev => [...prev, ev]);
      }).catch(() => {});
    }
  }, [selectedEventId, myEvents]);

  const fetchDocsAndLinks = () => {
    if (!selectedEventId) return;
    setLoading(true);
    Promise.all([
      resourceService.getDocs(selectedEventId),
      resourceService.getLinks(selectedEventId),
      reportService.get(selectedEventId).catch(() => null),
      rndReportService.get(selectedEventId).catch(() => null),
    ]).then(([dRes, lRes, rRes, rndRes]) => {
      setDocs(Array.isArray(dRes) ? dRes : []);
      setLinks(Array.isArray(lRes) ? lRes : []);
      setReportData(rRes);
      setRndReportData(rndRes);
    })
      .catch(() => { }).finally(() => setLoading(false));
  };

  useEffect(() => {
    setUploadedAttendancePath(null);
    fetchDocsAndLinks();
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

  const handleUploadAttendance = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;
    setUploadingAttendance(true);
    try {
      const response: any = await reportService.uploadAttendance(selectedEventId, file);
      toast.success('Attendance document uploaded successfully');
      
      const newPath = response?.attendance_doc_path ?? response?.path ?? response?.generated_report_path ?? 'temp';
      if (newPath !== 'temp') setUploadedAttendancePath(newPath);

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
    const isDocEligible = ['approved', 'ongoing', 'completed', 'archived'].includes(e.status);
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
      matchesStatus = ['completed', 'archived'].includes(e.status);
    } else if (statusFilter === 'ARCHIVED') {
      matchesStatus = e.status === 'archived';
    }

    const matchesSearch = searchTerm ? (
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.event_type && e.event_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.target_audience && e.target_audience.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : true;

    return matchesStatus && matchesSearch;
  });

  const isCompleted = selectedEvent ? new Date(selectedEvent.end_datetime).getTime() < Date.now() || ['completed', 'archived'].includes(selectedEvent.status) : false;
  const attendanceDocPath = uploadedAttendancePath || reportData?.attendance_doc_path || selectedEvent?.attendance_doc_path;

  const handleBackToMainDocuments = () => {
    setSelectedEventId(null);
    router.push(`${basePath}/documents`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Event Documents & Links</h1>
        <p className="page-subtitle">Manage documents, reports, and tracking links for your events</p>
      </div>

      {/* Event selector & Filter Bar (shown when browsing events list) */}
      {!selectedEventId && (
        <div className="card w-full p-4 space-y-4">
          <div className="flex w-full flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'UPCOMING', label: 'Upcoming' },
                  { value: 'ONGOING', label: 'Ongoing' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'ARCHIVED', label: 'Archived' }
                ]}
                className="w-full sm:w-44 flex-shrink-0"
              />
              <Select
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                options={DOC_TYPE_OPTIONS}
                className="w-full sm:w-48 flex-shrink-0"
              />
            </div>
            {/* Extended full-width search input */}
            <div className="flex-1 w-full min-w-[280px]">
              <Input
                className="w-full h-11"
                placeholder="Search events by name, type, or audience..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                leftIcon={<Search className="w-4 h-4 text-[var(--text-muted)]" />}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header when a specific event is selected */}
      {selectedEventId && selectedEvent && (
        <div className="card p-4 flex items-center justify-between gap-4 bg-surface/50 border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToMainDocuments}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-medium hover:bg-[var(--surface-subtle)] transition-colors"
              aria-label="Back to main documents page"
              title="Back to all events"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Events</span>
            </button>
            <div className="border-l border-[var(--border-subtle)] pl-3">
              <h2 className="font-bold text-base text-[var(--text-primary)]">{selectedEvent.title}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Status: <span className="font-semibold uppercase">{selectedEvent.status}</span> • {new Date(selectedEvent.start_datetime).toLocaleDateString()}
              </p>
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
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-[var(--surface-subtle)] text-[var(--text-secondary)] uppercase tracking-wider">{e.status}</span>
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

          {/* External Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title">External Links</h2>
                {!effectiveViewOnly && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddLinkOpen(true)}>Add Link</Button>}
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
                        {!effectiveViewOnly && (
                          <button onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors">
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

            {/* Participation Document */}
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="section-title">Participation Document</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">This document is visible to students on the event registration page.</p>
                </div>
                {selectedEvent.participant_doc_url && <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)]" />}
              </div>

              {selectedEvent.participant_doc_url && (
                <div className="mb-4">
                  <a href={selectedEvent.participant_doc_url} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 w-full justify-center">
                    <Download className="w-4 h-4" /> Download Current
                  </a>
                </div>
              )}

              {!effectiveViewOnly && !isCompleted ? (
                <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                  <input type="file" ref={partInputRef} className="hidden" onChange={handleUploadParticipant} accept="application/pdf" />
                  <Button variant={selectedEvent.participant_doc_url ? 'secondary' : 'primary'} loading={uploadingPart} icon={<Upload className="w-4 h-4" />} onClick={() => partInputRef.current?.click()} className="w-full justify-center">
                    {selectedEvent.participant_doc_url ? 'Upload New Document' : 'Upload Participation Document'}
                  </Button>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2">PDF files only. Replaces existing file.</p>
                </div>
              ) : !effectiveViewOnly ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-[var(--border-subtle)]">
                  Upload restricted (Event has ended)
                </div>
              ) : null}
            </div>

            {/* Attendance Document */}
            <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
              <div className="flex items-start justify-between mb-4 pr-8">
                <div>
                  <h3 className="section-title">Attendance Document</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Upload the finalized attendance sheet before report submission (optional).</p>
                </div>
                {attendanceDocPath && (
                  <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)] absolute top-6 right-6" />
                )}
              </div>

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

              {!effectiveViewOnly && !reportData?.generated_report_path ? (
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
              ) : !effectiveViewOnly ? (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-[var(--border-subtle)]">
                  Upload restricted (Report Submitted)
                </div>
              ) : null}
            </div>

            {/* Final Event Report (Normal events only) */}
            {!selectedEvent?.is_rnd_event && (
              <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div>
                    <h3 className="section-title">Final Event Report</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Final report submitted/generated for this event.</p>
                  </div>
                  {reportData?.generated_report_path && (
                    <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)] absolute top-6 right-6" />
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

                {!effectiveViewOnly && !reportData?.generated_report_path ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-[var(--border-subtle)]">
                    No report submitted yet. Go to <button onClick={() => router.push(`${basePath}/report?event=${selectedEventId}`)} className="text-[rgb(var(--color-primary))] font-semibold hover:underline">Report Tab</button> to submit.
                  </div>
                ) : !effectiveViewOnly ? (
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
            )}

            {/* Final RnD Report (R&D events only) */}
            {selectedEvent?.is_rnd_event && (
              <div className="card p-6 border-[var(--input-focus-ring)] bg-surface/30 relative">
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div>
                    <h3 className="section-title">Final RnD Report</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Final RnD report submitted/generated for this event.</p>
                  </div>
                  {rndReportData?.generated_report_path && (
                    <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)] absolute top-6 right-6" />
                  )}
                </div>

                {rndReportData?.generated_report_path && (
                  <div className="mb-4">
                    <a
                      href={`/api/admin/files/${rndReportData.generated_report_path.replace(/^\/+/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary gap-2 w-full justify-center h-11"
                    >
                      <Download className="w-4 h-4" /> Download Current RnD Report
                    </a>
                  </div>
                )}

                {!effectiveViewOnly && !rndReportData?.generated_report_path ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-white rounded-xl border border-[var(--border-subtle)]">
                    No RnD report submitted yet. Go to <button onClick={() => router.push(`${basePath}/rnd-report?event=${selectedEventId}`)} className="text-[rgb(var(--color-primary))] font-semibold hover:underline">RnD Report Tab</button> to submit.
                  </div>
                ) : !effectiveViewOnly ? (
                  <div className="border border-dashed border-[var(--input-focus-ring)] bg-white rounded-xl p-4 text-center">
                    <input type="file" ref={rndReportInputRef} className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedEventId) return;
                      setUploadingRndReport(true);
                      try {
                        await rndReportService.uploadDoc(selectedEventId, file);
                        toast.success('RnD Report updated successfully');
                        fetchDocsAndLinks();
                      } catch (err: any) { toast.error('Failed to upload'); }
                      finally { setUploadingRndReport(false); if (rndReportInputRef.current) rndReportInputRef.current.value = ''; }
                    }} accept=".pdf,.doc,.docx" />
                    <Button
                      variant="secondary"
                      loading={uploadingRndReport}
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => rndReportInputRef.current?.click()}
                      className="w-full justify-center h-11"
                    >
                      Upload New Document
                    </Button>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">Replaces existing RnD report.</p>
                  </div>
                ) : null}
              </div>
            )}
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
