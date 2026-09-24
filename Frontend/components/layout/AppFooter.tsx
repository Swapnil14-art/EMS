import Link from 'next/link';
import { BrandMark } from './BrandMark';

export function AppFooter({ compact = false }: { compact?: boolean }) {
  const copyright = `© ${new Date().getFullYear()} SVKM's NMIMS, Shirpur. All rights reserved.`;

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-bg)] text-xs text-[var(--text-muted)]">
      <div className={compact ? 'flex flex-wrap items-center justify-between gap-3 px-4 py-3' : 'mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row'}>
        {compact ? <span>{copyright}</span> : <BrandMark link={false} className="max-w-full" />}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/about" className="font-medium hover:text-[var(--brand-primary)] transition-colors">
            About EMS
          </Link>
          <Link href="/privacy" className="font-medium hover:text-[var(--brand-primary)] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-medium hover:text-[var(--brand-primary)] transition-colors">
            Terms of Use
          </Link>
          <Link href="/cookies" className="font-medium hover:text-[var(--brand-primary)] transition-colors">
            Cookie Policy
          </Link>
          <Link href="/privacy#grievance" className="font-medium hover:text-[var(--brand-primary)] transition-colors">
            Privacy Grievance
          </Link>
          {!compact && <span className="text-[var(--text-muted)]">{copyright}</span>}
        </div>
      </div>
    </footer>
  );
}
