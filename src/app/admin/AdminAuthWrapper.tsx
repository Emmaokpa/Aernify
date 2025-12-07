
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

export default function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userData, isLoading: isUserDataLoading } = useDoc<{ isAdmin?: boolean }>(userDocRef);

  const isLoading = isUserLoading || (user && isUserDataLoading);
  const isAdmin = !isLoading && user && userData?.isAdmin === true;

  useEffect(() => {
    // This effect handles redirection once all loading is complete.
    // It will ONLY redirect if loading is finished and the user is NOT an admin.
    if (!isLoading) {
      if (!isAdmin) {
        router.push('/');
      }
    }
  }, [isLoading, isAdmin, router]);

  // While loading authentication or user data, show a full-screen loading indicator.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // After loading, if the user is a confirmed admin, render the children.
  if (isAdmin) {
    return <>{children}</>;
  }

  // If not an admin or not logged in (and loading is complete), render nothing.
  // The useEffect above is already handling the redirection.
  return null;
}
