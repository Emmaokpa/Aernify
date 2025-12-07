
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  const LayoutComponent = isAdminRoute || isAuthRoute ? React.Fragment : MainLayout;
  const mainClassName = isAuthRoute ? "flex items-center justify-center min-h-screen" : "";


  return (
    <html lang="en" className="dark">
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {isAdminRoute ? (
             children
          ) : (
            <MainLayout>
              {children}
            </MainLayout>
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
    <React.Suspense>
       <RootLayoutContent>{children}</RootLayoutContent>
    </React.Suspense>
  )
}
