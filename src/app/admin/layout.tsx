
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userData, isLoading: isUserDataLoading } = useDoc<{ isAdmin?: boolean }>(userDocRef);

  const isLoading = isUserLoading || isUserDataLoading;
  const isAdmin = userData?.isAdmin === true;

  useEffect(() => {
    // If loading is complete and the user is not an admin, redirect.
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-16 w-16" />
      </div>
    );
  }

  // Only render the layout for admins. Otherwise, render nothing while redirecting.
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-grow p-4 md:p-8 pb-32 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
