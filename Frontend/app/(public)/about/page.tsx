'use client';

import React from 'react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import AboutHero from '@/components/about/AboutHero';
import AboutNav from '@/components/about/AboutNav';
import AboutOverview from '@/components/about/AboutOverview';
import AboutFeatures from '@/components/about/AboutFeatures';
import AboutRoles from '@/components/about/AboutRoles';
import AboutWorkflow from '@/components/about/AboutWorkflow';
import AboutTutorials from '@/components/about/AboutTutorials';
import AboutFaq from '@/components/about/AboutFaq';
import AboutTeam from '@/components/about/AboutTeam';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-text)] font-sans antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--text-primary)]">
      <PublicNavbar />
      
      <main className="flex-1">
        <AboutHero />
        <AboutNav />
        <AboutOverview />
        <AboutFeatures />
        <AboutRoles />
        <AboutWorkflow />
        <AboutTutorials />
        <AboutFaq />
        <AboutTeam />
      </main>

      <AppFooter />
    </div>
  );
}
