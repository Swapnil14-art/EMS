'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import {
  Scale, FileText, Ban, CheckCircle2, ChevronRight, Shield
} from 'lucide-react';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
              <Scale className="w-3.5 h-3.5" /> Terms &amp; Conditions
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
              EMS Terms of Use
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-[var(--text-muted)]">
              <span><strong>Version:</strong> 1.0</span>
              <span>•</span>
              <span><strong>Effective Date:</strong> September 25, 2026</span>
              <span>•</span>
              <span><strong>System:</strong> Event Management System (EMS)</span>
              <span>•</span>
              <span><strong>Institution:</strong> SVKM&apos;s NMIMS, Shirpur Campus</span>
            </div>
          </div>

          {/* Quick Agreement Notice */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            By creating an account, logging in, or accessing the Event Management System (EMS), you agree to comply with and be bound by these Terms of Use.
          </div>

          {/* Table of Contents */}
          <nav aria-label="Table of Contents" className="mb-10 p-5 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a href="#eligibility" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 1. Eligibility &amp; Account Creation</a>
              <a href="#acceptable-use" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 2. Acceptable Use</a>
              <a href="#security" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 3. Account Responsibilities</a>
              <a href="#proposals" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 4. Event Proposals &amp; Coordination</a>
              <a href="#registration" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 5. Event Registration &amp; Attendance</a>
              <a href="#availability" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 6. Service Availability &amp; Liability</a>
              <a href="#governance" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 7. Administrative Finality &amp; Law</a>
            </div>
          </nav>

          {/* Terms Content */}
          <div className="space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">

            {/* Section 1 */}
            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                1. Eligibility &amp; Account Creation
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li>Access is restricted to currently enrolled students, faculty, club coordinators, and authorized staff of SVKM&apos;s NMIMS, Shirpur Campus.</li>
                <li>Self-registration requires a valid institutional email address ending with <code>@nmims.in</code> or <code>@nmims.edu</code>.</li>
                <li>Users agree to provide accurate and truthful academic information, including legal name, official student roll / SAP identifier, and departmental affiliation.</li>
                <li>Each individual may maintain only one account. Account sharing or registration on behalf of others is prohibited.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="acceptable-use" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                Acceptable Use
              </h2>
              <p className="mb-3 text-xs sm:text-sm">
                EMS is provided exclusively for legitimate campus activities and university event administration. Users agree NOT to:
              </p>
              <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] space-y-2 text-xs">
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Submit false, deceptive, or duplicate event registrations or impersonate other members.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Attempt to circumvent role-based access control (RBAC), modify approval records, or access unauthorized administrative functions.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Upload malicious files, viruses, corrupted documents, or copyrighted media without proper authorization.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Harvest or scrape participant lists or student data using automated tools or scripts.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Interfere with platform stability through denial-of-service attempts or unauthorized load testing.</span>
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="security" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                3. Account Responsibilities &amp; Credentials
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li>Users are responsible for maintaining the confidentiality of their credentials and session tokens.</li>
                <li>Temporary passwords issued during signup must be replaced with a secure password upon initial login.</li>
                <li>Any suspected compromise of credentials must be reported immediately to institutional administration through campus IT support.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="proposals" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                4. Event Proposals &amp; Coordinator Responsibilities
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li>Club coordinators submitting event proposals warrant that details, objectives, venue requests, and budget estimates are truthful and authorized by faculty advisors.</li>
                <li>Event proposals undergo formal institutional approval stages (Coordinator → Associate Dean → Director) before becoming active.</li>
                <li>Uploaded event documents, schedules, and summary reports must adhere to campus student council and academic integrity policies.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="registration" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                5. Event Registration &amp; Attendance
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li>Registration tickets and check-in QR codes are personal, non-transferable, and valid only for the registering individual.</li>
                <li>Attendees must present their valid institutional student identity card upon request at the event venue.</li>
                <li>Attendees must adhere to campus behavioral guidelines, venue capacity constraints, and safety regulations.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="availability" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                6. Service Availability &amp; Limitations of Liability
              </h2>
              <p className="text-xs sm:text-sm">
                EMS is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis for university extracurricular administration. The institution makes reasonable efforts to ensure continuous availability, but is not liable for service interruptions resulting from scheduled maintenance, network outages, or circumstances beyond institutional control.
              </p>
            </section>

            {/* Section 7 */}
            <section id="governance" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                7. Administrative Finality &amp; Governing Law
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li>Institutional decisions regarding event approvals, rescheduling, venue allocations, and participant eligibility are final.</li>
                <li>Violations of these terms may result in account deactivation and referral to the University Disciplinary Committee.</li>
                <li>These Terms of Use are governed by the laws of India. Legal inquiries may be addressed to campus administration via official institutional channels.</li>
              </ul>
            </section>

          </div>

          {/* Navigation Links */}
          <div className="mt-10 pt-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <Link href="/" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">
              ← Return to EMS Home
            </Link>
            <div className="flex gap-4 text-[var(--text-muted)]">
              <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy Policy</Link>
              <Link href="/cookies" className="hover:text-[var(--text-primary)]">Cookie Policy</Link>
            </div>
          </div>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
