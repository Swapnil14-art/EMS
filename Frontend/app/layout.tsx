import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import { GlobalForceLogin, HydrationGate } from '@/components/shared/GlobalForceLogin';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'EMS — NMIMS Shirpur', template: '%s | EMS NMIMS' },
  description: "Event Management System for SVKM's NMIMS MPTP, Shirpur Campus.",
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
          </HydrationGate>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: 'Inter, system-ui', fontSize: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' },
              success: { iconTheme: { primary: '#2563EB', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
