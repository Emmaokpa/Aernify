'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import Header from './header';
import BottomNav from './bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { currentUser as staticUser } from '@/lib/data';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isUserLoading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [isUserLoading, user, isAuthPage, router]);


  if (isUserLoading && !isAuthPage) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthPage) {
    return <main className="flex items-center justify-center min-h-screen">{children}</main>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn(
            "flex-grow p-4 md:p-8 pb-32 md:pb-8",
            pathname !== '/profile' && "pt-6 md:pt-8" 
          )}>
          {children}
        </main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
}
