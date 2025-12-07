
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';

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
    // This effect handles redirection once all loading is complete.
    if (!isLoading) {
      if (!user || !isAdmin) {
        // If loading is done and the user is not an admin, redirect.
        router.push('/');
      }
    }
  }, [isLoading, user, isAdmin, router]);

  // While loading authentication or user data, show a full-screen loading indicator.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // After loading, if the user is a confirmed admin, render the admin layout.
  // Otherwise, render null while the useEffect handles the redirection.
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

  // If not an admin or not logged in, render nothing while redirecting.
  return null;
}
