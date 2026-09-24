'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'ems-cookie-consent';
const CURRENT_VERSION = '1.0';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the current version
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.acknowledged && parsed.version === CURRENT_VERSION) {
          return;
        }
      }
    } catch {
      // In case of parsing error, proceed to show banner
    }
    // Delay slightly for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          acknowledged: true,
          version: CURRENT_VERSION,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and storage notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up"
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
                className="px-4 py-2 rounded-xl bg-[rgb(var(--color-primary))] text-white text-xs font-semibold hover:bg-[rgb(var(--color-primary-hover))] active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Acknowledge &amp; Dismiss
              </button>
              <Link
                href="/cookies"
                className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="/privacy"
                className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAcknowledge}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--surface-bg)] transition-colors"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
