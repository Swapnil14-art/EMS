'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, Link as LinkIcon, Upload, ExternalLink, Download, CheckCircle2, ArrowLeft } from 'lucide-react';
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
  const [selectedEventId, setSelectedEventId] = useState<number | null>(urlEventId);
  const selectedEvent = myEvents.find(e => e.id === selectedEventId);

  const [docs, setDocs] = useState<EventDocument[]>([]);
  const [links, setLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ link_type: 'other', url: '', label: '' });
  const [submitting, setSubmitting] = useState(false);

  const [uploadingInternal, setUploadingInternal] = useState(false);
  const [uploadingPart, setUploadingPart] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const partInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = () => {
    eventService.list({ size: 50 }).then(r => setMyEvents(r.data || [])).catch(() => {});
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
    ]).then(([dRes, lRes]) => { 
      setDocs(Array.isArray(dRes) ? dRes : []); 
      setLinks(Array.isArray(lRes) ? lRes : []); 
    })
    .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
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

  const eventOptions = myEvents?.map(e => ({ value: String(e.id), label: e.title }));
  const isCompleted = selectedEvent ? new Date(selectedEvent.end_datetime).getTime() < Date.now() || ['completed', 'archived'].includes(selectedEvent.status) : false;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 btn-ghost p-1.5 -ml-2 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))]"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="page-title">Event Documents & Links</h1>
          <p className="page-subtitle">Manage documents, reports, and tracking links for your events</p>
        </div>
      </div>

      {/* Event selector */}
      <div className="card p-4">
        <Select label="Select Event" options={eventOptions} placeholder="Choose an event to manage…"
          value={selectedEventId ? String(selectedEventId) : ''}
          onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)} />
      </div>

      {!selectedEventId || !selectedEvent ? (
        <div className="card"><EmptyState icon={<FileText />} title="Select an event" subtitle="Choose an event above to manage its documents and links" /></div>
      ) : loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 space-y-2"><div className="skeleton h-4 w-1/2 rounded" /></div>)}</div>
      ) : (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Internal Documents UI removed as per cleanup */}

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
            {/* Participation Document */}
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
                    <Download className="w-4 h-4"/> Download Current
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

            {/* Final Report moved to Report Section */}
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
