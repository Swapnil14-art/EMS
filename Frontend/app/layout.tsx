import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import { GlobalForceLogin, HydrationGate } from '@/components/shared/GlobalForceLogin';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400','500','600','700','800'],
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400','500'],
});

export const metadata: Metadata = {
  title: { default: 'EMS — NMIMS Shirpur', template: '%s | EMS NMIMS' },
  description: "Event Management System for SVKM's NMIMS MPTP, Shirpur Campus.",
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} ${jetbrains.variable}`}>
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
