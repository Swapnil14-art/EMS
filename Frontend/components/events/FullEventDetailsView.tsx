'use client';
import { useState, useEffect } from 'react';
import { 
  Info, Calendar, MapPin, Monitor, UtensilsCrossed, 
  Package, FileText, CheckCircle2, Ticket, Users, 
  ArrowLeft, Download, ExternalLink, Link as LinkIcon, Loader2
} from 'lucide-react';
import type { Event } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge, EventTypeBadge } from '@/components/shared/StatusBadge';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { eventService } from '@/lib/services';

export default function FullEventDetailsView({ event }: { event: Event }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const canViewRegistrations = user?.role === 'super_admin' || user?.id === event.created_by || (event as any).collaborating_clubs?.some((c: any) => c.club_id === user?.club_id);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (canViewRegistrations) {
      setLoadingRegs(true);
      eventService.getRegistrations(event.id)
        .then(setRegistrations)
        .catch(console.error)
        .finally(() => setLoadingRegs(false));
    }
  }, [event.id, canViewRegistrations]);

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
        <p className="font-medium text-[var(--text-primary)] text-sm">{value === true ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : value}</p>
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
              {event.is_club_event && <span className="badge bg-purple-100 text-purple-700">Club Event</span>}
              {event.is_collaborative && <span className="badge bg-indigo-100 text-indigo-700">Collaborative</span>}
              {event.is_sponsored && <span className="badge bg-amber-100 text-amber-700">Sponsored</span>}
            </div>
            <h1 className="font-display font-black text-[var(--text-primary)] text-3xl md:text-5xl leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Section A: Basic Info */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><Info className="w-5 h-5 text-[rgb(var(--color-primary))]" /> A. Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Event Type" value={event.event_type} />
            <Field label="Organizing Department" value={event.school_department} />
            <Field label="Target Audience" value={event.target_audience} />
            <Field label="Event Incharge" value={event.event_incharge_name} />
            <Field label="Contact" value={event.event_incharge_contact} />
            {event.is_club_event && event.club?.name && <Field label="Club" value={event.club.name} />}
            <Field label="Est. Budget" value={event.budget ? `₹ ${event.budget.toLocaleString()}` : undefined} />
          </div>
        </div>

        {/* Section B: Schedule */}
        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-2 text-lg"><Calendar className="w-5 h-5 text-[rgb(var(--color-primary))]" /> B. Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Start Date & Time" value={formatDateTime(event.start_datetime)} />
            <Field label="End Date & Time" value={formatDateTime(event.end_datetime)} />
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
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm text-orange-900 leading-relaxed">
              {event.comments}
            </div>
          </div>
        )}

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
                         <span key={c.id} className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">{c.name}</span>
                       ))
                     ) : (
                       <span className="text-sm text-gray-500 font-medium">None specified</span>
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
                         <div key={s.id} className="flex items-center gap-2 font-medium text-sm w-full bg-white px-3 py-2 rounded-lg border border-gray-100">
                           <span className="flex-1 truncate">{s.name}</span>
                           {s.logo_path && (
                             <a href={s.logo_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors shrink-0">
                               <Download className="w-3.5 h-3.5" /> Doc
                             </a>
                           )}
                         </div>
                       ))
                     ) : (
                       <span className="text-sm text-gray-500 font-medium">None specified</span>
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
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{l.label || l.link_type}</p>
                  <p className="text-xs text-indigo-600">{l.url}</p>
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
                className="btn-outline flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium border border-gray-200 rounded-lg shadow-sm"
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
                    <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-10 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 border-b border-gray-100">Name</th>
                        <th className="px-6 py-4 border-b border-gray-100">Email</th>
                        <th className="px-6 py-4 border-b border-gray-100">Department</th>
                        <th className="px-6 py-4 border-b border-gray-100 text-center">Year</th>
                        <th className="px-6 py-4 border-b border-gray-100 text-center">Branch</th>
                        <th className="px-6 py-4 border-b border-gray-100 text-center">Course</th>
                        <th className="px-6 py-4 border-b border-gray-100">Registration Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrations.map((r, i) => (
                        <tr key={r.id || i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{r.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{r.department}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center"><span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">{r.year}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{r.branch}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{r.course}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-tabular-nums">{r.registered_at ? formatDateTime(r.registered_at.replace("T", " ").replace("Z", "")) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
