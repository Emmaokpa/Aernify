
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isTermsRoute = pathname === '/terms';

  const LayoutComponent = isAdminRoute ? React.Fragment : MainLayout;

  return (
    <html lang="en" className="dark">
      <head>
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {isAdminRoute || isAuthRoute || isTermsRoute ? (
            children
          ) : (
            <MainLayout>{children}</MainLayout>
          )}
        </FirebaseClientProvider>
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
  return (
    <Suspense>
      <RootLayoutContent>{children}</RootLayoutContent>
    </Suspense>
  );
}
