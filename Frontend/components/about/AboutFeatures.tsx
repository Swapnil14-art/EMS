'use client';

import React, { useState } from 'react';
import {
  Sparkles, Calendar, ShieldCheck, Users, Mail, AlertTriangle,
  DollarSign, Sliders, FileUp, FileText, FlaskConical, BarChart3,
  Key, History, Bell, CheckCircle2
} from 'lucide-react';

interface FeatureItem {
  id: string;
  category: 'core' | 'logistics' | 'reports' | 'admin';
  icon: any;
  title: string;
  badge: string;
  description: string;
  benefit: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'event-management',
    category: 'core',
    icon: Calendar,
    title: 'Event Creation & Management',
    badge: 'Proposals',
    description: 'Draft and organize academic, technical, cultural, and sports events with step-by-step guidance.',
    benefit: 'Saves time by guiding organizers through date selection, department choices, target audience tags, and detailed descriptions.',
  },
  {
    id: 'multi-approval',
    category: 'core',
    icon: ShieldCheck,
    title: 'Multi-Level Approval Workflow',
    badge: 'Approvals',
    description: 'Automated multi-stage approval engine passing through Faculty, Associate Deans, Coordinators, and Director.',
    benefit: 'Eliminates lost paper proposals and gives full transparency into exactly which approver currently holds the proposal.',
  },
  {
    id: 'rbac',
    category: 'admin',
    icon: Users,
    title: 'Role-Based Access Control',
    badge: 'Security',
    description: 'Tailored dashboards for Students, Club Coordinators, Faculty Deans, Directors, and Super Admins.',
    benefit: 'Ensures everyone sees only what is relevant to them—preventing clutter and protecting administrative actions.',
  },
  {
    id: 'additional-users',
    category: 'admin',
    icon: Mail,
    title: 'Email-Based Additional Users',
    badge: 'Custom Roles',
    description: 'Grant non-standard user accounts specific access through email invitations and dynamic permission tags.',
    benefit: 'Allows external auditors, specialized coordinators, or non-academic staff to participate without full admin rights.',
  },
  {
    id: 'clash-detection',
    category: 'logistics',
    icon: AlertTriangle,
    title: 'Event Clash Detection',
    badge: 'Conflict Check',
    description: 'Real-time venue availability checking alerts organizers if a selected venue and time slot is already booked.',
    benefit: 'Prevents double-booking auditoriums or sports halls, with explicit clash-override rules for approvers.',
  },
  {
    id: 'budget-tracking',
    category: 'logistics',
    icon: DollarSign,
    title: 'Budget Allocation & Tracking',
    badge: 'Finance',
    description: 'Track proposed event expenses, sponsor contributions, approved budgets, and actual final expenditures.',
    benefit: 'Provides clear financial transparency for institutional auditing and club budget planning.',
  },
  {
    id: 'requirements-mgmt',
    category: 'logistics',
    icon: Sliders,
    title: 'Event Requirements Management',
    badge: 'Logistics',
    description: 'Specify equipment, furniture, Wi-Fi, audio/visual setups, and refreshment needs directly in the proposal.',
    benefit: 'Notifies facility and IT coordinators in advance so venues are equipped before the event starts.',
  },
  {
    id: 'document-uploads',
    category: 'core',
    icon: FileUp,
    title: 'Document & Poster Uploads',
    badge: 'Media',
    description: 'Upload high-resolution event posters, rulebooks, speaker profiles, and participant lists.',
    benefit: 'Keeps all event assets centralized and displays official posters on public event landing cards.',
  },
  {
    id: 'report-generation',
    category: 'reports',
    icon: FileText,
    title: 'Automated Report Generation',
    badge: '.docx Reports',
    description: 'Generate standardized Word (.docx) post-event reports complete with participant metrics and photo galleries.',
    benefit: 'Saves hours of manual formatting by automatically formatting official institutional event reports.',
  },
  {
    id: 'rnd-management',
    category: 'reports',
    icon: FlaskConical,
    title: 'R&D Event Management',
    badge: 'Research',
    description: 'Specialized workflow for Research & Development workshops, faculty seminars, and academic paper presentations.',
    benefit: 'Maintains institutional research archives required for accreditation (NAAC/NIRF) documentation.',
  },
  {
    id: 'analytics',
    category: 'admin',
    icon: BarChart3,
    title: 'Dashboard Analytics & Insights',
    badge: 'Analytics',
    description: 'Visual charts depicting event counts per school, student turnout rates, venue usage, and approval speeds.',
    benefit: 'Helps directors and deans make data-driven decisions on campus activity trends and venue allocation.',
  },
  {
    id: 'permission-mgmt',
    category: 'admin',
    icon: Key,
    title: 'Dynamic Permission Engine',
    badge: 'Delegation',
    description: 'Super Admins can grant or revoke specific dynamic permission codes (e.g. view_reports, manage_venues).',
    benefit: 'Adapts permissions dynamically without needing code changes or redeploying the application.',
  },
  {
    id: 'history-tracking',
    category: 'core',
    icon: History,
    title: 'Event History & Audit Logs',
    badge: 'Audit Trail',
    description: 'Complete chronological history recording every approval, change request, rejection remark, and update.',
    benefit: 'Provides complete institutional accountability and easy historical reference for recurring annual events.',
  },
  {
    id: 'notifications',
    category: 'core',
    icon: Bell,
    title: 'Automated Status Notifications',
    badge: 'Alerts',
    description: 'Instant notification badges and email alerts inform coordinators when proposals are approved or modified.',
    benefit: 'Keeps organizers updated instantly without having to manually refresh or call approving authorities.',
  },
];

