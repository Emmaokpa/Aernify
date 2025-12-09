'use client';

import type { Metadata } from 'next';
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
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isTermsRoute = pathname === '/terms';

  return (
    <html lang="en" className='dark'>
      <head>
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        {isAdminRoute || isAuthRoute || isTermsRoute ? (
          children
        ) : (
          <MainLayout>{children}</MainLayout>
        )}
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
