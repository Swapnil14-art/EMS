'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { 
  Shield, Lock, FileText, Database, Server, Mail, 
  Users, AlertCircle, Clock, ChevronRight, CheckCircle2 
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" /> Official Privacy Policy
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
              EMS Privacy Policy
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-[var(--text-muted)]">
              <span><strong>Version:</strong> 1.0</span>
              <span>•</span>
              <span><strong>Effective Date:</strong> September 25, 2026</span>
              <span>•</span>
              <span><strong>System:</strong> Event Management System (EMS)</span>
              <span>•</span>
              <span><strong>Campus:</strong> SVKM&apos;s NMIMS, Shirpur Campus</span>
            </div>
          </div>

          {/* Quick Notice Alert */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[rgb(var(--color-primary))] flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <strong>Notice:</strong> This Privacy Policy outlines the categories of personal data processed by the Event Management System (EMS), the purposes for processing, role-based access safeguards, retention practices, and your privacy rights under applicable data protection laws, including the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em>.
            </div>
          </div>

          {/* Table of Contents */}
          <nav aria-label="Table of Contents" className="mb-12 p-6 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">Contents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <a href="#operator" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 1. Operating Entity</a>
              <a href="#data-collected" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 2. Personal Data Collected</a>
              <a href="#purposes" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 3. Purposes of Processing</a>
              <a href="#rbac" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 4. Role-Based Data Access</a>
              <a href="#third-parties" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 5. Third-Party Service Providers</a>
              <a href="#cross-border" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 6. International Data Transfers</a>
              <a href="#retention" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 7. Data Retention & Archival</a>
              <a href="#rights" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 8. User Rights & Choices</a>
              <a href="#security" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 9. Technical Security Measures</a>
              <a href="#minors" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 10. Student Age & Minor Processing</a>
              <a href="#grievance" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" /> 11. Grievance Redressal & Contact</a>
            </div>
          </nav>

          {/* Sections */}
          <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">

            {/* Section 1 */}
            <section id="operator" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                1. Operating Institution
              </h2>
              <p className="mb-3">
                The Event Management System (EMS) is operated by:
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] text-xs sm:text-sm space-y-1">
                <p><strong>Operating Institution:</strong> SVKM&apos;s NMIMS, Shirpur Campus</p>
                <p><strong>Campus Address:</strong> Mukesh Patel Technology Park, Babulde, Bank of Tapi River, Mumbai-Agra National Highway 3, Shirpur, Dhule, Maharashtra 425405, India</p>
                <p><strong>Institutional Email:</strong> <a href="mailto:privacy@shirpur.nmims.edu" className="text-[rgb(var(--color-primary))] hover:underline">privacy@shirpur.nmims.edu</a></p>
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Note: In accordance with statutory compliance guidelines, the formal legal trustee entity and registered society details are established under Shri Vile Parle Kelavani Mandal (SVKM).
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collected" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                2. Categories of Personal Data Collected
              </h2>
              <p className="mb-3">
                Based on the architectural data audit of the EMS codebase, EMS collects and processes only the information necessary for university event administration, participant verification, and workflow management:
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[rgb(var(--color-primary))]" /> A. Identity & Institutional Academic Data
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-2">
                    <li><strong>Full Name:</strong> Provided during profile completion.</li>
                    <li><strong>Student SAP ID / Roll Number:</strong> Unique institutional identifier used to ensure singular account attribution.</li>
                    <li><strong>Academic Affiliation:</strong> School / Department, Branch/Specialization, Course, and Year of Study.</li>
                    <li><strong>Contact Details:</strong> Official institutional email (restricted to <code>@nmims.in</code> or <code>@nmims.edu</code> domains) and phone number.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[rgb(var(--color-primary))]" /> B. Event Participation & Visitor Records
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-2">
                    <li><strong>Student Event Registrations:</strong> Registration timestamps, status, and participation records.</li>
                    <li><strong>Outside Campus Visitor Information:</strong> For inter-college events, external attendee details including name, parent college/institution, email address, and telephone number.</li>
                    <li><strong>Attendance & Check-in Data:</strong> Verification timestamps recorded by club coordinators during event execution.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[rgb(var(--color-primary))]" /> C. Uploaded Documents, Media & Reports
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-2">
                    <li><strong>Participation Document PDFs:</strong> Official documents uploaded by club coordinators detailing participant schedules or rosters. Note that information contained within uploaded documents constitutes personal data.</li>
                    <li><strong>Event Proposals & Budgets:</strong> Detailed itemized expenditure proposals, resource requests, and justifications.</li>
                    <li><strong>Event Summary & RnD Reports:</strong> Post-event documentation, research metrics, and attached event photographs.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[rgb(var(--color-primary))]" /> D. Authentication, Session & Technical Metadata
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-2">
                    <li><strong>Credentials:</strong> Bcrypt-hashed passwords and temporary activation passwords sent via email. Plaintext passwords are never stored.</li>
                    <li><strong>Session Identifiers:</strong> Signed JSON Web Tokens (access & refresh tokens) held in browser memory and local storage (<code>ems-auth</code>), and role cookie (<code>ems-role</code>).</li>
                    <li><strong>Audit Logs & Technical Telemetry:</strong> Client IP address, user-agent, request UUIDs, and response timings recorded in server logs for security monitoring.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="purposes" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                3. Purposes of Processing
              </h2>
              <p className="mb-3">
                EMS processes personal data exclusively for lawful academic and campus administration purposes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Account Authentication:</strong> Verification of student status and secure session management.</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Governance & Approvals:</strong> Routing event requests across Coordinator, Associate Dean, and Director tiers.</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Event Ticketing & Access:</strong> Managing participant rosters, attendee capacity, and campus security access.</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Communication:</strong> Transactional emails for temporary passwords, status changes, and approvals.</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Institutional Reporting:</strong> Documenting campus activities for academic reviews and accreditation.</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Security & Auditability:</strong> Rate limiting, brute-force defense, and compliance record-keeping.</span>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="rbac" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                4. Role-Based Access Control (RBAC)
              </h2>
              <p className="mb-3">
                Personal data is segregated according to the principle of least privilege. Users may only access information appropriate to their assigned institutional role:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-bg)] font-semibold text-[var(--text-primary)]">
                    <tr>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Role</th>
                      <th className="p-3 text-left border-b border-[var(--border-subtle)]">Permitted Data Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    <tr>
                      <td className="p-3 font-medium">Students</td>
                      <td className="p-3">Access own profile, browse approved public events, register for events, and view own registration tickets.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Club Coordinators</td>
                      <td className="p-3">Manage assigned club events, view attendee lists for own club events, upload event documentation, and submit post-event reports.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Associate Deans</td>
                      <td className="p-3">Review pending event proposals within their respective school/department, review budget requests, and manage venue override clearances.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Campus Director</td>
                      <td className="p-3">Campus-wide review of high-level approvals, institutional event calendar oversight, and historical compliance records.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Super Administrators</td>
                      <td className="p-3">Technical management of user roles, system settings, venue registries, email delivery audit logs, and legal acceptance compliance logs.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5 */}
            <section id="third-parties" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                5. Third-Party Service Providers
              </h2>
              <p className="mb-3">
                EMS engages only service providers required for core infrastructure operation:
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Transactional Email Relay (SMTP Provider)
                  </h3>
                  <p className="text-xs sm:text-sm">
                    EMS utilizes an authenticated SMTP relay provider (configured via Brevo or institutional SMTP relay) to transmit transactional emails such as temporary account passwords, approval notifications, and registration confirmations. In this process, recipient email addresses, notification categories, and message bodies are processed by the email relay provider solely for message delivery.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <Server className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Hosting, Database & Cache Infrastructure
                  </h3>
                  <p className="text-xs sm:text-sm">
                    EMS utilizes self-hosted PostgreSQL database servers and Redis cache instances deployed within campus or dedicated cloud virtual private networks. File uploads (PDF documents and images) are stored in configured server storage repositories.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--status-success-bg)] border border-[var(--status-success-text)] text-[var(--status-success-text)]">
                  <p className="font-semibold text-xs sm:text-sm">No Advertising or Commercial Tracking</p>
                  <p className="text-xs mt-1">
                    EMS does not partner with advertising networks, third-party data brokers, or marketing trackers. No analytics SDKs (e.g., Google Analytics, Facebook Pixel) are present in the application.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="cross-border" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                6. International Data Transfers
              </h2>
              <p>
                The primary database and application servers for EMS are configured for deployment within India. However, depending on the third-party email relay service provider (such as Brevo) and their underlying routing architecture, transactional email delivery packets may be routed through relay nodes situated outside India. The institution ensures that third-party processors adhere to standard security safeguards.
              </p>
            </section>

            {/* Section 7 */}
            <section id="retention" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                7. Data Retention Framework
              </h2>
              <p className="mb-3">
                Data retention in EMS reflects both technical requirements and upcoming institutional archiving schedules:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Temporary Account Activation Credentials:</strong> Temporary passwords issued during signup automatically expire within <strong>24 hours</strong>. If an account is not activated within this period, the pending record must be re-requested (limited to 4 attempts).
                </li>
                <li>
                  <strong>Authentication Sessions:</strong> Access tokens expire after <strong>24 hours</strong>. Refresh tokens expire after <strong>7 days</strong>.
                </li>
                <li>
                  <strong>Legal Acceptance Audit Records:</strong> User acceptances of the Terms of Use and Privacy Policy are retained permanently in the <code>legal_acceptances</code> audit log to substantiate regulatory compliance.
                </li>
                <li>
                  <strong>Academic & Event Records:</strong> Event history, approval logs, attendance rolls, and uploaded event reports are currently retained for the duration of the student&apos;s active academic cycle, pending the formal institutional retention schedule established by university authorities.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="rights" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                8. User Rights & Data Requests
              </h2>
              <p className="mb-3">
                In compliance with the <em>Digital Personal Data Protection Act, 2023</em>, students and authorized users possess the following rights regarding their personal data:
              </p>
              <div className="space-y-2">
                <p><strong>Right to Access:</strong> You may request a summary of the personal data processed about you within EMS.</p>
                <p><strong>Right to Correction & Updating:</strong> You may update your profile information via the EMS profile interface or submit correction requests for official academic records.</p>
                <p><strong>Right to Erasure:</strong> You may request deletion of non-statutory data, subject to university academic record-retention obligations.</p>
                <p><strong>Right to Grievance Redressal:</strong> You have the right to file a privacy concern with our designated Grievance Officer.</p>
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                To exercise any of these rights, please submit a written request to the designated contact listed in Section 11 below.
              </p>
            </section>

            {/* Section 9 */}
            <section id="security" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                9. Technical Security Measures
              </h2>
              <p className="mb-3">
                EMS employs reasonable administrative, technical, and operational safeguards to protect personal data from unauthorized access, alteration, or disclosure:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Cryptographic password hashing using bcrypt.</li>
                <li>Cryptographically signed JSON Web Tokens (HS256) for session authentication.</li>
                <li>Server-side role-based access control (RBAC) enforced on every API route.</li>
                <li>Strict rate limiting on authentication and sensitive endpoints to mitigate brute-force attempts.</li>
                <li>Cross-Origin Resource Sharing (CORS) restricted to verified institutional frontend domains.</li>
              </ul>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                While EMS implements standard security safeguards, no digital system can guarantee absolute invulnerability. Users are responsible for safeguarding their login credentials.
              </p>
            </section>

            {/* Section 10 */}
            <section id="minors" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                10. Student Age & Minor Processing
              </h2>
              <p>
                EMS is designed for university higher education students admitted to SVKM&apos;s NMIMS. Because university admissions may include first-year students who are under 18 years of age, EMS treats all enrolled student data with standard institutional safeguards. Institutional guidelines and parent/guardian consent frameworks regarding student data processing comply with statutory university regulations and the DPDP Act.
              </p>
            </section>

            {/* Section 11 */}
            <section id="grievance" className="scroll-mt-24">
              <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                11. Grievance Redressal & Contact Information
              </h2>
              <p className="mb-3">
                If you have questions, concerns, or grievances regarding the processing of your personal data under this Privacy Policy, please contact our designated institutional officers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Grievance Redressal Officer</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-2">[Designated Grievance Redressal Officer]</p>
                  <p className="text-xs"><strong>Email:</strong> <a href="mailto:grievance-ems@shirpur.nmims.edu" className="text-[rgb(var(--color-primary))] hover:underline">grievance-ems@shirpur.nmims.edu</a></p>
                  <p className="text-xs mt-1"><strong>Address:</strong> SVKM&apos;s NMIMS, Shirpur Campus, Maharashtra 425405</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Privacy Coordination Office</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-2">[Designated Privacy Officer / Coordinator]</p>
                  <p className="text-xs"><strong>Email:</strong> <a href="mailto:privacy@shirpur.nmims.edu" className="text-[rgb(var(--color-primary))] hover:underline">privacy@shirpur.nmims.edu</a></p>
                  <p className="text-xs mt-1"><strong>Scope:</strong> Data access requests, corrections, and general policy inquiries</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Under Section 13 of the Digital Personal Data Protection Act, 2023, if your privacy grievance remains unresolved after exhausting institutional mechanisms, you may register a complaint with the Data Protection Board of India.
              </p>
            </section>

          </div>

          {/* Bottom Back Button */}
          <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-xs font-semibold text-[rgb(var(--color-primary))] hover:underline">
              ← Return to EMS Home
            </Link>
            <div className="flex gap-4 text-xs text-[var(--text-muted)]">
              <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms of Use</Link>
              <Link href="/cookies" className="hover:text-[var(--text-primary)]">Cookie Policy</Link>
            </div>
          </div>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
