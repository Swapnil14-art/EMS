'use client';

import React from 'react';
import {
  BookOpen, Sparkles, Shield, ArrowRight, CheckCircle2,
  Workflow, Users, HelpCircle, Code, Layers, Compass
} from 'lucide-react';

const QUICK_NAVS = [
  { id: 'overview', title: 'About EMS', desc: 'Platform purpose, vision & core benefits', icon: BookOpen, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  { id: 'features', title: 'What EMS Can Do', desc: '14+ capabilities and features', icon: Sparkles, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  { id: 'roles', title: 'User Roles', desc: 'Stakeholder access & dashboard guides', icon: Users, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'workflow', title: 'Event Lifecycle', desc: 'Visual timeline & approval rules', icon: Workflow, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'tutorials', title: 'Step-by-Step Guides', desc: 'Beginner guides for every role', icon: Layers, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  { id: 'faq', title: 'Platform FAQ', desc: 'Answers to common user questions', icon: HelpCircle, color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'team', title: 'Developed By', desc: 'Meet the engineering creators', icon: Code, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' },
];

export default function AboutHero() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-20 md:pt-28 md:pb-28 border-b border-[var(--card-border)] hero-mesh">
      {/* Background visual indicators */}
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[rgb(var(--nmims-gold)/0.03)] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 rounded-full bg-[rgb(var(--nmims-navy)/0.04)] blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Tag & Header */}
        <div className="text-center max-w-3.5xl mx-auto mb-16 md:mb-24 animate-fade-in">


          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-[var(--text-primary)] tracking-tight leading-tight mb-6">
            Explore SVKM's NMIMS <br />
            <span className="hero-gradient-text">Event Management System</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto font-body">
            Welcome to the onboarding space. EMS unifies event proposals, conflict prevention, venue allocations, and documentation archiving into a single campus ecosystem.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('overview')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-semibold text-sm hover:bg-[var(--btn-primary-hover-bg)] transition-all hover:shadow-card-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
            >
              Explore Documentation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] rounded-xl font-semibold text-sm hover:bg-[var(--btn-secondary-hover-bg)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              View Lifecycle Workflow
            </button>
          </div>

          {/* Core Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-[var(--text-muted)] font-medium">
            <span className="inline-flex items-center gap-1.5 bg-[var(--surface-bg)] px-3.5 py-1.5 rounded-full border border-[var(--card-border)] shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Standalone Portal
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[var(--surface-bg)] px-3.5 py-1.5 rounded-full border border-[var(--card-border)] shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Role-Based Access
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[var(--surface-bg)] px-3.5 py-1.5 rounded-full border border-[var(--card-border)] shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Clash Prevention
            </span>
          </div>
        </div>

        {/* Quick Navigation Area */}
        <div className="max-w-6xl mx-auto mt-16 md:mt-24 pt-10 border-t border-[var(--card-border)]">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-[var(--card-border)]" />
              Quick Navigation
              <span className="w-8 h-px bg-[var(--card-border)]" />
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">Jump directly to any section of the documentation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_NAVS.map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => scrollToSection(nav.id)}
                  className="group relative p-5 text-left border border-[var(--card-border)] rounded-2xl bg-[var(--card-bg)] hover:border-[rgb(var(--color-primary)/0.3)] hover:-translate-y-1 hover:shadow-card-md transition-all duration-300 flex flex-col justify-between h-full cursor-pointer overflow-hidden"
                >
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgb(var(--color-primary)/0.015)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 flex items-start justify-between mb-4 w-full">
                    <div className={`p-3 rounded-xl border ${nav.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[rgb(var(--color-primary))] group-hover:translate-x-1.5 transition-all duration-300" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                      {nav.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                      {nav.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
