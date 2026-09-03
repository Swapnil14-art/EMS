'use client';
import { useState, useEffect } from 'react';
import {
  Info, Calendar, MapPin, Monitor, UtensilsCrossed,
  Package, FileText, CheckCircle2, Ticket, Users, FlaskConical,
  ArrowLeft, Download, ExternalLink, Link as LinkIcon, Loader2, XCircle, MessageSquare, AlertTriangle,
  IndianRupee
} from 'lucide-react';
import type { Event } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { eventService, approvalService, reportService, rndReportService } from '@/lib/services';
import { Button, Modal, Textarea, Alert } from '@/components/ui';
import toast from 'react-hot-toast';
import { extractApiError } from '@/lib/transformers';

export default function FullEventDetailsView({ event }: { event: Event }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const canViewRegistrations = user?.role === 'super_admin' || user?.id === event.created_by || (event as any).collaborating_clubs?.some((c: any) => c.club_id === user?.club_id);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [rndReportData, setRndReportData] = useState<any>(null);

  const [isPendingAction, setIsPendingAction] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'suggest_changes' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    if (canViewRegistrations) {
      setLoadingRegs(true);
      eventService.getRegistrations(event.id)
        .then(setRegistrations)
        .catch(console.error)
        .finally(() => setLoadingRegs(false));
    }

    // Fetch report to get attendance document
    reportService.get(event.id).then(setReportData).catch(() => { });
    rndReportService.get(event.id).then(setRndReportData).catch(() => { });

    if (userRole === 'director' || userRole === 'associate_dean' || userRole === 'club_coordinator') {
      approvalService.getPending().then(res => {
        const pendingEvents = Array.isArray(res) ? res : (res?.data || []);
        if (pendingEvents.some((e: any) => e.id === event.id)) {
          setIsPendingAction(true);
        }
      }).catch(() => { });
    }
  }, [event.id, canViewRegistrations, userId, userRole]);

  const handleAction = (act: 'approve' | 'reject' | 'suggest_changes') => {
    setAction(act);
    setRemarks('');
  };

  const handleApprovalSubmit = async () => {
    if (!action) return;
    if (action === 'reject' && !remarks.trim()) {
      toast.error('Rejection reason is mandatory');
      return;
    }
    setSubmittingAction(true);
    try {
      if (action === 'approve') {
        await approvalService.approve(event.id, remarks || undefined);
        toast.success('Event approved successfully');
      } else if (action === 'reject') {
        await approvalService.reject(event.id, remarks);
        toast.success('Event rejected');
      } else if (action === 'suggest_changes') {
        await approvalService.suggestChanges(event.id, remarks);
        toast.success('Changes suggested to organizer');
      }
      setAction(null);
      const dashboardRoute = user?.role === 'super_admin' ? '/admin' : `/${user?.role || ''}`;
      router.push(dashboardRoute); // redirect to respective dashboard
    } catch (err: any) {
      toast.error(extractApiError(err, 'Action failed'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await eventService.exportRegistrations(event.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event_${event.id}_registrations.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export registrations.");
    } finally {
      setExporting(false);
    }
  };

  const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => {
    if (value === undefined || value === null || value === '' || value === false) return null;
    return (
      <div className="flex flex-col gap-1.5 p-3.5 bg-[var(--page-bg)] rounded-xl relative overflow-hidden group">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[rgb(var(--color-primary))]">{label}</p>
        <p className="font-medium text-[var(--text-primary)] text-sm">{value === true ? <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)]" /> : value}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--card-bg)]">
      <div className="pt-10 max-w-5xl mx-auto px-6 py-12 animate-fade-in space-y-8">

        {/* Header Block */}
        <div className="flex flex-col gap-4 border-b border-[var(--card-border)] pb-6">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] self-start">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={event.status} />
              <EventTypeBadge type={event.event_type} />
              {event.is_club_event && <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Club Event</span>}
              {event.is_collaborative && <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Collaborative</span>}
              {event.is_rnd_event && <span className="badge bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">R&D Event</span>}
              {event.is_sponsored && <span className="badge bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]">Sponsored</span>}
            </div>
            <h1 className="font-display font-black text-[var(--text-primary)] text-3xl md:text-5xl leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* R&D Information Section */}
        {event.is_rnd_event && (
          <div className="space-y-4 p-5 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-2xl border border-purple-200 dark:border-purple-800">
            <h2 className="section-title flex items-center gap-2 text-lg text-purple-900 dark:text-purple-200">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" /> R&D Framework Classification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Activity Theme" value={event.rnd_activity_theme} />
              <Field label="Prescribed Activity" value={event.rnd_prescribed_activity} />
              <Field label="Semester / Quarter" value={event.rnd_semester_quarter} />
              <Field label="Tentative Date" value={event.rnd_tentative_date} />
            </div>
          </div>
        )}

        {/* Section A: Basic Info */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><Info className="w-5 h-5 text-[rgb(var(--color-primary))]" /> A. Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Event Type" value={event.event_type} />
            <Field label="Organizing School" value={event.school_department} />
            <Field label="Target Audience" value={event.target_audience} />
            <Field label="Event Incharge" value={event.event_incharge_name} />
            <Field label="Contact" value={event.event_incharge_contact} />
            {event.is_club_event && event.club?.name && <Field label="Organizing Club" value={event.club.name} />}
            {event.is_club_event && event.club?.coordinators && event.club.coordinators.length > 0 && <Field label="Club Coordinator Email" value={event.club.coordinators.map((c: any) => c.email).join(', ')} />}
            <Field label="Total Budget" value={event.budget !== undefined && event.budget !== null ? `₹ ${Number(event.budget).toLocaleString('en-IN')}` : undefined} />
          </div>
        </div>

        {/* Section B: Schedule */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><Calendar className="w-5 h-5 text-[rgb(var(--color-primary))]" /> B. Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Start Date & Time" value={formatDateTime(event.start_datetime)} />
            <Field label="End Date & Time" value={formatDateTime(event.end_datetime)} />
            {event.registration_start_datetime && <Field label="Registration Start Date & Time" value={formatDateTime(event.registration_start_datetime)} />}
            {event.registration_deadline && <Field label="Registration Deadline" value={formatDateTime(event.registration_deadline)} />}
          </div>
        </div>

        {/* Section C: Venue & Setup */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><MapPin className="w-5 h-5 text-[rgb(var(--color-primary))]" /> C. Venue & Setup</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Venue Type" value={event.venue_type} />
            <Field label="Venue Name / Custom Location" value={event.venue?.name || event.venue_custom} />
            <Field label="Seating Arrangement" value={event.seating_arrangement === 'Other' ? event.seating_other_detail : event.seating_arrangement} />
            <Field label="Tables Required" value={(event as any).tables_required} />
            <Field label="Chairs Required" value={(event as any).chairs_required} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Podium Setup" value={(event as any).podium_setup ? (event as any).podium_details || 'Yes' : undefined} />
            <Field label="Decoration Details" value={(event as any).decoration ? (event as any).decoration_details || 'Yes' : undefined} />
          </div>
        </div>

        {/* Section D: IT & Technical */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><Monitor className="w-5 h-5 text-[rgb(var(--color-primary))]" /> D. IT & Technical</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Projector Required" value={(event as any).it_projector} />
            <Field label="Wi-Fi Access" value={(event as any).it_wifi} />
            <Field label="Audio System" value={(event as any).it_audio ? (event as any).it_audio_details || 'Yes' : undefined} />
            <Field label="Laptop Requirements" value={(event as any).it_laptop ? (event as any).it_laptop_details || 'Yes' : undefined} />
            <Field label="Other IT Needs" value={(event as any).it_other} />
          </div>
        </div>

        {/* Section E: Food & Catering */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><UtensilsCrossed className="w-5 h-5 text-[rgb(var(--color-primary))]" /> E. Food & Catering</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Pax Count" value={(event as any).pax_count} />
            <Field label="Time of Service" value={(event as any).food_service_time} />
            <Field label="Food Requirements" value={(event as any).food_items ? (event as any).food_details || 'Yes' : undefined} />
            <Field label="Beverage Requirements" value={(event as any).beverage_items ? (event as any).beverage_details || 'Yes' : undefined} />
          </div>
        </div>

        {/* Section F: Additional */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><Package className="w-5 h-5 text-[rgb(var(--color-primary))]" /> F. Additional Requirements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Transport" value={(event as any).transport ? (event as any).transport_details || 'Yes' : undefined} />
            <Field label="Security" value={(event as any).security ? (event as any).security_details || 'Yes' : undefined} />
            <Field label="Printing" value={(event as any).printing ? (event as any).printing_details || 'Yes' : undefined} />
            <Field label="Volunteers" value={(event as any).volunteers ? (event as any).volunteers_details || 'Yes' : undefined} />
            <Field label="Other Requirements" value={(event as any).other_requirements} />
          </div>
        </div>

        {/* Comments */}
        {event.comments && (
          <div className="space-y-4">
            <h2 className="section-title text-lg">Additional Comments</h2>
            <div className="p-4 bg-[var(--status-warning-bg)] border border-[var(--status-warning-text)] rounded-2xl text-sm text-[var(--status-warning-text)] leading-relaxed">
              {event.comments}
            </div>
          </div>
        )}

        {/* Budget Breakdown Section for Approvers & Reviewers */}
        <div className="space-y-4 p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
            <div>
              <h2 className="section-title flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-200 m-0">
                <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Budget Breakdown & Allocations
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Itemized expense allocations submitted by the event coordinator for review & approval.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[var(--card-bg)] px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Total Budget:</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                ₹ {Number(event.budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {event.budget_breakdown && event.budget_breakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-emerald-200/70 dark:border-emerald-900/50 text-[11px] uppercase tracking-wider font-bold text-emerald-900 dark:text-emerald-300">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Category / Description</th>
                    <th className="py-2.5 px-3 text-right">Allocation (₹)</th>
                    <th className="py-2.5 px-3 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/60 dark:divide-emerald-950/40 font-medium">
                  {event.budget_breakdown.map((item, idx) => {
                    const total = Number(event.budget) || 0;
                    const pct = total > 0 ? ((Number(item.amount) / total) * 100).toFixed(1) : '0';
                    return (
                      <tr key={idx} className="hover:bg-white/40 dark:hover:bg-black/10 transition-colors">
                        <td className="py-2.5 px-3 text-xs text-[var(--text-muted)] font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[var(--text-primary)]">{item.category}</span>
                          {item.description && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                          ₹ {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-[var(--text-secondary)] font-mono">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-emerald-300 dark:border-emerald-800 font-bold bg-white/50 dark:bg-black/20">
                    <td colSpan={2} className="py-2.5 px-3 text-right text-xs uppercase tracking-wider text-[var(--text-primary)]">
                      Total Calculated Budget:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      ₹ {Number(event.budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono text-emerald-700 dark:text-emerald-400">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-sm flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">
                Estimated Total Budget: <strong className="text-[var(--text-primary)]">₹ {Number(event.budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </span>
              <span className="text-xs text-[var(--text-muted)] italic">
                (Legacy event proposal without itemized breakdown)
              </span>
            </div>
          )}
        </div>

        {/* Section G: Collaboration & Sponsorship */}
        {(event.is_collaborative || event.is_sponsored) && (
          <div className="space-y-4">
            <h2 className="section-title flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-[rgb(var(--color-primary))]" /> G. Collaboration & Sponsorship</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.is_collaborative && (
                <div className="flex flex-col gap-1.5 p-3.5 bg-[var(--page-bg)] rounded-xl relative overflow-hidden group">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[rgb(var(--color-primary))]">Collaborating Clubs</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(event as any).collaborating_clubs && (event as any).collaborating_clubs.length > 0 ? (
                      (event as any).collaborating_clubs.map((c: any) => (
                        <span key={c.id} className="inline-flex flex-col items-start badge bg-[var(--status-info-bg)] text-[var(--status-info-text)] border border-[var(--status-info-text)] px-3 py-1.5 rounded-lg">
                          <span className="font-bold">{c.name}</span>
                          {c.coordinators && c.coordinators.length > 0 && (
                            <span className="text-xs font-medium opacity-80 mt-0.5">{c.coordinators.map((coord: any) => coord.email).join(', ')}</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--text-secondary)] font-medium">None specified</span>
                    )}
                  </div>
                </div>
              )}
              {event.is_sponsored && (
                <div className="flex flex-col gap-1.5 p-3.5 bg-[var(--page-bg)] rounded-xl relative overflow-hidden group">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[rgb(var(--color-primary))]">Sponsors</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {event.sponsors && event.sponsors.length > 0 ? (
                      event.sponsors.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-2 font-medium text-sm w-full bg-white px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                          <span className="flex-1 truncate">{s.name}</span>
                          {s.logo_path && (
                            <a href={s.logo_path} target="_blank" rel="noopener noreferrer" className="text-[var(--status-info-text)] hover:text-[var(--status-info-text)] flex items-center gap-1 bg-[var(--status-info-bg)] px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-[var(--status-info-bg)] transition-colors shrink-0">
                              <Download className="w-3.5 h-3.5" /> Doc
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--text-secondary)] font-medium">None specified</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section H: Documents & Links */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-[rgb(var(--color-primary))]" /> H. Documents & Links</h2>
          <div className="flex flex-col gap-3">
            {event.poster_url && (
              <a href={event.poster_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-110 transition-transform">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Event Poster</p>
                  <p className="text-xs text-[var(--text-muted)]">Click to view uploaded poster</p>
                </div>
              </a>
            )}

            {event.participant_doc_url && (
              <a href={event.participant_doc_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Participant Document</p>
                  <p className="text-xs text-[var(--text-muted)]">Downloadable rules/schedules</p>
                </div>
              </a>
            )}

            {(() => {
              const path = event.attendance_doc_path || reportData?.attendance_doc_path;
              if (!path) return null;
              return (
                <a 
                  href={`/api/admin/files/${path.replace(/^\/+/, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Attendance Document</p>
                    <p className="text-xs text-[var(--text-muted)]">Downloadable attendance sheet</p>
                  </div>
                </a>
              );
            })()}

            {/* Report Banner for Completed Event */}
            {event.status === 'completed' && (
              <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      {event.is_rnd_event ? 'R&D Report Required' : 'Post-Event Report Required'}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      This event is completed. Submit the {event.is_rnd_event ? 'R&D Report' : 'Post-Event Report'} to archive it.
                    </p>
                  </div>
                </div>
                <Link href={event.is_rnd_event ? `/club_coordinator/rnd-report?event=${event.id}` : `/club_coordinator/report?event=${event.id}`}>
                  <Button className="bg-amber-600 text-white hover:bg-amber-700 border-0 shadow-sm shrink-0">
                    {event.is_rnd_event ? 'Submit R&D Report' : 'Submit Report'}
                  </Button>
                </Link>
              </div>
            )}

            {/* Normal Report Download (Normal events only) */}
            {!event.is_rnd_event && (() => {
              const path = event.report_path || reportData?.generated_report_path;
              if (!path) return null;
              return (
                <a 
                  href={`/api/admin/files/${path.replace(/^\/+/, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Post-Event Report</p>
                    <p className="text-xs text-[var(--text-muted)]">Downloadable final event report</p>
                  </div>
                </a>
              );
            })()}

            {/* R&D Report Download (R&D events only) */}
            {event.is_rnd_event && (() => {
              const path = rndReportData?.generated_report_path;
              if (!path) return null;
              return (
                <a 
                  href={`/api/admin/files/${path.replace(/^\/+/, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">RnD Report</p>
                    <p className="text-xs text-[var(--text-muted)]">Downloadable RnD report</p>
                  </div>
                </a>
              );
            })()}

            {(event as any).other_docs?.map((doc: any) => (
              <a key={doc.id} href={doc.file_path || doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{doc.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">Supporting Document</p>
                </div>
              </a>
            ))}

            {event.links && event.links.length > 0 && event.links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-[var(--card-border)] rounded-2xl hover:border-[rgb(var(--color-primary))] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[var(--status-info-bg)] flex items-center justify-center text-[var(--status-info-text)] group-hover:scale-110 transition-transform">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{l.label || l.link_type}</p>
                  <p className="text-xs text-[var(--status-info-text)]">{l.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Section I: Registered Students */}
        {canViewRegistrations && (
          <div className="space-y-4">
            <h2 className="section-title flex items-center justify-between text-lg">
              <span className="flex items-center gap-2"><Users className="w-5 h-5 text-[rgb(var(--color-primary))]" /> I. Registered Students</span>
              <button
                onClick={handleExport}
                disabled={exporting || registrations.length === 0}
                className="btn-outline flex items-center gap-2 px-4 py-2 bg-white hover:bg-[var(--surface-subtle)] disabled:opacity-50 text-sm font-medium border border-[var(--border-subtle)] rounded-lg shadow-sm"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? "Exporting..." : "Download Excel"}
              </button>
            </h2>

            <div className="bg-white border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
              {loadingRegs ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-[rgb(var(--color-primary))] animate-spin" />
                </div>
              ) : registrations.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-muted)] font-medium">
                  No registrations yet.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto hidden-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-[var(--surface-subtle)] sticky top-0 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-10 text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)]">Name</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)] text-center">Type</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)]">Email</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)]">Phone Number</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)]">School / Org</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)] text-center">Year</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)] text-center">Branch / Qual</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)] text-center">Course</th>
                        <th className="px-6 py-4 border-b border-[var(--border-subtle)]">Registration Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrations.map((r, i) => {
                        const isVisitor = r.participation_type === 'Visitor';
                        return (
                          <tr key={r.id || i} className="hover:bg-[var(--surface-subtle)] transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{r.name}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isVisitor
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              }`}>
                                {isVisitor ? 'Visitor' : 'In-Campus'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{r.email}</td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{r.phone_number || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{r.department}</td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)] text-center"><span className="px-2.5 py-1 bg-[var(--surface-subtle)] text-[var(--text-primary)] rounded-md text-xs font-medium border border-[var(--border-subtle)]">{r.year}</span></td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)] text-center">{r.branch}</td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)] text-center">{r.course}</td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap text-tabular-nums">{r.registered_at ? formatDateTime(r.registered_at.replace("T", " ").replace("Z", "")) : 'N/A'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval Flow Bottom Anchor */}
        {isPendingAction && (
          <div className="mt-12 pt-8 border-t border-[var(--card-border)] bg-[var(--surface-subtle)] -mx-6 px-6 -mb-12 pb-12 rounded-b-3xl">
            <h2 className="section-title text-xl mb-6 text-center text-[var(--text-primary)]">Review Complete? Ready to decide?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="danger"
                size="lg"
                icon={<XCircle className="w-5 h-5" />}
                onClick={() => handleAction('reject')}
              >
                Reject Event
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<MessageSquare className="w-5 h-5" />}
                onClick={() => handleAction('suggest_changes')}
              >
                Suggest Changes
              </Button>
              <Button
                size="lg"
                icon={<CheckCircle2 className="w-5 h-5" />}
                onClick={() => handleAction('approve')}
                className="bg-[var(--status-success-text)] text-white hover:opacity-90"
              >
                Approve Event
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Approval Modal */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action === 'approve' ? '✅ Approve Event' : action === 'reject' ? '❌ Reject Event' : '💬 Suggest Changes'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
            <Button
              variant={action === 'approve' ? 'primary' : 'danger'}
              loading={submittingAction}
              onClick={handleApprovalSubmit}
            >
              Confirm {action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Suggestion'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--page-bg)] rounded-xl">
            <p className="font-semibold text-[var(--text-primary)]">{event?.title}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{formatDateTime(event.start_datetime)}</p>
          </div>

          {action === 'reject' && (
            <Alert type="warning">
              <AlertTriangle className="w-4 h-4" />
              <span>Rejection reason is <strong>mandatory</strong> and will be shared with the organizer.</span>
            </Alert>
          )}

          <Textarea
            label={action === 'approve' ? 'Remarks (optional)' : 'Reason for Rejection (required)'}
            placeholder={action === 'approve' ? 'Add any notes for the organizer…' : 'Explain why this event is being rejected…'}
            rows={4}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>
      </Modal>

    </div>
  );
}
