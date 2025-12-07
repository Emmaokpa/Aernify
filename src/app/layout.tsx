
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import React from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Since we are using 'usePathname' hook, we can't export metadata from here.
// We can move it to a layout file that is a server component or a page file.
// For now, we will remove it.

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark">
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          <MainLayout>
            {children}
          </MainLayout>
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
    <React.Suspense>
       <RootLayoutContent>{children}</RootLayoutContent>
    </React.Suspense>
  )
}
