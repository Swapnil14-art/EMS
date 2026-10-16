'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { openCookiePreferences } from '@/components/shared/CookieConsentBanner';
import { 
  Cookie, ShieldCheck, Settings2, HardDrive, 
  ChevronRight, Info, CheckCircle2 
} from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
              <Cookie className="w-3.5 h-3.5" /> Storage Disclosure
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
              Cookie &amp; Browser Storage Policy
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-[var(--text-muted)]">
              <span><strong>Version:</strong> 1.0</span>
              <span>•</span>
              <span><strong>Effective Date:</strong> September 25, 2026</span>
              <span>•</span>
              <span><strong>Application:</strong> Event Management System (EMS)</span>
              <span>•</span>
              <span><strong>Institution:</strong> SVKM&apos;s NMIMS, Shirpur Campus</span>
            </div>
          </div>

          {/* Zero Advertising Banner */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--status-success-bg)] border border-[var(--status-success-text)] text-[var(--status-success-text)] shadow-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong>Zero Advertising or Tracking:</strong> EMS uses <em>strictly essential</em> cookies and browser local storage mechanisms required for authentication, role routing, and security. We do not use third-party marketing cookies, behavioral trackers, or advertising beacons.
            </div>
          </div>

          {/* Preferences Quick Action */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Review &amp; Update Your Preferences
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Check your current consent status or update storage preferences anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="px-4 py-2 rounded-xl bg-[var(--surface-bg)] border border-[var(--card-border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Settings2 className="w-4 h-4" /> Manage Cookie Preferences
            </button>
          </div>

          {/* Table of Contents */}
          <nav aria-label="Table of Contents" className="mb-10 p-5 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a href="#technologies" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 1. Technologies Used</a>
              <a href="#inventory" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 2. Complete Storage Inventory</a>
              <a href="#necessity" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 3. Why These Items Are Essential</a>
              <a href="#management" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 4. Browser Control &amp; Clearing</a>
            </div>
          </nav>

          {/* Policy Content */}
          <div className="space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">

            {/* Section 1 */}
            <section id="technologies" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                1. Technologies Used
              </h2>
              <p className="mb-3 text-xs sm:text-sm">
                EMS utilizes standard client-side browser mechanisms to provide a seamless and secure experience:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <Cookie className="w-4 h-4 text-[rgb(var(--color-primary))]" /> HTTP Cookies
                  </h3>
                  <p className="text-xs">
                    First-party text tokens transmitted with secure <code>SameSite=Lax</code> attributes to authorize server-side navigation.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Browser LocalStorage
                  </h3>
                  <p className="text-xs">
                    Client-side key-value storage maintaining local authentication state so user sessions persist across page refreshes.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="inventory" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                2. Complete Storage Inventory
              </h2>
              <p className="mb-3 text-xs sm:text-sm">
                The technical audit confirms the following complete inventory of client storage keys in EMS:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-bg)] font-semibold text-[var(--text-primary)]">
                    <tr>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Storage Key</th>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Mechanism</th>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Duration</th>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Category</th>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-[rgb(var(--color-primary))]">ems-role</td>
                      <td className="p-2.5">Browser Cookie</td>
                      <td className="p-2.5">7 Days</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Essential</span></td>
                      <td className="p-2.5">Stores the user&apos;s active role string for server-side Next.js route protection.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-[rgb(var(--color-primary))]">ems-auth</td>
                      <td className="p-2.5">HTML5 localStorage</td>
                      <td className="p-2.5">Until Logout</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Essential</span></td>
                      <td className="p-2.5">Maintains client authentication tokens and user state across browser navigation and reloads.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-[rgb(var(--color-primary))]">ems-cookie-consent</td>
                      <td className="p-2.5">localStorage &amp; Cookie</td>
                      <td className="p-2.5">1 Year</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Essential</span></td>
                      <td className="p-2.5">Records user storage notice acknowledgement to prevent repetitive prompts.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section id="necessity" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                3. Why These Technologies Are Essential
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li>Without <code>ems-role</code>, server route guards cannot direct you to role dashboards or enforce permission boundaries.</li>
                <li>Without <code>ems-auth</code>, sessions would be dropped whenever you refresh or open a new browser tab.</li>
                <li>Without <code>ems-cookie-consent</code>, the storage disclosure notice would re-appear on every visit.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="management" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                4. Browser Control &amp; Clearing
              </h2>
              <p className="mb-3 text-xs sm:text-sm">
                You can manage, inspect, or delete cookies and localStorage through your browser&apos;s privacy settings at any time:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <strong>Chrome &amp; Edge:</strong> Settings → Privacy &amp; security → Cookies and other site data.
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data.
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <strong>Safari:</strong> Settings → Privacy → Manage Website Data.
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <strong>Quick Clear:</strong> Logging out from EMS automatically clears all authentication cookies.
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[rgb(var(--color-primary))]" />
                <span>Note: Manually deleting cookies or clearing browser storage will log you out of your EMS account.</span>
              </div>
            </section>

          </div>

          {/* Navigation Links */}
          <div className="mt-10 pt-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <Link href="/" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">
              ← Return to EMS Home
            </Link>
            <div className="flex gap-4 text-[var(--text-muted)]">
              <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms of Use</Link>
            </div>
          </div>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
