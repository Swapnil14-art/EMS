'use client';

import React, { useState } from 'react';
import {
  Layers, GraduationCap, Sparkles, Building2, Key,
  CheckCircle2, ArrowRight, Lightbulb
} from 'lucide-react';

interface StepGuide {
  number: number;
  title: string;
  desc: string;
  tip?: string;
}

interface RoleTutorial {
  roleId: string;
  roleName: string;
  icon: any;
  title: string;
  overview: string;
  steps: StepGuide[];
}

const TUTORIALS: RoleTutorial[] = [
  {
    roleId: 'student',
    roleName: 'Student Guide',
    icon: GraduationCap,
    title: 'How to Browse & Register for Events as a Student',
    overview: 'Discover events across schools, register instantly, and check venue booking status.',
    steps: [
      {
        number: 1,
        title: 'Sign Up or Log In',
        desc: 'Go to the Sign Up page, select your school (e.g. MPSTME, SPTPS, SAST), enter your NMIMS email and SAP ID, and create your account.',
        tip: 'Verify your profile branch and year details under settings to ensure registration passes print correctly.',
      },
      {
        number: 2,
        title: 'Browse Active Events',
        desc: 'Open your Student Dashboard (/student) to filter ongoing and upcoming events by category (Technical, Cultural, Sports, Workshop).',
      },
      {
        number: 3,
        title: 'Register in One Click',
        desc: 'Select an event card to view full details (venue, date, time, coordinator contact). Click the "Register Now" button to confirm your spot.',
        tip: 'Manage active registrations or cancel attendance under the registrations log tab.',
      },
      {
        number: 4,
        title: 'Check Venue Calendars',
        desc: 'Visit "/student/venues" to see schedule bookings for campus auditoriums and conference rooms.',
      },
    ],
  },
  {
    roleId: 'club_coordinator',
    roleName: 'Club Coordinator Guide',
    icon: Sparkles,
    title: 'How to Submit Proposals & Post-Event Reports',
    overview: 'Club Coordinators create proposals, perform scheduling conflict checks, and submit final reports.',
    steps: [
      {
        number: 1,
        title: 'Draft a New Proposal',
        desc: 'Open "/club_coordinator/events/create" and step through the proposal wizard. Enter title, description, and school alignment.',
      },
      {
        number: 2,
        title: 'Select Venue & Check Clashes',
        desc: 'Choose your event venue and date. The conflict checker will warn you if the venue is already booked for another event.',
      },
      {
        number: 3,
        title: 'Specify Requirements & Upload Poster',
        desc: 'Select logistical resources (microphones, chairs, catering) and upload the official high-resolution event flier.',
      },
      {
        number: 4,
        title: 'Track Approvals & Submit Reports',
        desc: 'Monitor Associate Dean and Director reviews. After the event, enter final turnout and expenditures to auto-generate the official Word (.docx) report.',
        tip: 'If an approval gets rejected, update the proposal and submit again to restart the approval sequence from Phase 1.',
      },
    ],
  },
  {
    roleId: 'associate_dean',
    roleName: 'Faculty & Dean Guide',
    icon: Building2,
    title: 'How to Review & Approve Proposals',
    overview: 'Faculty advisors and Associate Deans inspect academic quality and logistical feasibility.',
    steps: [
      {
        number: 1,
        title: 'View Pending Approvals',
        desc: 'Open the Associate Dean Dashboard (/associate_dean). Proposals awaiting review will appear under "Pending Review".',
      },
      {
        number: 2,
        title: 'Check Clash warnings & Details',
        desc: 'Click any proposal to review date specifications, equipment lists, budget details, and automated conflict reports.',
      },
      {
        number: 3,
        title: 'Submit Decision',
        desc: 'Select Approve, Suggest Changes, or Reject. If suggesting changes, provide mandatory feedback comments for the coordinator.',
        tip: 'You can check "Override Clash" and enter written justification to override venue scheduling conflicts.',
      },
    ],
  },
  {
    roleId: 'additional',
    roleName: 'Additional User Guide',
    icon: Key,
    title: 'How Custom Permission Workflows Operate',
    overview: 'Additional Users perform specific tasks assigned dynamically by Super Admins.',
    steps: [
      {
        number: 1,
        title: 'Log In via Email Invitation',
        desc: 'Log in with the credentials associated with the email address registered by the administrator.',
      },
      {
        number: 2,
        title: 'Access Custom Features',
        desc: 'Your dashboard automatically presents tools matching your dynamic permission codes (e.g. view reports, manage venues, audit logs).',
      },
    ],
  },
];

export default function AboutTutorials() {
  const [selectedRole, setSelectedRole] = useState<string>('student');

  const activeTutorial = TUTORIALS.find(t => t.roleId === selectedRole) || TUTORIALS[0];
  const Icon = activeTutorial.icon;

  return (
    <section id="tutorials" className="py-20 md:py-28 bg-[var(--card-bg)] border-b border-[var(--card-border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-subtle)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)]">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>5. Step-by-Step Onboarding Guides</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            Interactive User Guides
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-body">
            Select your campus role below to explore customized walk-through guides.
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-3xl mx-auto">
          {TUTORIALS.map(t => {
            const RoleIcon = t.icon;
            const isSelected = t.roleId === selectedRole;
            return (
              <button
                key={t.roleId}
                onClick={() => setSelectedRole(t.roleId)}
                className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)] border-[var(--card-border)]'
                }`}
              >
                <RoleIcon className="w-4.5 h-4.5" />
                <span>{t.roleName}</span>
              </button>
            );
          })}
        </div>

        {/* Tutorial Box */}
        <div className="max-w-4xl mx-auto">
          <div className="card p-6 sm:p-10 bg-gradient-to-br from-[var(--surface-subtle)] via-[var(--card-bg)] to-[var(--card-bg)] border-[var(--card-border)] shadow-card-md">
            
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--card-border)]">
              <div className="p-3 rounded-xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary)/0.1)]">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                  {activeTutorial.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-body">
                  {activeTutorial.overview}
                </p>
              </div>
            </div>

            {/* Steps Vertical List */}
            <div className="space-y-6">
              {activeTutorial.steps.map((step) => (
                <div 
                  key={step.number} 
                  className="p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[rgb(var(--color-primary)/0.12)] transition-all duration-200 flex flex-col sm:flex-row items-start gap-4 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-[rgb(var(--color-primary)/0.12)] shadow-xs">
                    {step.number}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] mb-1.5">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-body">
                      {step.desc}
                    </p>
                    
                    {step.tip && (
                      <div className="mt-4 p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2.5 leading-relaxed font-body">
                        <Lightbulb className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>Tip:</strong> {step.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
