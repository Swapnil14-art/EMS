import Link from 'next/link';
import { ArrowLeft, CalendarDays, Compass, Home } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';

export default function NotFound() {
  return (
    <main className="hero-mesh flex min-h-screen flex-col">
      <header className="border-b border-[var(--border-subtle)] bg-[rgb(var(--neutral-0)/0.82)] px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto max-w-7xl">
          <BrandMark />
        </div>
      </header>

      <section className="relative mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-12 sm:px-8">
        <div className="absolute right-0 top-12 hidden h-72 w-72 rounded-full border-[28px] border-[rgb(var(--nmims-gold)/0.08)] lg:block" />
        <div className="absolute bottom-10 left-0 hidden h-48 w-48 rounded-full bg-[rgb(var(--nmims-navy)/0.05)] lg:block" />

        <div className="relative grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--nmims-navy)/0.14)] bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
              <Compass className="h-3.5 w-3.5" />
              Lost in EMS
            </div>
            <p className="font-display text-7xl font-extrabold leading-none tracking-tight text-[var(--brand-primary)] sm:text-8xl">404</p>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">This event path doesn&apos;t exist.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
              The page may have moved, the link may be outdated, or the event is no longer available. Let&apos;s get you back to the EMS campus.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="btn-primary justify-center">
                <Home className="h-4 w-4" />
                Back to home
              </Link>
              <Link href="/events" className="btn-secondary justify-center">
                <CalendarDays className="h-4 w-4" />
                Browse events
              </Link>
            </div>
            <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-strong)]">
              <ArrowLeft className="h-4 w-4" />
              Learn more about EMS
            </Link>
          </div>

          <div className="card overflow-hidden p-2 shadow-card-lg">
            <div className="blue-section relative overflow-hidden rounded-xl px-7 py-9 text-white sm:px-9">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[20px] border-white/10" />
              <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-[rgb(var(--nmims-gold)/0.35)] blur-2xl" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <CalendarDays className="h-6 w-6 text-[rgb(var(--nmims-gold))]" />
                </div>
                <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Event Management System</p>
                <p className="mt-2 font-display text-2xl font-bold">Every campus moment, in one place.</p>
                <div className="mt-8 border-t border-white/15 pt-5 text-sm leading-6 text-white/80">
                  Check the events calendar for what&apos;s happening next at SVKM&apos;s NMIMS, Shirpur.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 py-5 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} SVKM&apos;s NMIMS, Shirpur Campus
      </footer>
    </main>
  );
}
