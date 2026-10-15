'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { legalService, authService } from '@/lib/services';
import { Shield, FileText, CheckCircle2, LogOut, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function LegalAcceptanceModal() {
  const { isAuthenticated, isHydrated, clearAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      setIsOpen(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    legalService
      .getStatus()
      .then((status) => {
        if (isMounted && status?.requires_acceptance) {
          setIsOpen(true);
        }
      })
      .catch(() => {
        // Silently catch network or authorization errors
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isHydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAcknowledged) {
      setErrorMsg('You must check both boxes to acknowledge the policies and proceed.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await legalService.accept([
        {
          document_type: 'terms_and_conditions',
          document_version: '1.0',
          status: 'accepted',
        },
        {
          document_type: 'privacy_policy',
          document_version: '1.0',
          status: 'acknowledged',
        },
      ]);
      toast.success('Legal agreements recorded successfully.');
      setIsOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to record acceptance. Please check your network and try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-lg bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-in text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 id="legal-modal-title" className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
              Terms &amp; Privacy Policy Update
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Version 1.0 • SVKM&apos;s NMIMS, Shirpur Campus
            </p>
          </div>
        </div>

        {/* Informative Body */}
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          To ensure continued transparency, security, and statutory compliance with the <em>Digital Personal Data Protection Act, 2023</em>, EMS has established updated Terms of Use and a comprehensive Privacy Policy. Please review and acknowledge these documents to continue using your account.
        </p>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-text)] text-[var(--status-danger-text)] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Acceptance Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Checkbox 1: Terms of Use */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] hover:border-[var(--card-border)] transition-colors">
            <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--card-border)] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] transition"
                required
              />
              <span className="flex-1 text-[var(--text-secondary)]">
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[rgb(var(--color-primary))] hover:underline inline-flex items-center gap-0.5"
                >
                  EMS Terms of Use (v1.0) <ExternalLink className="w-3 h-3" />
                </Link>
                . I understand the rules governing platform usage, event participation, and account conduct.
              </span>
            </label>
          </div>

          {/* Checkbox 2: Privacy Policy */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] hover:border-[var(--card-border)] transition-colors">
            <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--card-border)] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] transition"
                required
              />
              <span className="flex-1 text-[var(--text-secondary)]">
                I have read and acknowledge the{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[rgb(var(--color-primary))] hover:underline inline-flex items-center gap-0.5"
                >
                  EMS Privacy Policy (v1.0) <ExternalLink className="w-3 h-3" />
                </Link>
                . I understand how my institutional personal data is processed, role-based access safeguards, and my statutory privacy rights.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-[var(--surface-bg)] transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out Instead
            </button>

            <button
              type="submit"
              disabled={!termsAccepted || !privacyAcknowledged || submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-xs sm:text-sm font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> I Agree &amp; Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
