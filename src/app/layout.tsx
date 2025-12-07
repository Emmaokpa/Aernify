
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
import AdminLayout from './admin/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Since we are using 'usePathname' hook, we can't export metadata from here.
// We can move it to a layout file that is a server component or a page file.
// For now, we will remove it.

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" className="dark">
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {isAdminRoute ? (
            <AdminLayout>{children}</AdminLayout>
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

    