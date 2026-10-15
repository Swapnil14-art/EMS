'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { 
  Cookie, CheckCircle2, ShieldCheck, Database, 
  Trash2, Info, ChevronRight, HardDrive 
} from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="mb-10 text-center sm:text-left">
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

          {/* Core Assurance Banner */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--status-success-bg)] border border-[var(--status-success-text)] text-[var(--status-success-text)] shadow-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong>Zero Advertising or Tracking:</strong> EMS uses <em>strictly essential</em> cookies and browser local storage mechanisms required for authentication, role routing, and security. We do not use third-party marketing cookies, behavioral trackers, or advertising beacons.
            </div>
          </div>

          {/* Table of Contents */}
          <nav aria-label="Table of Contents" className="mb-12 p-6 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <a href="#overview" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 1. Overview of Technologies</a>
              <a href="#inventory" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 2. Complete Storage Inventory</a>
              <a href="#justification" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 3. Why These Technologies Are Essential</a>
              <a href="#third-parties" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 4. Third-Party Tracker Absence</a>
              <a href="#management" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 5. How to Control or Clear Storage</a>
            </div>
          </nav>

          {/* Content Sections */}
          <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">

            {/* Section 1 */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                1. Overview of Technologies Used
              </h2>
              <p className="mb-3">
                When you navigate the EMS platform, small text files or key-value entries are saved on your web browser. EMS uses two distinct client-side storage technologies:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <Cookie className="w-4 h-4 text-[rgb(var(--color-primary))]" /> HTTP Cookies
                  </h3>
                  <p className="text-xs">
                    Lightweight files sent with HTTP requests to the server. In EMS, cookies are strictly first-party and configured with <code>SameSite=Lax</code> security attributes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <HardDrive className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Browser LocalStorage
                  </h3>
                  <p className="text-xs">
                    HTML5 client-side key-value storage isolated to your browser. Data stored in localStorage remains on your device and is not automatically transmitted with every network header.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="inventory" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                2. Complete Storage Inventory
              </h2>
              <p className="mb-3">
                The technical audit of the EMS codebase confirmed the following complete inventory of client storage keys:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-bg)] font-semibold text-[var(--text-primary)]">
                    <tr>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Storage Key</th>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Mechanism</th>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Duration</th>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Classification</th>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Purpose &amp; Data Stored</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    <tr>
                      <td className="p-3 font-mono font-bold text-[rgb(var(--color-primary))]">ems-role</td>
                      <td className="p-3">Browser Cookie</td>
                      <td className="p-3">7 Days</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Essential</span></td>
                      <td className="p-3">
                        Stores the user&apos;s active role string (e.g., <code>student</code>, <code>club_coordinator</code>, <code>associate_dean</code>, <code>director</code>, <code>super_admin</code>) enabling Next.js server-side middleware to route you to your appropriate dashboard.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[rgb(var(--color-primary))]">ems-auth</td>
                      <td className="p-3">HTML5 localStorage</td>
                      <td className="p-3">Until Logout</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Essential</span></td>
                      <td className="p-3">
                        Stores client authentication state via Zustand (user profile metadata and JSON Web Tokens) so your session is maintained across page refreshes and browser tab navigation.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[rgb(var(--color-primary))]">ems-cookie-consent</td>
                      <td className="p-3">HTML5 localStorage</td>
                      <td className="p-3">1 Year</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-text)]">Essential</span></td>
                      <td className="p-3">
                        Records whether you have acknowledged this cookie/storage notice, preventing repetitive banners on subsequent visits. Contains no personal data.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section id="justification" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                3. Why These Technologies Are Strictly Necessary
              </h2>
              <p className="mb-3">
                Under data protection frameworks including the <em>Digital Personal Data Protection Act, 2023</em> and international privacy guidelines, strictly necessary functional storage does not require opt-in marketing consent because the application cannot function without it:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Without <code>ems-role</code>, server-side route guards cannot determine whether an incoming request belongs to an authorized approver or a student, compromising access control.</li>
                <li>Without <code>ems-auth</code>, you would be disconnected every time you open an event link or refresh the page.</li>
                <li>Without <code>ems-cookie-consent</code>, the privacy disclosure notice would display continuously on every page view.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="third-parties" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                4. Third-Party Trackers &amp; Analytics Absence
              </h2>
              <p className="mb-3">
                EMS does <strong>NOT</strong> embed:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)]" /> No Google Analytics or web metrics SDKs
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)]" /> No Advertising or Retargeting pixels
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)]" /> No Social media tracking widgets
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)]" /> No Canvas or hardware device fingerprinting
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="management" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                5. How to Control or Clear Browser Storage
              </h2>
              <p className="mb-3">
                You retain complete control over your browser&apos;s storage at all times. You can inspect, block, or delete cookies and localStorage through your browser settings:
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                <p><strong>Google Chrome:</strong> Go to <code>Settings &gt; Privacy and security &gt; Third-party cookies &gt; See all site data and permissions</code>, search for the EMS domain, and click <em>Delete</em>.</p>
                <p><strong>Mozilla Firefox:</strong> Go to <code>Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data &gt; Manage Data</code>.</p>
                <p><strong>Apple Safari:</strong> Go to <code>Settings &gt; Privacy &gt; Manage Website Data</code>.</p>
                <p><strong>Microsoft Edge:</strong> Go to <code>Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data</code>.</p>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-text)] text-[var(--status-warning-text)] flex items-start gap-2.5 text-xs">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Clearing cookies or local storage will immediately sign you out of EMS and require you to log in again upon your next visit.
                </span>
              </div>
            </section>

          </div>

          {/* Bottom Back Button */}
          <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-xs font-semibold text-[rgb(var(--color-primary))] hover:underline">
              ← Return to EMS Home
            </Link>
            <div className="flex gap-4 text-xs text-[var(--text-muted)]">
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