export default function AboutFeatures() {
  const [activeTab, setActiveTab] = useState<'all' | 'core' | 'logistics' | 'reports' | 'admin'>('all');

  const filteredFeatures = activeTab === 'all' 
    ? FEATURES 
    : FEATURES.filter(f => f.category === activeTab);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      case 'logistics': return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
      case 'reports': return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
      case 'admin': return 'text-purple-600 bg-purple-500/10 border-purple-500/20';
      default: return 'text-[var(--text-secondary)] bg-[var(--surface-subtle)]';
    }
  };

  return (
    <section id="features" className="py-20 md:py-28 bg-[var(--surface-subtle)] border-b border-[var(--card-border)] relative">
      {/* Visual background details */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[rgb(var(--nmims-navy)/0.015)] blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-[rgb(var(--nmims-gold)/0.01)] blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>2. What EMS Can Do</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            Complete Feature Directory
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-body">
            Explore the 14 core features engineered to cover logistics, financial allocations, visual dashboard analytics, and academic research tracking.
          </p>
        </div>

        {/* Filter Tabs Grid */}
        <div className="flex flex-wrap justify-center items-center gap-2.5 mb-12 max-w-4xl mx-auto">
          {[
            { id: 'all', label: 'All Features' },
            { id: 'core', label: 'Core Workflow' },
            { id: 'logistics', label: 'Venues & Logistics' },
            { id: 'reports', label: 'Post-Event Reports' },
            { id: 'admin', label: 'Admin & Governance' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                  : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] border-[var(--card-border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Features Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="card p-6 bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[rgb(var(--color-primary)/0.25)] hover:-translate-y-1 hover:shadow-card-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-xl border ${getCategoryColor(feat.category)} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--card-border)] text-[var(--text-muted)] font-mono text-[10px] font-bold">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2 group-hover:text-[rgb(var(--color-primary))]">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-body">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--card-border)] bg-gradient-to-r from-transparent via-[var(--surface-subtle)] to-transparent rounded-b-xl -mx-6 -mb-6 p-6">
                  <p className="text-xs text-[var(--text-muted)] flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Platform benefit:</strong> {feat.benefit}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
