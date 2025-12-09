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
import { currentUser } from '@/lib/data';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isProfilePage = pathname === '/profile';
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <main className="flex items-center justify-center min-h-screen">{children}</main>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        {isProfilePage && (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
            <div/>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary">
                <Coins className="h-5 w-5" />
                <span>{currentUser.coins.toLocaleString() || 0}</span>
              </div>
              <Link href="/profile">
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </header>
        )}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn(
            "flex-grow p-4 md:p-8 pb-32 md:pb-8",
            !isProfilePage && "pt-6 md:pt-8" 
          )}>
          {children}
        </main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
}
