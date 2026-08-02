'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { eventService, registrationService, systemService } from '@/lib/services';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

export default function StudentEventRegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  useEffect(() => {
    const numId = Number(id);
    eventService.get(numId)
      .then(ev => {
        setEvent(ev);
        if (ev.is_registered) {
          toast.error("You are already registered for this event.");
          router.push(`/events/${numId}`);
        }
      })
      .catch(() => {
        toast.error("Event not found");
        router.push('/student/events');
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
    setRegistering(true);
    try {
      await registrationService.register(Number(id));
      toast.success('Registered successfully!');
      router.push(`/events/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[var(--input-focus-ring)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading participation document...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <p className="text-[var(--text-muted)]">Event details could not be loaded.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // If there's no PDF, maybe they shouldn't be here, but let's handle it gracefully.
  const hasDoc = !!event.participant_doc_url;

  const now = new Date();
  const regStart = event?.registration_start_datetime ? new Date(event.registration_start_datetime) : null;
  const regEnd = event?.registration_deadline ? new Date(event.registration_deadline) : null;
  const isBeforeRegStart = regStart ? now < regStart : false;
  const isAfterRegEnd = regEnd ? now > regEnd : false;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[var(--card-bg)] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[var(--card-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="px-2" title="Go Back">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-[var(--text-primary)] text-xl leading-tight">
              Event Registration
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {event.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegister} 
            loading={registering}
            disabled={registrationDisabled || isBeforeRegStart || isAfterRegEnd}
            className="flex items-center gap-2"
            title={registrationDisabled ? 'Event registration is currently disabled' : isBeforeRegStart ? 'Registration is not open yet' : isAfterRegEnd ? 'Registration deadline has passed' : ''}
          >
            <CheckCircle2 className="w-4 h-4" />
            {hasDoc ? 'Agree & Register' : 'Register Now'}
          </Button>
        </div>
      </div>

      {/* PDF Viewer Area / Confirmation Area */}
      <div className="flex-1 w-full bg-[var(--surface-subtle)] relative overflow-hidden">
        {hasDoc && !pdfError ? (
          <iframe 
            src={`${event.participant_doc_url}#toolbar=0`} 
            className="w-full h-full border-0"
            title="Participation Document"
            onError={() => setPdfError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-[var(--card-bg)] rounded-full flex items-center justify-center mb-4">
              {pdfError ? <AlertCircle className="w-8 h-8 text-[var(--text-danger)]" /> : <FileText className="w-8 h-8 text-[rgb(var(--color-primary))]" />}
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {pdfError ? 'Failed to load document' : 'Event Registration'}
            </h3>
            <p className="text-[var(--text-muted)] max-w-md">
              {pdfError 
                ? 'There was an error loading the PDF viewer. You can try downloading the file directly.' 
                : 'Click "Register Now" above to confirm your spot for this event.'}
            </p>
            {hasDoc && pdfError && (
              <a 
                href={event.participant_doc_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary mt-6"
              >
                Download Document
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
