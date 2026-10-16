'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Settings2, CheckCircle2, ShieldCheck, HardDrive } from 'lucide-react';

const STORAGE_KEY = 'ems-cookie-consent';
const SESSION_DISMISS_KEY = 'ems-cookie-banner-dismissed';
const CURRENT_VERSION = '1.0';

export function getStoredConsent(): { acknowledged?: boolean; version?: string; timestamp?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.acknowledged) return parsed;
    }
  } catch {}
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + STORAGE_KEY + '=([^;]*)'));
    if (match && match[1]) {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (parsed?.acknowledged) return parsed;
    }
  } catch {}
  return null;
}

export function saveConsent(version = CURRENT_VERSION) {
  if (typeof window === 'undefined') return;
  const payload = {
    acknowledged: true,
    version,
    categories: { essential: true },
    timestamp: new Date().toISOString(),
  };
  const str = JSON.stringify(payload);
  try {
    localStorage.setItem(STORAGE_KEY, str);
  } catch {}
  try {
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(str)}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 365}`;
  } catch {}
}

export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-ems-cookie-preferences'));
  }
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [existingConsent, setExistingConsent] = useState<{ acknowledged?: boolean; version?: string; timestamp?: string } | null>(null);

  useEffect(() => {
    // Check if consent has already been granted for the current version
    const consent = getStoredConsent();
    if (consent && consent.acknowledged && consent.version === CURRENT_VERSION) {
      setExistingConsent(consent);
      return;
    }

    // Check if user dismissed the banner in the current session
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        return;
      }
    } catch {}

    const timer = setTimeout(() => setIsVisible(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setExistingConsent(getStoredConsent());
      setIsPreferencesOpen(true);
    };
    window.addEventListener('open-ems-cookie-preferences', handleOpen);
    return () => window.removeEventListener('open-ems-cookie-preferences', handleOpen);
  }, []);

  const handleAcknowledge = () => {
    saveConsent(CURRENT_VERSION);
    setExistingConsent({ acknowledged: true, version: CURRENT_VERSION, timestamp: new Date().toISOString() });
    setIsVisible(false);
  };

  const handleDismissSession = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
    } catch {}
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    saveConsent(CURRENT_VERSION);
    setExistingConsent({ acknowledged: true, version: CURRENT_VERSION, timestamp: new Date().toISOString() });
    setIsPreferencesOpen(false);
    setIsVisible(false);
  };

  return (
    <>
      {/* Non-blocking Banner */}
      {isVisible && !isPreferencesOpen && (
        <aside
          role="region"
          aria-label="Cookie and storage notice"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slide-up"
        >
          <div className="bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl p-4 sm:p-5 shadow-2xl border border-[var(--card-border)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                  Essential Storage Notice
                </h4>
                <p className="text-[var(--text-secondary)] text-xs mb-3">
                  EMS uses strictly essential cookies and browser storage (such as <code className="text-[11px] font-mono bg-[var(--surface-bg)] px-1 py-0.5 rounded">ems-role</code> and <code className="text-[11px] font-mono bg-[var(--surface-bg)] px-1 py-0.5 rounded">ems-auth</code>) for authentication, security, and role-based access. We do not use advertising or tracking cookies.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    className="px-3.5 py-1.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-xs font-semibold hover:bg-[rgb(var(--color-primary-hover))] active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreferencesOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors inline-flex items-center gap-1"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Preferences
                  </button>
                  <Link
                    href="/cookies"
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
                  >
                    Policy
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissSession}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--surface-bg)] transition-colors"
                aria-label="Dismiss cookie notice"
                title="Dismiss for this session"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Dialog */}
      {isPreferencesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-pref-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 sm:p-6 text-[var(--text-primary)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))]">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cookie-pref-title" className="font-semibold text-base text-[var(--text-primary)]">
                    Cookie &amp; Storage Preferences
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Event Management System • SVKM&apos;s NMIMS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
                aria-label="Close preferences"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Manage client-side storage settings for EMS. Because EMS is an internal academic platform, we only store what is strictly necessary to keep your session secure and authorized.
            </p>

            <div className="space-y-3 mb-5">
              {/* Category 1: Strictly Necessary */}
              <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--status-success-text)]" /> Essential Storage (Always Active)
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--status-info-text)] bg-[var(--status-info-bg)] px-2 py-0.5 rounded-full">
                    Required
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                  Required for user authentication, role-based navigation, and security defenses. These cannot be disabled while using the platform.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="font-mono text-[10px] bg-[var(--card-bg)] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">
                    ems-role (Cookie)
                  </span>
                  <span className="font-mono text-[10px] bg-[var(--card-bg)] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">
                    ems-auth (localStorage)
                  </span>
                  <span className="font-mono text-[10px] bg-[var(--card-bg)] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">
                    ems-cookie-consent
                  </span>
                </div>
              </div>

              {/* Category 2: Optional / Tracking */}
              <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] opacity-85">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-[var(--text-muted)]" /> Analytics &amp; Advertising
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-full">
                    Not Used
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  EMS does not use any advertising trackers, social widgets, or third-party behavioral analytics SDKs.
                </p>
              </div>
            </div>

            {existingConsent?.timestamp && (
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                Saved preferences active since {new Date(existingConsent.timestamp).toLocaleDateString()}.
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <Link
                href="/cookies"
                onClick={() => setIsPreferencesOpen(false)}
                className="text-xs text-[rgb(var(--color-primary))] hover:underline"
              >
                Read Cookie Policy →
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-1.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-xs font-semibold hover:bg-[rgb(var(--color-primary-hover))] shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
