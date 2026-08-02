import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import { AuthGate } from '@/components/auth/auth-gate';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'ElectroPI Task Manager',
  description: 'Task management for teams — projects, tasks, and members',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/png', sizes: '1080x1080' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable} font-sans antialiased`}>
        <AppProviders>
          <AuthGate>{children}</AuthGate>
        </AppProviders>
      </body>
    </html>
  );
}
