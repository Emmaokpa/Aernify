
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/icons/logo';

function AppSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar Skeleton */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b h-16">
            <Logo />
          </div>
          <div className="flex-grow p-4">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="p-4 border-t">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </aside>
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
            <Skeleton className="h-10 w-10 md:hidden" />
            <div className="flex w-full items-center justify-end gap-4">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-grow p-4 md:p-8">
            <Skeleton className="h-10 w-64 mb-6" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </main>
      </div>

       {/* Bottom Nav Skeleton */}
      <div className="fixed bottom-0 left-0 z-30 w-full border-t bg-background/95 backdrop-blur-sm md:hidden p-2">
         <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-1">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-3 w-10" />
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const isGamePage = pathname.startsWith('/play/');

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is known

    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check for email verification only for users who signed up with email/password
    const isEmailPasswordUser = user.providerData.some(
      (provider) => provider.providerId === 'password'
    );

    if (isEmailPasswordUser && !user.emailVerified) {
       if (pathname !== '/verify-email') {
          router.push('/verify-email');
       }
    }

  }, [isUserLoading, user, router, pathname]);


  if (isUserLoading) {
     return <AppSkeleton />;
  }
  
  if (!user || (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified && pathname !== '/verify-email')) {
    // Show skeleton while redirecting to prevent content flash
    return <AppSkeleton />;
  }
  
  return (
    <div className={cn("min-h-screen bg-background", isGamePage && 'is-game-page')}>
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className={cn("flex flex-col min-h-screen", !isGamePage && "md:pl-64")}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn(
            "flex-grow p-4 md:p-8 pb-32 md:pb-8",
            pathname !== '/profile' && "pt-6 md:pt-8",
            isGamePage && "p-0 md:p-0 pb-0 md:pb-0 h-screen"
          )}>
          {children}
        </main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
}
