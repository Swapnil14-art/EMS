'use client';

import React from 'react';
import {
  Workflow, FileEdit, CheckCircle2, ArrowRight,
  Building2, Sliders, Crown, CalendarCheck, FileText,
  RotateCcw, RefreshCw, XCircle, ChevronDown
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: 1,
    status: 'Draft',
    title: 'Event Creation',
    role: 'Club Coordinator',
    icon: FileEdit,
    color: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    description: 'Coordinator enters proposal specifications (dates, estimated budget, poster flier, furniture, AV requirements).',
    action: 'System clash engine automatically checks date/venue schedules.'
  },
  {
    step: 2,
    status: 'Pending',
    title: 'School Dean Review',
    role: 'Associate Dean',
    icon: Building2,
    color: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    description: 'Dean reviews academic relevance and logistics, optionally overriding scheduling clashes with written justifications.',
    action: 'Dean can approve, reject, or request edits back to draft.'
  },
  {
    step: 3,
    status: 'Logistics',
    title: 'Coordination Check',
    role: 'IT & Facilities',
    icon: Sliders,
    color: 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    description: 'IT and Facility coordinators check equipment availability, audio setups, seating arrangements, and Wi-Fi requests.',
    action: 'Verifies operational readiness prior to final sign-off.'
  },
  {
    step: 4,
    status: 'Final Approval',
    title: 'Director Sign-off',
    role: 'Campus Director',
    icon: Crown,
    color: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    description: 'Campus Director reviews overall feasibility and budgets, performing final approval on university events.',
    action: 'Event transitions to "Approved" and publishes to calendar.'
  },
  {
    step: 5,
    status: 'Live',
    title: 'Execution & Turnout',
    role: 'Students & Clubs',
    icon: CalendarCheck,
    color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    description: 'Registration opens. Celery schedulers automatically transition event status from Approved → Ongoing → Completed.',
    action: 'Student entry credentials validate at the door.'
  },
  {
    step: 6,
    status: 'Archived',
    title: 'Post-Event Reports',
    role: 'Club Coordinator',
    icon: FileText,
    color: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    description: 'Coordinator logs participant metrics and expenditure totals, uploading fliers and attendance sheets.',
    action: 'EMS auto-compiles official Microsoft Word (.docx) report.'
  },
];

export default function AboutWorkflow() {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-[var(--surface-subtle)] border-b border-[var(--card-border)] relative">
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[rgb(var(--nmims-navy)/0.01)] blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)] shadow-xs">
            <Workflow className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. Lifecycle Workflow</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            The Event Approval & Execution Lifecycle
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-body">
            Proposals flow through an automated digital checklist involving organizers, school authorities, facility coordinators, and campus executives.
          </p>
        </div>

        {/* Visual Workflow Reset Rule Infographic */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="card border border-amber-500/35 bg-amber-500/[0.03] dark:bg-amber-950/10 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                <RotateCcw className="w-7 h-7 animate-spin-slow" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display font-bold text-base sm:text-lg text-amber-900 dark:text-amber-300">
                    Important Workflow Reset Rule
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white font-mono">
                    System Policy
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/95 leading-relaxed font-body mb-4">
                  If an Associate Dean or Director requests changes or rejects a proposal at any step *prior* to final approval, the approval state is reset. The proposal returns to "Draft" and must be re-submitted.
                </p>

                {/* Micro flow diagram for reset rule */}
                <div className="grid grid-cols-5 items-center gap-2 max-w-lg bg-[var(--card-bg)] p-3 rounded-xl border border-amber-500/10">
                  <div className="text-center p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block">Proposal</span>
                    <span className="text-[8px] text-amber-700/80 dark:text-amber-400 font-mono">Step 1-4</span>
                  </div>
                  <div className="flex justify-center text-amber-500">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="text-center p-2 rounded bg-rose-500/15 border border-rose-500/20 flex flex-col items-center">
                    <XCircle className="w-4 h-4 text-rose-600 mb-0.5" />
                    <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300">Change Request</span>
                  </div>
                  <div className="flex justify-center text-amber-500">
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="text-center p-2 rounded bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 block">Draft Reset</span>
                    <span className="text-[8px] text-blue-700/80 dark:text-blue-400 font-mono">Restart Cycle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Stepper Timeline Diagram */}
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical progress line */}
          <div className="absolute left-[23px] sm:left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-amber-500 to-rose-500 pointer-events-none opacity-40" />

          <div className="space-y-8">
            {WORKFLOW_STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.step} className="flex gap-4 sm:gap-6 relative items-start group">
                  {/* Stepper badge with step number indicator */}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 ${step.color} flex flex-col items-center justify-center shrink-0 z-10 bg-[var(--card-bg)] shadow-sm relative group-hover:scale-105 transition-transform duration-300`}>
                    <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white font-mono text-[9px] font-bold flex items-center justify-center border border-[var(--card-bg)]">
                      {step.step}
                    </span>
                  </div>

                  {/* Step Description Card */}
                  <div className="card p-6 sm:p-8 bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[rgb(var(--color-primary)/0.2)] hover:shadow-card-md transition-all duration-300 flex-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[rgb(var(--color-primary)/0.01)] to-transparent pointer-events-none" />

                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--card-border)] text-[rgb(var(--color-primary))] font-mono text-[10px] font-bold uppercase tracking-wider">
                          Phase {step.step}
                        </span>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]">
                          {step.title}
                        </h3>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-soft)] border border-[rgb(var(--color-primary)/0.12)] text-[rgb(var(--color-primary))]">
                        {step.role}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-4 font-body">
                      {step.description}
                    </p>

                    {/* Step Action Box */}
                    <div className="p-3 sm:p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--card-border)] text-xs text-[var(--text-muted)] flex items-start gap-2.5 font-body">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-normal"><strong>System Action:</strong> {step.action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
