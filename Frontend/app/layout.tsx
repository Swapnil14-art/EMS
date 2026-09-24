import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import { GlobalForceLogin, HydrationGate } from '@/components/shared/GlobalForceLogin';
import { CookieConsentBanner } from '@/components/shared/CookieConsentBanner';
import { LegalAcceptanceModal } from '@/components/shared/LegalAcceptanceModal';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'EMS — NMIMS Shirpur', template: '%s | EMS NMIMS' },
  description: "Plan, approve, discover, and participate in campus events at SVKM's NMIMS, Shirpur Campus.",
  applicationName: 'NMIMS Event Management System',
  keywords: ['NMIMS Shirpur', 'event management', 'campus events', 'student events'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NMIMS Event Management System',
    title: 'EMS — NMIMS Shirpur',
    description: "Plan, approve, discover, and participate in campus events at SVKM's NMIMS, Shirpur Campus.",
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          <HydrationGate>
            <GlobalForceLogin />
            {children}
            <LegalAcceptanceModal />
          </HydrationGate>
          <CookieConsentBanner />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: 'Inter, system-ui', fontSize: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--surface-bg)', color: 'var(--text-primary)' },
              success: { iconTheme: { primary: 'rgb(var(--success))', secondary: 'rgb(var(--neutral-0))' } },
              error:   { iconTheme: { primary: 'rgb(var(--danger))', secondary: 'rgb(var(--neutral-0))' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
