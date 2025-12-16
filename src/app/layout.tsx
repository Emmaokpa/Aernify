'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import AppLayout from '@/app/(app)/layout';
import LandingLayout from '@/app/(landing)/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAppPage = !['/login', '/signup', '/forgot-password', '/auth/action', '/'].includes(pathname) && !pathname.startsWith('/terms') && !pathname.startsWith('/support');

  return (
    <html lang="en" className="dark">
      <head></head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {isAppPage ? <AppLayout>{children}</AppLayout> : <LandingLayout>{children}</LandingLayout>}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
