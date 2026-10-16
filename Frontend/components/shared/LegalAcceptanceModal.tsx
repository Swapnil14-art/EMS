'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { legalService, authService } from '@/lib/services';
import { Shield, CheckCircle2, LogOut, ExternalLink, Loader2, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function LegalAcceptanceModal() {
  const { user, isAuthenticated, isHydrated, clearAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentVersions, setCurrentVersions] = useState<Record<string, string>>({
    terms_and_conditions: '1.0',
    privacy_policy: '1.0',
  });

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user?.id) {
      setIsOpen(false);
      return;
    }

    const userId = user.id.toString();
    const snoozeKey = `ems-legal-snoozed-${userId}`;
    const acceptCacheKey = `ems-legal-accepted-${userId}`;

    // If snoozed in this browser session, do not interrupt the user
    try {
      if (sessionStorage.getItem(snoozeKey) === 'true') {
        return;
      }
    } catch {}

    let isMounted = true;
    setLoading(true);

    legalService
      .getStatus()
      .then((status) => {
        if (!isMounted) return;
        if (status?.current_versions) {
          setCurrentVersions(status.current_versions);
        }

        if (status?.requires_acceptance) {
          // Verify against local cache to prevent duplicate prompts if already accepted
          try {
            const cached = localStorage.getItem(acceptCacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const allMatch = Object.entries(status.current_versions).every(
                ([doc, ver]) => parsed[doc] === ver
              );
              if (allMatch) {
                return;
              }
            }
          } catch {}

          setIsOpen(true);
        } else {
          // Sync positive status into local cache
          try {
            if (status?.current_versions) {
              localStorage.setItem(acceptCacheKey, JSON.stringify(status.current_versions));
            }
          } catch {}
          setIsOpen(false);
        }
      })
      .catch(() => {
        // Silently catch network or authorization errors; avoid blocking UI
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isHydrated, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAcknowledged) {
      setErrorMsg('Please check both boxes to acknowledge the updated policies.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const termsVer = currentVersions.terms_and_conditions || '1.0';
    const privacyVer = currentVersions.privacy_policy || '1.0';

    try {
      await legalService.accept([
        {
          document_type: 'terms_and_conditions',
          document_version: termsVer,
          status: 'accepted',
        },
        {
          document_type: 'privacy_policy',
          document_version: privacyVer,
          status: 'acknowledged',
        },
      ]);

      // Cache affirmative acceptance
      if (user?.id) {
        try {
          localStorage.setItem(
            `ems-legal-accepted-${user.id}`,
            JSON.stringify({
              terms_and_conditions: termsVer,
              privacy_policy: privacyVer,
            })
          );
        } catch {}
      }

      toast.success('Agreements confirmed successfully.');
      setIsOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to record acceptance. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = () => {
    if (user?.id) {
      try {
        sessionStorage.setItem(`ems-legal-snoozed-${user.id}`, 'true');
      } catch {}
    }
    setIsOpen(false);
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
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="legal-banner-title"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-45 animate-slide-up"
    >
      <div className="bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl p-5 shadow-2xl border border-[var(--card-border)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="legal-banner-title" className="font-semibold text-sm text-[var(--text-primary)]">
                Terms &amp; Privacy Policy Notice
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Version {currentVersions.terms_and_conditions || '1.0'} • SVKM&apos;s NMIMS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSnooze}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--surface-bg)] transition-colors"
            aria-label="Remind me later"
            title="Remind me later in another session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
          EMS has updated its institutional Terms of Use and Privacy Policy in accordance with the <em>Digital Personal Data Protection Act</em>. Please review and acknowledge to continue.
        </p>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-text)] text-[var(--status-danger-text)] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Acceptance Checkboxes */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--card-border)] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] transition"
              />
              <span className="flex-1 text-[var(--text-secondary)]">
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[rgb(var(--color-primary))] hover:underline inline-flex items-center gap-0.5"
                >
                  Terms of Use <ExternalLink className="w-3 h-3" />
                </Link>
                .
              </span>
            </label>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--card-border)] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] transition"
              />
              <span className="flex-1 text-[var(--text-secondary)]">
                I acknowledge the{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[rgb(var(--color-primary))] hover:underline inline-flex items-center gap-0.5"
                >
                  Privacy Policy <ExternalLink className="w-3 h-3" />
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSnooze}
              className="px-3 py-1.5 rounded-xl border border-[var(--card-border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3" /> Remind Later
            </button>

            <button
              type="submit"
              disabled={!termsAccepted || !privacyAcknowledged || submitting}
              className="px-4 py-1.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-xs font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept &amp; Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
