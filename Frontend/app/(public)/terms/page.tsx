'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { 
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
  UserCheck, Award, Ban, Scale, ChevronRight 
} from 'lucide-react';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
              <Scale className="w-3.5 h-3.5" /> Terms & Conditions
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

          {/* Quick Notice Alert */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm flex items-start gap-3">
            <FileText className="w-5 h-5 text-[rgb(var(--color-primary))] flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <strong>Agreement:</strong> By creating an account, logging in, or using the Event Management System (EMS), you agree to be bound by these Terms of Use. If you do not agree to these terms, you must not access or use the platform.
            </div>
          </div>

          {/* Table of Contents */}
          <nav aria-label="Table of Contents" className="mb-12 p-6 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <a href="#eligibility" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 1. Eligibility & Account Creation</a>
              <a href="#security" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 2. Account Security & Credentials</a>
              <a href="#conduct" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 3. Acceptable Use & Prohibited Conduct</a>
              <a href="#coordinators" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 4. Club Events & Coordinator Duties</a>
              <a href="#registration" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 5. Event Registration & Attendance</a>
              <a href="#visitors" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 6. External Visitor Guidelines</a>
              <a href="#ip" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 7. Intellectual Property & Uploads</a>
              <a href="#authority" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 8. Administrative Finality</a>
              <a href="#suspension" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 9. Suspension & Deactivation</a>
              <a href="#disclaimers" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 10. Service Availability & Disclaimers</a>
              <a href="#law" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 11. Governing Law & Jurisdiction</a>
            </div>
          </nav>

          {/* Sections */}
          <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">

            {/* Section 1 */}
            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                1. Eligibility & Account Creation
              </h2>
              <p className="mb-3">
                Access to EMS is restricted to currently enrolled students, faculty members, club coordinators, and authorized administrative staff of SVKM&apos;s NMIMS, Shirpur Campus.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Institutional Email:</strong> Self-registration requires a valid institutional email address ending with <code>@nmims.in</code> or <code>@nmims.edu</code>.</li>
                <li><strong>Accurate Information:</strong> You agree to provide true, accurate, and complete information during registration and profile completion, including your legal name, official SAP ID, department, branch, and academic year.</li>
                <li><strong>One Account Per Individual:</strong> Creating duplicate accounts or registering on behalf of another individual is strictly prohibited.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="security" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                2. Account Security & Credentials
              </h2>
              <p className="mb-3">
                Users are solely responsible for maintaining the confidentiality of their credentials:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Temporary Passwords:</strong> Temporary passwords issued by EMS are confidential and single-use for initial activation or password reset. You must change your temporary password to a secure personal password upon first login.</li>
                <li><strong>No Sharing:</strong> You must not share your login credentials, session tokens, or account access with any other student or third party.</li>
                <li><strong>Compromised Accounts:</strong> You must immediately notify the EMS administration at <a href="mailto:privacy@shirpur.nmims.edu" className="text-[rgb(var(--color-primary))] hover:underline">privacy@shirpur.nmims.edu</a> if you suspect unauthorized access to your account.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="conduct" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                3. Acceptable Use & Prohibited Conduct
              </h2>
              <p className="mb-3">
                You agree to use EMS only for legitimate academic and campus event activities. You agree NOT to:
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] space-y-2 text-xs sm:text-sm">
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Submit false, deceptive, or fraudulent event registrations.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Attempt to bypass role-based access control (RBAC), forge approval signatures, or alter event workflow states without authorization.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Upload files containing malicious code, viruses, corrupted PDF documents, defamatory material, or copyrighted content without authorization.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Scrape, harvest, or extract student personal data or participant lists using automated bots or scripts.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[var(--status-danger-text)] flex-shrink-0 mt-0.5" />
                  <span>Interfere with platform stability through excessive requests or automated load testing without prior written permission from Super Admins.</span>
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="coordinators" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                4. Club Events & Coordinator Responsibilities
              </h2>
              <p className="mb-3">
                Club Coordinators who submit event proposals agree to the following standards:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Genuine Proposals:</strong> All event submissions must accurately describe the proposed activity, objectives, faculty mentors, and venue requirements.</li>
                <li><strong>Budget Accuracy:</strong> Itemized budget breakdowns must reflect bona fide estimated expenditures in compliance with campus financial rules.</li>
                <li><strong>Participation Documents:</strong> Any participation document PDF uploaded must accurately reflect event rules and must not expose sensitive personal information of students unnecessarily.</li>
                <li><strong>Event Submission Attestation:</strong> Submission of an event proposal includes a specific administrative attestation confirming adherence to student council and university bylaws.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="registration" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                5. Event Registration & Attendance
              </h2>
              <p className="mb-3">
                Students registering for events agree:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Registration tickets and check-in QR codes are personal to the registering student and non-transferable.</li>
                <li>Registrants must present their valid physical or digital NMIMS student identity card upon request at the event venue.</li>
                <li>Registrants must comply with campus safety, behavioral, and venue guidelines during event participation.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="visitors" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                6. External Visitor Guidelines
              </h2>
              <p>
                Where an event is configured to permit outside campus visitor registrations, external participants must provide authentic identification details (name, home institution, email, and mobile number). External attendees are subject to campus gate security protocols and the student code of conduct while on premises.
              </p>
            </section>

            {/* Section 7 */}
            <section id="ip" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                7. Intellectual Property & Uploaded Content
              </h2>
              <p className="mb-3">
                The software, design, logos, and trademarks of EMS are owned by SVKM&apos;s NMIMS.
              </p>
              <p className="mb-3">
                By uploading event brochures, posters, proposals, and summary reports to EMS, coordinators grant the institution a non-exclusive, royalty-free license to use, display, and archive such materials for academic reporting, administrative auditing, and institutional accreditation purposes.
              </p>
            </section>

            {/* Section 8 */}
            <section id="authority" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                8. Administrative Finality & Event Management
              </h2>
              <p className="mb-3">
                The governance of campus events is subject to institutional oversight:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Approval decisions rendered by Associate Deans and the Campus Director are final.</li>
                <li>The campus administration reserves the right to modify venue allocations, adjust schedules, or cancel approved events when necessitated by academic scheduling conflicts, campus security, or emergency conditions.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="suspension" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                9. Account Suspension & Deactivation
              </h2>
              <p>
                The EMS administration reserves the right to temporarily suspend or permanently deactivate any account that violates these Terms of Use, attempts unauthorized system penetration, or engages in fraudulent activity. Serious violations may be reported to the University Disciplinary Committee for institutional action.
              </p>
            </section>

            {/* Section 10 */}
            <section id="disclaimers" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                10. Service Availability & Disclaimers
              </h2>
              <p className="mb-3">
                EMS is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis for university extracurricular and administrative operations. While we endeavor to ensure reliable service, the institution does not guarantee that access will be entirely uninterrupted or error-free during scheduled maintenance windows or network outages.
              </p>
            </section>

            {/* Section 11 */}
            <section id="law" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                11. Governing Law & Jurisdiction
              </h2>
              <p className="mb-3">
                These Terms of Use shall be governed by and construed in accordance with the laws of India. Any legal dispute or controversy arising out of or relating to EMS shall be subject to the exclusive jurisdiction of the competent courts in Dhule / Mumbai, Maharashtra, India.
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] text-xs space-y-1">
                <p><strong>Contact for Legal Inquiries:</strong> Office of the Campus Director</p>
                <p><strong>Institution:</strong> SVKM&apos;s NMIMS, Shirpur Campus</p>
                <p><strong>Email:</strong> <a href="mailto:grievance-ems@shirpur.nmims.edu" className="text-[rgb(var(--color-primary))] hover:underline">grievance-ems@shirpur.nmims.edu</a></p>
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
              <Link href="/cookies" className="hover:text-[var(--text-primary)]">Cookie Policy</Link>
            </div>
          </div>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
