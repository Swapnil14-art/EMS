'use client';
import Link from 'next/link';
import {
  Calendar, Users, Award, TrendingUp, MapPin, BookOpen,
  Zap, Shield, Bell, BarChart3, ChevronRight
} from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { AppFooter } from '@/components/layout/AppFooter';

const FEATURES = [
  {
    icon: <Calendar className="w-7 h-7 text-[rgb(var(--color-primary))]" />,
    title: 'Discover Events',
    desc: 'Browse ongoing, upcoming and past events from all schools and clubs across campus.',
  },
  {
    icon: <Award className="w-7 h-7 text-[rgb(var(--color-primary))]" />,
    title: 'Easy Registration',
    desc: 'Register for events in one click. Get participant docs directly to your dashboard.',
  },
  {
    icon: <TrendingUp className="w-7 h-7 text-[rgb(var(--color-primary))]" />,
    title: 'Streamlined Approvals',
    desc: 'Faculty and organizers manage the full event lifecycle — from proposal to archiving.',
  },
  {
    icon: <MapPin className="w-7 h-7 text-[rgb(var(--color-primary))]" />,
    title: 'Venue Management',
    desc: 'Check venue availability, detect scheduling clashes, and view calendar bookings.',
  },
  {
    icon: <Bell className="w-7 h-7 text-[rgb(var(--color-primary))]" />,
    title: 'Real-time Notifications',
    desc: 'Email notifications keep students and faculty updated on approvals and event changes.',
  },
  {
    icon: <Shield className="w-7 h-7 text-[rgb(var(--color-primary))]" />,
    title: 'Role-based Access',
    desc: 'Students, faculty, HODs, Deans, and Directors each get a tailored dashboard.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--card-bg)]">
      <PublicNavbar />

      <div className="pt-24 pb-16">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full text-sm font-semibold mb-6">
            <BookOpen className="w-4 h-4" />
            About EMS
          </div>
          <h1 className="font-display font-bold text-[var(--text-primary)] text-4xl md:text-5xl mb-6">
            Event Management System
          </h1>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-2xl mx-auto">
            EMS is a comprehensive platform built for SVKM's NMIMS, Shirpur Campus to
            streamline the entire event lifecycle — from proposal submission and multi-level
            approvals to venue booking, student registration, and post-event reporting.
          </p>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <h2 className="section-title text-center mb-10">Why EMS?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feat => (
              <div key={feat.title} className="card p-6 hover:shadow-card-md transition-shadow">
                <div className="w-14 h-14 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-2">{feat.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Designed & Developed By */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 md:p-12 text-center">
            <h2 className="section-title mb-4">Designed &amp; Developed By</h2>
            <p className="text-[var(--text-muted)] text-sm">— To be announced —</p>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
