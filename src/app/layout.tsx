'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import AppLayout from './(app)/layout';
import LandingLayout from './(landing)/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAppRoute = !['/login', '/signup', '/forgot-password', '/auth/action', '/'].includes(pathname) && !pathname.startsWith('/admin') && !pathname.startsWith('/terms') && !pathname.startsWith('/support');

  let Layout;
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/play') || pathname.startsWith('/challenges') || pathname.startsWith('/earn') || pathname.startsWith('/offers') || pathname.startsWith('/shop') || pathname.startsWith('/redeem') || pathname.startsWith('/withdraw') || pathname.startsWith('/leaderboard') || pathname.startsWith('/profile') || pathname.startsWith('/vip') || pathname.startsWith('/admin') || pathname.startsWith('/checkout')) {
    Layout = AppLayout;
  } else {
    Layout = LandingLayout;
  }
   if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/auth/action') {
    Layout = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  }

  return (
    <html lang="en" className="dark">
      <head></head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          <Layout>{children}</Layout>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
