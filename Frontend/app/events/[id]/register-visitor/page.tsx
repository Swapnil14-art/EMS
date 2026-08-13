'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Building, User, Mail, Phone, GraduationCap, School, CheckCircle2, AlertCircle } from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { Button, Input } from '@/components/ui';
import { eventService, registrationService } from '@/lib/services';
import { formatDateTime } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

export default function VisitorRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    qualification: '',
    school_college: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const numId = Number(id);
    eventService.get(numId)
      .then(ev => {
        setEvent(ev);
      })
      .catch(err => {
        console.error('Failed to load event details:', err);
        setEvent(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 8) {
      errs.phone = 'Please enter a valid phone number';
    }
    if (!formData.qualification.trim()) errs.qualification = 'Qualification is required';
    if (!formData.school_college.trim()) errs.school_college = 'School / College name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await registrationService.registerVisitor(Number(id), {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        qualification: formData.qualification.trim(),
        school_college: formData.school_college.trim(),
      });
      setSuccess(true);
      toast.success('Registration successful!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card-bg)]">
        <PublicNavbar />
        <div className="pt-24 max-w-2xl mx-auto px-6 py-12">
          <div className="skeleton h-8 w-32 rounded mb-6" />
          <div className="skeleton h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--card-bg)]">
        <PublicNavbar />
        <div className="pt-32 text-center">
          <p className="text-[var(--text-muted)]">Event not found.</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const regStart = event.registration_start_datetime ? new Date(event.registration_start_datetime) : null;
  const regEnd = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isBeforeRegStart = regStart ? now < regStart : false;
  const isAfterRegEnd = regEnd ? now > regEnd : false;

  const isEligible = !!event.outside_campus_registration &&
                     ['approved', 'ongoing'].includes(event.status) &&
                     !isBeforeRegStart &&
                     !isAfterRegEnd;

  return (
    <div className="min-h-screen bg-[var(--card-bg)] flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/events/${id}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Event Details
          </Link>

          {/* Event Header Banner */}
          <div className="card p-6 mb-6 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-blue-50/30 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20 border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 mb-2">
              Non-Campus Visitor Registration
            </span>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" />
                {formatDateTime(event.start_datetime)}
              </span>
              {(event.venue?.name || event.venue_custom) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" />
                  {event.venue?.name || event.venue_custom}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" />
                {event.school_department}
              </span>
            </div>
          </div>

          {!isEligible ? (
            <div className="card p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Registration Unavailable</h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                {!event.outside_campus_registration
                  ? 'Outside campus registration is not enabled for this event.'
                  : !['approved', 'ongoing'].includes(event.status)
                  ? 'This event has not been approved for public registration.'
                  : isBeforeRegStart
                  ? 'Registration for this event has not opened yet.'
                  : 'Registration deadline for this event has passed.'}
              </p>
              <Link href={`/events/${id}`} className="btn-primary inline-flex mt-2">
                Return to Event Page
              </Link>
            </div>
          ) : success ? (
            <div className="card p-8 text-center space-y-4 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Registration Successful!</h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                Thank you for registering as a non-campus participant for <strong>{event.title}</strong>. We look forward to seeing you at the event.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link href={`/events/${id}`} className="btn-primary inline-flex">
                  View Event Details
                </Link>
                <Link href="/" className="btn-secondary inline-flex">
                  Browse More Events
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="section-title text-xl">Participant Registration Form</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Please fill out your details below to complete your registration as a visitor / non-campus participant.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" /> Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    error={errors.full_name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" /> Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" /> Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" /> Qualification <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. B.Tech / High School / Professional"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    error={errors.qualification}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-[rgb(var(--color-primary))]" /> School / College / Organization <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. ABC Institute of Technology"
                    value={formData.school_college}
                    onChange={e => setFormData({ ...formData, school_college: e.target.value })}
                    error={errors.school_college}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                    className="w-full justify-center py-3 text-base font-semibold"
                  >
                    Complete Visitor Registration
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
