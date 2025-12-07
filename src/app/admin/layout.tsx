
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
    // This effect handles redirection once loading is complete.
    // It will run when isLoading changes from true to false, or if isAdmin status changes.
    if (!isLoading) {
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [isLoading, user, isAdmin, router]);

  // While loading, show a full-screen spinner to prevent any content flash.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // After loading, if the user is an admin, render the full admin layout.
  // If not, this will render `null` while the useEffect above handles the redirect.
  // This prevents non-admins from seeing any part of the admin UI.
  if (isAdmin && user) {
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

  // If the user is not an admin, render nothing while the redirect happens.
  return null;
}
