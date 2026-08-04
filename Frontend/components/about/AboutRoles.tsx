'use client';

import React, { useState } from 'react';
import {
  Users, GraduationCap, Sparkles, Building2, Crown, Shield, Key,
  CheckCircle2, ArrowRight
} from 'lucide-react';

interface RoleInfo {
  id: string;
  name: string;
  badge: string;
  icon: any;
  color: string;
  dashboard: string;
  whoIsFor: string;
  capabilities: string[];
}

const ROLES: RoleInfo[] = [
  {
    id: 'student',
    name: 'Student',
    badge: 'Attendee',
    icon: GraduationCap,
    color: 'bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-500/20',
    dashboard: '/student',
    whoIsFor: 'Enrolled students at MPSTME, SPTPS, SAST, and other campus schools.',
    capabilities: [
      'Browse all approved upcoming, ongoing, and past campus events',
      'Register for events in one click with automated profile linking',
      'View personal registration history and access entry passes',
      'Check venue schedules to see room availability and calendar events',
    ],
  },
  {
    id: 'club_coordinator',
    name: 'Club Coordinator',
    badge: 'Organizer',
    icon: Sparkles,
    color: 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-500/20',
    dashboard: '/club_coordinator',
    whoIsFor: 'Student club leads and student activity event organizers.',
    capabilities: [
      'Create and submit new event proposals with poster uploads & equipment needs',
      'Check for venue clash warnings before submitting proposals',
      'Track real-time approval progress through Associate Dean and Director reviews',
      'Submit Post-Event and R&D reports with auto-generated Microsoft Word documents',
    ],
  },
  {
    id: 'associate_dean',
    name: 'Faculty & Associate Dean',
    badge: 'School Approver',
    icon: Building2,
    color: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/20',
    dashboard: '/associate_dean',
    whoIsFor: 'Department Faculty Advisors, HODs, and School Associate Deans.',
    capabilities: [
      'Review pending event proposals submitted by student clubs in their school',
      'Approve, Reject, or Request Changes with mandatory written feedback remarks',
      'Override venue scheduling clashes with recorded justification',
      'Access department event archives, participant lists, and post-event reports',
    ],
  },
  {
    id: 'director',
    name: 'Director',
    badge: 'Executive Approver',
    icon: Crown,
    color: 'bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-500/20',
    dashboard: '/director',
    whoIsFor: 'Campus Director and top institutional executive authority.',
    capabilities: [
      'Final approval authority for campus-wide and major university events',
      'High-level governance dashboard tracking all school activities',
      'Review university event analytics, budget totals, and venue utilization',
      'Access university-wide event archives and completed R&D documentation',
    ],
  },
  {
    id: 'super_admin',
    name: 'Super Admin',
    badge: 'System Governance',
    icon: Shield,
    color: 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-500/20',
    dashboard: '/admin',
    whoIsFor: 'System Administrators and IT Governance Officers.',
    capabilities: [
      'Full administrative control over users, departments, clubs, and venues',
      'System-wide settings locks, registration toggles, and email audit logs',
      'Assign dynamic permission codes to specialized accounts',
      'Manage venue schedules, room capacities, and global configurations',
    ],
  },
  {
    id: 'additional',
    name: 'Additional User',
    badge: 'Custom Delegated Role',
    icon: Key,
    color: 'bg-cyan-500/10 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-500/20',
    dashboard: '/additional',
    whoIsFor: 'Specialized support staff, facility managers, or external auditors.',
    capabilities: [
      'Access specific custom capabilities assigned dynamically by Super Admin',
      'Email-based invitation and role assignment',
      'View delegated reports, event lists, or venue management interfaces',
      'Granular permissions can be granted or revoked at any time without account re-creation',
    ],
  },
];

export default function AboutRoles() {
  const [selectedRole, setSelectedRole] = useState<string>('student');

  const activeRole = ROLES.find(r => r.id === selectedRole) || ROLES[0];
  const Icon = activeRole.icon;

  return (
    <section id="roles" className="py-20 md:py-28 bg-[var(--card-bg)] border-b border-[var(--card-border)] relative">
      <div className="absolute top-10 left-10 w-72 h-72 bg-[rgb(var(--color-primary)/0.01)] blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-subtle)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)]">
            <Users className="w-3.5 h-3.5" />
            <span>3. User Roles & Capabilities</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            Role-Based Portals & Dashboards
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-body">
            EMS implements dedicated layouts and custom workflows tailored to each stakeholder's responsibilities. Select a role below to explore capabilities.
          </p>
        </div>

        {/* Role Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {ROLES.map((role) => {
            const RoleIcon = role.icon;
            const isSelected = role.id === selectedRole;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-5 rounded-2xl border text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 bg-[var(--card-bg)] relative ${
                  isSelected
                    ? 'border-[rgb(var(--color-primary))] bg-[var(--brand-soft)] shadow-md translate-y-[-2px]'
                    : 'border-[var(--card-border)] hover:bg-[var(--surface-subtle)] hover:border-[rgb(var(--color-primary)/0.15)]'
                }`}
              >
                {/* Active Indicator Top Dot */}
                {isSelected && (
                  <span className="absolute top-2 w-2 h-2 rounded-full bg-[rgb(var(--color-primary))]" />
                )}
                
                <div className={`p-3 rounded-xl border ${role.color} flex items-center justify-center`}>
                  <RoleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    {role.name}
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono mt-1 uppercase tracking-wider">
                    {role.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Role Detail Card */}
        <div className="max-w-4xl mx-auto">
          <div className="card p-6 sm:p-10 bg-gradient-to-br from-[var(--surface-subtle)] via-[var(--card-bg)] to-[var(--card-bg)] border-[rgb(var(--color-primary)/0.15)] shadow-card-md animate-fade-in">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[var(--card-border)] mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeRole.color} border shadow-xs`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
                      {activeRole.name} Dashboard
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary)/0.15)]">
                      {activeRole.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-body">
                    <strong>Scope:</strong> {activeRole.whoIsFor}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                <span className="text-xs text-[var(--text-muted)] font-mono bg-[var(--card-bg)] px-3.5 py-2 rounded-xl border border-[var(--card-border)]">
                  Route: {activeRole.dashboard}
                </span>
              </div>
            </div>

            {/* Capabilities grid layout */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[var(--text-muted)] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))]" />
                Key Responsibilities & Actions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeRole.capabilities.map((cap, i) => (
                  <div 
                    key={i} 
                    className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[rgb(var(--color-primary)/0.1)] transition-colors flex items-start gap-3.5 shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--brand-soft)] text-[rgb(var(--color-primary))] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-body">
                      {cap}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
