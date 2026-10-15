import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, abbreviated = false, className, link = true }: { compact?: boolean; abbreviated?: boolean; className?: string; link?: boolean }) {
  const content = <><span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-bg)] ring-1 ring-[var(--border-subtle)]"><Image src="/logo1.jpg" alt="SVKM's NMIMS logo" width={40} height={40} className="h-full w-full object-contain" priority /></span>{!compact && <span className="min-w-0"><span className="block font-display text-sm font-bold leading-tight text-[var(--text-primary)]">{abbreviated && <span className="sm:hidden">EMS</span>}<span className={abbreviated ? 'hidden sm:inline' : undefined}>Event Management System</span></span><span className="hidden text-[10px] font-medium tracking-wide text-[var(--text-muted)] sm:block">SVKM&apos;s NMIMS, Shirpur</span></span>}</>;
  const styles = cn('flex items-center gap-2.5', className);
  return link ? <Link href="/" className={styles}>{content}</Link> : <div className={styles}>{content}</div>;
}
