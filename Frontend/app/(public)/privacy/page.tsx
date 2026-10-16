'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import {
  Shield, Lock, FileText, Database, Server,
  Users, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" /> Privacy &amp; Data Protection
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
              <span><strong>Institution:</strong> SVKM&apos;s NMIMS, Shirpur Campus</span>
            </div>
          </div>

          {/* Scope Summary */}
          <div className="p-4 mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            This Privacy Policy explains how the Event Management System (EMS) at SVKM&apos;s NMIMS, Shirpur Campus collects, uses, stores, and protects personal data in compliance with institutional regulations and the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em>.
          </div>

          {/* Quick Navigation */}
          <nav aria-label="Table of Contents" className="mb-10 p-5 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a href="#scope" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 1. Institutional Scope</a>
              <a href="#data-collected" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 2. Data Collected</a>
              <a href="#purposes" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 3. Purposes of Processing</a>
              <a href="#rbac" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 4. Role-Based Access Controls</a>
              <a href="#third-parties" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 5. Service Providers &amp; Sharing</a>
              <a href="#retention" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 6. Data Retention</a>
              <a href="#security" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 7. Security Safeguards</a>
              <a href="#rights" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 8. User Rights</a>
              <a href="#grievance" className="text-[rgb(var(--color-primary))] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 9. Grievance Redressal</a>
            </div>
          </nav>

          {/* Policy Content */}
          <div className="space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">

            {/* Section 1 */}
            <section id="scope" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                1. Institutional Scope
              </h2>
              <p>
                EMS is an official internal platform operated by SVKM&apos;s NMIMS, Shirpur Campus to coordinate extracurricular events, approvals, venue scheduling, and student registrations. This policy governs the processing of personal data for enrolled students, faculty, coordinators, and authorized administrative personnel.
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collected" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                2. Personal Data Collected
              </h2>
              <p className="mb-3">
                EMS adheres to the principle of data minimization and processes only information required for academic event coordination:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <Users className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Identity &amp; Academic Affiliation
                  </h3>
                  <p className="text-xs">
                    Full name, institutional student roll / SAP identifier, school or department, branch, academic course, and year of study.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <Database className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Event &amp; Attendance Records
                  </h3>
                  <p className="text-xs">
                    Event registration timestamps, ticket status, check-in records, and external visitor information where inter-college registration is permitted.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Proposals &amp; Uploaded Documents
                  </h3>
                  <p className="text-xs">
                    Event proposals, resource and budget estimates, post-event reports, and PDF rosters submitted by authorized club coordinators.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <Lock className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Authentication &amp; System Metadata
                  </h3>
                  <p className="text-xs">
                    Bcrypt password hashes, signed session tokens, client IP addresses, and standard HTTP audit logs for security monitoring.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="purposes" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                3. Purposes of Processing
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Account Authentication:</strong> Verification of student status and session management.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Governance &amp; Approvals:</strong> Routing event proposals through coordinator, dean, and director reviews.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Event Ticketing:</strong> Managing attendee rosters, capacities, and check-in verifications.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Notifications:</strong> Transmitting temporary activation passwords, confirmations, and status updates.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Institutional Records:</strong> Archiving campus activities for accreditation and administrative reviews.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)] flex-shrink-0 mt-0.5" />
                  <span><strong>Security &amp; Auditing:</strong> Rate limiting, brute-force defense, and compliance tracking.</span>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="rbac" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                4. Role-Based Access Controls
              </h2>
              <p className="mb-3 text-xs sm:text-sm">
                Personal data access follows the principle of least privilege according to assigned institutional roles:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-bg)] font-semibold text-[var(--text-primary)]">
                    <tr>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Role</th>
                      <th className="p-2.5 text-left border-b border-[var(--border-subtle)]">Permitted Data Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    <tr>
                      <td className="p-2.5 font-medium">Students</td>
                      <td className="p-2.5">Own profile, public event listings, own event registrations, and ticketing passes.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Club Coordinators</td>
                      <td className="p-2.5">Assigned club events, attendee rosters for own club events, and event report submissions.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Associate Deans</td>
                      <td className="p-2.5">Event proposals, budget justifications, and venue allocations within their school or department.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Campus Director</td>
                      <td className="p-2.5">Campus-wide event proposals, institutional scheduling approvals, and administrative records.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Super Administrators</td>
                      <td className="p-2.5">System operations, user role configuration, venue registries, and compliance audit logs.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5 */}
            <section id="third-parties" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                5. Service Providers &amp; Third Parties
              </h2>
              <div className="space-y-3 text-xs sm:text-sm">
                <p>
                  EMS engages external services solely for core operational infrastructure:
                </p>
                <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                    <Server className="w-4 h-4 text-[rgb(var(--color-primary))]" /> Infrastructure &amp; Email Delivery
                  </h3>
                  <p className="text-xs">
                    The platform runs on institutional database and server infrastructure. An authenticated SMTP email relay is utilized exclusively to transmit system notifications, temporary passwords, and status confirmations.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] text-xs">
                  <strong>Zero Advertising or Commercial Tracking:</strong> EMS contains no marketing cookies, no third-party analytics trackers, no social tracking pixels, and does not sell or share data with data brokers.
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="retention" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                6. Data Retention
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
                <li><strong>Temporary Passwords:</strong> Expire automatically within 24 hours of issuance.</li>
                <li><strong>Session Tokens:</strong> Access tokens expire after 24 hours; refresh tokens expire after 7 days.</li>
                <li><strong>Event &amp; Registration Records:</strong> Maintained for the duration of the student&apos;s active academic tenure to support institutional transcript and participation verification.</li>
                <li><strong>Audit Records:</strong> Legal acceptances and access logs are archived to satisfy statutory compliance obligations.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="security" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                7. Technical Security Safeguards
              </h2>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
                <li>Bcrypt hashing for password storage; passwords are never saved in cleartext.</li>
                <li>Cryptographically signed JSON Web Tokens for session verification.</li>
                <li>Server-side role-based authorization enforced on every API route.</li>
                <li>Strict rate limiting on sensitive and authentication endpoints to mitigate automated attacks.</li>
                <li>Restricted Cross-Origin Resource Sharing (CORS) limited to verified institutional domains.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="rights" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                8. User Rights &amp; Choices
              </h2>
              <p className="mb-2 text-xs sm:text-sm">
                Under applicable data protection frameworks, users have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
                <li><strong>Access:</strong> The right to review your personal profile and event participation history.</li>
                <li><strong>Correction:</strong> The right to update inaccurate personal information via the profile portal.</li>
                <li><strong>Erasure:</strong> The right to request removal of non-essential records, subject to mandatory university academic record-keeping requirements.</li>
                <li><strong>Grievance Redressal:</strong> The right to submit privacy-related inquiries to institutional administration.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="grievance" className="scroll-mt-24">
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2 pb-1 border-b border-[var(--border-subtle)]">
                9. Institutional Privacy &amp; Grievance Redressal
              </h2>
              <p className="mb-3 text-xs sm:text-sm">
                For questions regarding data processing, privacy rights, or to submit a formal grievance, please contact the institutional grievance redressal office through official campus administration channels or via the campus portal helpdesk.
              </p>
              <div className="p-3.5 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-subtle)] text-xs space-y-1">
                <p><strong>Operating Authority:</strong> SVKM&apos;s NMIMS, Shirpur Campus</p>
                <p><strong>Designated Office:</strong> Institutional Privacy &amp; Grievance Redressal Office</p>
                <p><strong>Submissions:</strong> Submit requests through official campus student portal ticketing or the campus administrative office.</p>
              </div>
            </section>

          </div>

          {/* Navigation Links */}
          <div className="mt-10 pt-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <Link href="/" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">
              ← Return to EMS Home
            </Link>
            <div className="flex gap-4 text-[var(--text-muted)]">
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
