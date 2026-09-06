'use client';

import React from 'react';
import { Code, Heart, Building, Award } from 'lucide-react';

const DEVELOPERS = [
  {
    name: 'Swapnil Singh',
    avatarInitials: 'SS',
    color: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
  },
  {
    name: 'Adarsh Singh',
    avatarInitials: 'AS',
    color: 'from-amber-600 to-orange-600 shadow-amber-500/20',
  },
  {
    name: 'Raghav Kacker',
    avatarInitials: 'RK',
    color: 'from-emerald-600 to-teal-600 shadow-emerald-500/20',
  },
];

export default function AboutTeam() {
  return (
    <section id="team" className="py-20 md:py-28 bg-[var(--card-bg)] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[rgb(var(--nmims-navy)/0.015)] blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-subtle)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)]">
            <Code className="w-3.5 h-3.5 text-rose-600" />
            <span>7. Developed By</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            Engineering Team
          </h2>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed font-body">
            EMS is designed, developed, and maintained by student developers for SVKM's NMIMS Shirpur Campus.
          </p>
        </div>

        {/* Developer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {DEVELOPERS.map(dev => (
            <div
              key={dev.name}
              className="card p-8 sm:p-10 text-center bg-gradient-to-b from-[var(--card-bg)] to-[var(--surface-subtle)] border border-[var(--card-border)] hover:border-[rgb(var(--color-primary)/0.25)] hover:-translate-y-1 hover:shadow-card-md transition-all duration-300 flex flex-col items-center justify-between"
            >
              <div>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${dev.color} text-white font-display font-bold text-2xl flex items-center justify-center mb-6 shadow-lg mx-auto border border-white/10`}>
                  {dev.avatarInitials}
                </div>

                <h3 className="font-display font-bold text-xl text-[var(--text-primary)] mb-1">
                  {dev.name}
                </h3>

              </div>

              <div className="pt-5 border-t border-[var(--card-border)] w-full">
                <p className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 font-body">
                  <Building className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>SVKM's NMIMS, Shirpur Campus</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Credit Line */}
        <div className="text-center pt-8 border-t border-[var(--card-border)] max-w-md mx-auto">
          <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-2 font-body">
            <span>SVKM's NMIMS Shirpur Campus</span>
          </p>
        </div>

      </div>
    </section>
  );
}
