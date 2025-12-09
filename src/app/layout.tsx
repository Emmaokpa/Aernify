'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';
import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isTermsRoute = pathname === '/terms';

  // The MainLayout now includes the Header and BottomNav, which
  // are always rendered for a "logged in" user in this static version.
  return (
    <html lang="en" className="dark">
      <head></head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <MainLayout>{children}</MainLayout>
        <Toaster />
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The Suspense wrapper around usePathname is a good pattern,
  // so we'll keep it here.
  return (
    <Suspense>
      <RootLayoutContent>{children}</RootLayoutContent>
    </Suspense>
  );
}
