'use client';

import React from 'react';
import {
  BookOpen, ShieldCheck, CheckCircle2,
  GraduationCap, Users, Building2, Crown, Zap
} from 'lucide-react';

const BENEFIT_CARDS = [
  {
    role: 'Students',
    icon: GraduationCap,
    color: 'border-blue-100 hover:border-blue-300 dark:border-blue-900/40 dark:hover:border-blue-800 bg-gradient-to-b from-blue-500/[0.02] to-blue-500/[0.04]',
    iconBg: 'bg-blue-600 text-white shadow-blue-500/20 shadow-md',
    summary: 'Browse all student activities and complete one-click event registrations.',
    benefits: [
      'Discover cultural, sports, and technical events campus-wide',
      'Register instantly with pre-filled profile information',
      'Access participation entry passes directly in your dashboard',
      'View venue calendar bookings to check room schedules',
    ],
  },
  {
    role: 'Club Coordinators',
    icon: Users,
    color: 'border-amber-100 hover:border-amber-300 dark:border-amber-900/40 dark:hover:border-amber-800 bg-gradient-to-b from-amber-500/[0.02] to-amber-500/[0.04]',
    iconBg: 'bg-amber-600 text-white shadow-amber-500/20 shadow-md',
    summary: 'Simplified proposal creation, clash detection, and auto report tools.',
    benefits: [
      'Create event proposals including venue and asset requests',
      'Get instant scheduling warnings if selected venue is booked',
      'Upload posters, Rulebooks, and attendance sheets easily',
      'Generate formatted post-event Word (.docx) reports instantly',
    ],
  },
  {
    role: 'Faculty & Deans',
    icon: Building2,
    color: 'border-emerald-100 hover:border-emerald-300 dark:border-emerald-900/40 dark:hover:border-emerald-800 bg-gradient-to-b from-emerald-500/[0.02] to-emerald-500/[0.04]',
    iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-md',
    summary: 'Transparent review dashboards with dynamic clash override capability.',
    benefits: [
      'Review pending department proposals with resource requests',
      'Suggest changes or request edits back to club coordinators',
      'Override venue scheduling conflicts with recorded remarks',
      'Maintain an automated digital archive of all completed events',
    ],
  },
  {
    role: 'Administrators & Directors',
    icon: Crown,
    color: 'border-purple-100 hover:border-purple-300 dark:border-purple-900/40 dark:hover:border-purple-800 bg-gradient-to-b from-purple-500/[0.02] to-purple-500/[0.04]',
    iconBg: 'bg-purple-600 text-white shadow-purple-500/20 shadow-md',
    summary: 'Centralized institution-wide dashboard governance, analytics, and permissions.',
    benefits: [
      'Final executive approval for campus-wide events',
      'Assign specialized roles and dynamic invitation permissions',
      'Configure system flags, active departments, and venues list',
      'Monitor statistical charts on budgets and event participation',
    ],
  },
];

export default function AboutOverview() {
  return (
    <section id="overview" className="py-20 md:py-28 bg-[var(--card-bg)] border-b border-[var(--card-border)] relative">
      {/* Decorative side accents */}
      <div className="absolute top-1/3 left-0 w-24 h-48 bg-gradient-to-r from-[rgb(var(--color-primary)/0.015)] to-transparent pointer-events-none rounded-r-3xl" />
      <div className="absolute bottom-1/3 right-0 w-24 h-48 bg-gradient-to-l from-[rgb(var(--nmims-gold)/0.02)] to-transparent pointer-events-none rounded-l-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-subtle)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. About EMS</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            Seamless Event Management for SVKM's NMIMS
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-body">
            The Event Management System (EMS) is a tailored enterprise solution built specifically for NMIMS Shirpur Campus. By replacing manual paperwork and registers, it unifies the campus activities lifecycle into a fast, transparent digital workflow.
          </p>
        </div>

        {/* Narrative Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
          <div className="card p-8 bg-gradient-to-br from-[var(--surface-subtle)] to-[var(--card-bg)] border-[var(--card-border)] hover:shadow-card-md transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] flex items-center justify-center mb-6 border border-[rgb(var(--color-primary)/0.1)]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)] mb-4">
                The Purpose of EMS
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-4 font-body">
                Academic and extracurricular events require careful coordination among students, faculty guides, venue managers, food vendors, IT assistance, and administrative authorities.
              </p>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-body">
                EMS connects all of these participants under a single visual dashboard. Proposals route automatically, resources are booked digitally, and clash tracking prevents scheduling overlaps before they happen.
              </p>
            </div>
          </div>

          <div className="card p-8 bg-gradient-to-br from-[var(--surface-subtle)] to-[var(--card-bg)] border-[var(--card-border)] hover:shadow-card-md transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 border border-amber-500/15">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)] mb-4">
                Why EMS Was Developed
              </h3>
              <ul className="space-y-4 text-sm sm:text-base text-[var(--text-secondary)] font-body">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>100% Paperless Proposals:</strong> Request IT resources, budgets, food, and furniture bookings with single-form digital entries.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Room Overlaps:</strong> Automated venue clash checking ensures auditoriums, seminar halls, and laboratories are never double-booked.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Smart Reporting:</strong> Compiles participant counts, photo fliers, and expense reports into official Word documents in one click.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Accountability Logs:</strong> Keep track of every event's status history, timestamped approvals, and feedback notes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              Who Benefits from EMS?
            </h3>
            <p className="text-sm text-[var(--text-muted)]">Tailored solutions matching responsibilities for everyone on campus</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFIT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.role}
                  className={`card-hover p-6 rounded-2xl border ${card.color} flex flex-col justify-between h-full bg-[var(--card-bg)]`}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <h4 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                      For {card.role}
                    </h4>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                      {card.summary}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-body">
                    {card.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
