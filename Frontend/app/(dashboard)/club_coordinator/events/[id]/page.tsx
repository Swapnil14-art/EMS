'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, User, ArrowLeft, Download, Users, Upload, CheckCircle2, FileText, ImageIcon, X, Layers } from 'lucide-react';
import { eventService, approvalService, reportService } from '@/lib/services';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import ApprovalChain from '@/components/events/ApprovalChain';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { Event, EventApproval } from '@/types';
import toast from 'react-hot-toast';
import FullEventDetailsView from '@/components/events/FullEventDetailsView';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [approvals, setApprovals] = useState<EventApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventService.get(Number(id)),
      approvalService.getHistory(Number(id)).catch(() => []),
    ]).then(([ev, chain]) => {
      setEvent(ev);
      setApprovals(chain);
    }).catch(() => router.push('/'))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-4 animate-pulse"><div className="skeleton h-8 w-1/2 rounded"/><div className="skeleton h-64 rounded-2xl"/></div>;
  if (!event) return <div className="card p-8 text-center text-[var(--text-muted)]">Event not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Full Event Details (same view as director/dean/super_admin) */}
      <FullEventDetailsView event={event} />

      {/* Coordinator-specific: Approval Chain + Registration + Report */}
      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Post-Event Report */}
            <ReportUploadCard eventId={event.id} existingReportPath={event.report_path} status={event.status} />
          </div>

          {/* Approval chain sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="section-title mb-4">Approval Chain</h2>
              <ApprovalChain approvals={approvals} currentStep={event.current_approval_step || 0}/>
            </div>
            {event.registration_count !== undefined && (
              <div className="card p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[rgb(var(--color-primary))]"/>
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-xl">{event.registration_count}</p>
                  <p className="text-xs text-[var(--text-muted)]">Registered students</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Report Upload Card ────────────────────────────────────────────────

function ReportUploadCard({ eventId, existingReportPath, status }: { eventId: number; existingReportPath?: string; status: string }) {
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingReportPath);
  const [activeTab, setActiveTab] = useState<'upload' | 'generate'>('upload');
  
  // Upload State
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Generate State
  const [genTitle, setGenTitle] = useState('');
  const [genSummary, setGenSummary] = useState('');
  const [genOutcomes, setGenOutcomes] = useState('');
  const [genPhotos, setGenPhotos] = useState<File[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0];
    if (file) setFileName(file.name);
  };

  const handlePhotoChange = () => {
    const files = Array.from(photoRef.current?.files || []);
    if (files.length + genPhotos?.length > 5) {
      toast.error('You can only upload up to 5 photos');
      return;
    }
    setGenPhotos((prev) => [...prev, ...files].slice(0, 5));
  };

  const removePhoto = (index: number) => {
    setGenPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a report file first');
      return;
    }
    setUploading(true);
    try {
      await reportService.uploadDoc(eventId, file);
      setSubmitted(true);
      toast.success('Report submitted successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genTitle || !genSummary) {
      toast.error('Title and Summary are required');
      return;
    }
    setUploading(true);
    try {
      await reportService.submit(eventId, {
        title: genTitle,
        summary: genSummary,
        outcomes: genOutcomes || undefined
      } as any);
      if (genPhotos.length > 0) {
        await reportService.uploadPhotos(eventId, genPhotos);
      }
      setSubmitted(true);
      toast.success('Report generated and submitted successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Generation failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-6 border-2 border-dashed border-[var(--input-focus-ring)] bg-surface/30">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-[rgb(var(--color-primary))]" />
        <h2 className="section-title !mb-0">Final Event Report</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        The report generation option will unlock automatically once the event end date has passed.
      </p>

      {status !== 'completed' ? (
        <div className="text-center p-4 border border-slate-200 bg-slate-50 rounded-xl">
          <p className="text-xs text-[var(--text-muted)]">Upload locked (Event has not ended)</p>
        </div>
      ) : submitted ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="font-display font-bold text-[var(--text-primary)] text-lg">Report Submitted</p>
          <p className="text-sm text-[var(--text-muted)] text-center">Your post-event report has been submitted. The event will be archived shortly.</p>
          {existingReportPath && (
            <a href={existingReportPath} target="_blank" rel="noopener noreferrer"
              className="text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] font-medium flex items-center gap-1 mt-1">
              <Download className="w-3.5 h-3.5" /> View submitted report
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-bg-[var(--btn-secondary-bg)] rounded-lg">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'upload' ? 'bg-white shadow-sm text-[rgb(var(--color-primary))]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Upload PDF/Word
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'generate' ? 'bg-white shadow-sm text-[rgb(var(--color-primary))]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Generate Report
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-[var(--text-secondary)]">
                Upload the final event report to complete and archive this event. Accepted formats: PDF, Word, or any file up to 20 MB.
              </p>

              <div
                className="border-2 border-dashed border-[var(--input-border)] rounded-2xl p-8 text-center hover:border-[var(--input-focus-ring)] hover:bg-[var(--card-bg)]/50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                {fileName ? (
                  <p className="text-sm font-semibold text-[rgb(var(--color-primary))]">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Click to select file</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">PDF, Word, or any format · Max 20 MB</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,*/*"
                  onChange={handleFileChange}
                />
              </div>

              <Button
                loading={uploading}
                disabled={!fileName}
                onClick={handleUpload}
                className="w-full justify-center py-3"
                icon={<Upload className="w-4 h-4" />}
              >
                Submit &amp; Archive
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Report Title *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="E.g., Final Report on TechFest 2026"
                  value={genTitle}
                  onChange={e => setGenTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Event Summary *</label>
                <textarea 
                  className="input-field min-h-[100px] resize-y" 
                  placeholder="Provide a brief summary of what happened..."
                  value={genSummary}
                  onChange={e => setGenSummary(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Key Outcomes</label>
                <textarea 
                  className="input-field min-h-[80px] resize-y" 
                  placeholder="What were the results or feedback obtained?"
                  value={genOutcomes}
                  onChange={e => setGenOutcomes(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 flex justify-between">
                  <span>Event Photos (Optional)</span>
                  <span>{genPhotos?.length}/5</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {genPhotos?.map((photo, i) => (
                    <div key={i} className="relative aspect-video bg-bg-[var(--btn-secondary-bg)] rounded-lg border border-[var(--card-border)]-subtle overflow-hidden group">
                      <img src={URL.createObjectURL(photo)} alt="Upload" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removePhoto(i)} className="p-1 bg-[var(--btn-danger-bg)] text-[var(--btn-primary-text)] rounded-full hover:bg-[var(--btn-danger-bg)] transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {genPhotos?.length < 5 && (
                    <button 
                      onClick={() => photoRef.current?.click()}
                      className="aspect-video flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[var(--input-border)] rounded-lg hover:border-[var(--input-focus-ring)] hover:bg-[var(--card-bg)]/50 transition-colors text-[var(--text-muted)]"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Add Photo</span>
                    </button>
                  )}
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <Button
                loading={uploading}
                disabled={!genTitle || !genSummary}
                onClick={handleGenerate}
                className="w-full justify-center py-3"
                icon={<Layers className="w-4 h-4" />}
              >
                Generate &amp; Archive
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
