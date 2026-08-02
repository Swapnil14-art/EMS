'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Using plain <img> for user-uploaded posters (served via Nginx static files)
import Link from 'next/link';
import {
  Calendar, MapPin, Users, Download, ArrowLeft, ExternalLink,
  Clock, User, Phone, Building, CheckCircle2, FileText
} from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { EventTypeBadge, StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui';
import { eventService, registrationService, systemService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { Event, EventLink } from '@/types';
import toast from 'react-hot-toast';
import FullEventDetailsView from '@/components/events/FullEventDetailsView';
import { AppFooter } from '@/components/layout/AppFooter';

export default function PublicEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [links, setLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  useEffect(() => {
    const numId = Number(id);
    Promise.all([
      eventService.list({ size: 1 }).then(() => []).catch(() => []),
      eventService.get(numId),
    ]).then(([_, ev]) => {
      setEvent(ev);
      setRegistered(ev.is_registered || false);
    }).catch((err) => {
      console.error("Failed to fetch event details:", err);
      setEvent(null);
    })
    .finally(() => setLoading(false));

    // Check if event registration is disabled
    systemService.getPublicConfig()
      .then(config => {
        if (config?.disable_student_registration) {
          setRegistrationDisabled(true);
        }
      })
      .catch(() => {});
  }, [id, router]);

  const handleRegister = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setRegistering(true);
    try {
      if (registered) {
        await registrationService.unregister(Number(id));
        setRegistered(false);
        toast.success('Registration cancelled');
      } else {
        await registrationService.register(Number(id));
        setRegistered(true);
        toast.success('Registered successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally { setRegistering(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--card-bg)]">
      <PublicNavbar />
      <div className="pt-16 max-w-5xl mx-auto px-6 py-12">
        <div className="skeleton h-8 w-24 rounded mb-6" />
        <div className="skeleton h-12 w-3/4 rounded mb-4" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[var(--card-bg)]">
      <PublicNavbar />
      <div className="pt-32 text-center">
        <p className="text-[var(--text-muted)]">Event not found.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">← Back to Home</Link>
      </div>
    </div>
  );

  const canRegister = ['approved', 'ongoing'].includes(event.status) && user?.role === 'student' && !registrationDisabled;
  const isOngoing = event.status === 'ongoing';
  const isUpcoming = event.status === 'approved';

  // Role Gate
  const isInternalUser = ['club_coordinator', 'associate_dean', 'director', 'super_admin'].includes(user?.role || '');

  if (isInternalUser) {
    return <FullEventDetailsView event={event} />;
  }

  return (
    <div className="min-h-screen bg-[var(--card-bg)]">
      <PublicNavbar />
      <div className="pt-16">
        {/* Hero image / gradient */}
        <div className="relative h-72 overflow-hidden">
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <EventTypeBadge type={event.event_type} className="bg-white/20 text-[var(--btn-primary-text)] border border-white/20 backdrop-blur-sm" />
              {isOngoing && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--status-success-bg)] text-[var(--btn-primary-text)] rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE NOW
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="font-display font-bold text-[var(--text-primary)] text-3xl md:text-4xl leading-tight mb-3">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={event.status} />
                  <EventTypeBadge type={event.event_type} />
                  {event.is_collaborative && <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Collaborative</span>}
                  {event.is_sponsored && <span className="badge bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]">Sponsored</span>}
                </div>
              </div>

              {/* Event details grid */}
              <div className="card p-6">
                <h2 className="section-title mb-4">Event Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Start', value: formatDateTime(event.start_datetime), icon: <Calendar className="w-4 h-4 text-[rgb(var(--color-primary))]" /> },
                    { label: 'End', value: formatDateTime(event.end_datetime), icon: <Clock className="w-4 h-4 text-[rgb(var(--color-primary))]" /> },
                    ...(event.venue?.name || event.venue_custom ? [{ label: 'Venue', value: event.venue?.name || event.venue_custom!, icon: <MapPin className="w-4 h-4 text-[rgb(var(--color-primary))]" /> }] : []),
                    { label: 'Organising School', value: event.school_department, icon: <Building className="w-4 h-4 text-[rgb(var(--color-primary))]" /> },
                    { label: 'Event Incharge', value: event.event_incharge_name, icon: <User className="w-4 h-4 text-[rgb(var(--color-primary))]" /> },
                    { label: 'Contact', value: event.event_incharge_contact, icon: <Phone className="w-4 h-4 text-[rgb(var(--color-primary))]" /> },
                    ...(event.club?.name ? [{ label: 'Club', value: event.club.name, icon: <Building className="w-4 h-4 text-[rgb(var(--color-primary))]" /> }] : []),
                    ...(event.registration_count !== undefined ? [{ label: 'Registered', value: `${event.registration_count} students`, icon: <Users className="w-4 h-4 text-[rgb(var(--color-primary))]" /> }] : []),
                  ].map(row => (
                    <div key={row.label} className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{row.icon}</div>
                      <div>
                        <p className="text-[var(--text-muted)] text-xs mb-0.5">{row.label}</p>
                        <p className="font-medium text-[var(--text-primary)]">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Links */}
              {event.links && event.links.length > 0 && (
                <div className="card p-6">
                  <h2 className="section-title mb-3">External Links</h2>
                  <div className="space-y-2">
                    {event.links.map(l => (
                      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] text-sm font-medium">
                        <ExternalLink className="w-4 h-4" /> {l.label || l.link_type}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Participant doc */}
              {event.participant_doc_url && (
                <div className="card p-6">
                  <h2 className="section-title mb-3">Participant Document</h2>
                  <a href={event.participant_doc_url} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 inline-flex">
                    <Download className="w-4 h-4" /> Download Participant Document
                  </a>
                </div>
              )}

              {/* Post-Event Report */}
              {event.report_path && (
                <div className="card p-6">
                  <h2 className="section-title mb-3">Post-Event Report</h2>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[var(--status-success-text)] to-[var(--status-success-text)] border border-[var(--status-success-text)] rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[var(--status-success-bg)] flex items-center justify-center text-[var(--status-success-text)] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] text-sm">Report Available</p>
                      <p className="text-xs text-[var(--text-muted)]">Download the post-event report</p>
                    </div>
                    <a
                      href={event.report_url || event.report_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--status-success-bg)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--status-success-bg)] active:scale-[0.98] transition-all shadow-md shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Registration */}
            <div className="space-y-4">
              <div className="card p-6 sticky top-24">
                {canRegister ? (
                  <>
                    <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-2">
                      {registered ? 'You are registered!' : 'Register for this event'}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                      {registered ? 'You have successfully registered. Check your email for details.' : 'Join this event — it\'s free!'}
                    </p>
                    {registered && <CheckCircle2 className="w-10 h-10 text-[var(--status-success-text)] mb-4" />}
                    {registered ? (
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full justify-center opacity-80 cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2 text-[var(--status-success-text)]" />
                        Already Registered
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.push(`/student/events/${id}/register`)}
                        variant="primary"
                        className="w-full justify-center"
                      >
                        Register Now
                      </Button>
                    )}
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-2">Interested?</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">Log in or create a student account to register.</p>
                    <div className="space-y-2">
                      <Link href="/login" className="btn-primary w-full justify-center block text-center">Log In</Link>
                      <Link href="/signup" className="btn-secondary w-full justify-center block text-center">Create Account</Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <StatusBadge status={event.status} className="text-sm px-3 py-1.5" />
                    <p className="text-sm text-[var(--text-muted)] mt-3">
                      {event.status === 'completed' ? 'This event has ended.' :
                       event.status === 'cancelled' ? 'This event has been cancelled.' :
                       'Registration details will appear here once the event is approved.'}
                    </p>
                  </div>
                )}

                {/* Registration disabled message */}
                {registrationDisabled && user?.role === 'student' && ['approved', 'ongoing'].includes(event.status) && (
                  <div className="text-center">
                    <p className="text-sm text-[var(--status-warning-text)] font-medium">
                      Event registration is currently disabled.
                    </p>
                  </div>
                )}
              </div>

              {/* Sponsors */}
              {event.sponsors && event.sponsors?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-3">Our Sponsors</h3>
                  <div className="space-y-2">
                    {event.sponsors?.map(s => (
                      <div key={s.id} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="w-1.5 h-1.5 bg-[var(--btn-primary-bg)] rounded-full" />
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-12'><AppFooter /></div>
    </div>
  );
}
