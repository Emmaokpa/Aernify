'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

export default function AdminAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<{
    isAdmin?: boolean;
  }>(userDocRef);

  // This is the critical change: combine both loading states.
  // We are only finished loading when BOTH auth and the user's Firestore doc are done.
  const isStillLoading = isUserLoading || (user && isUserDataLoading);

  useEffect(() => {
    // Only run this effect if we are NOT loading.
    if (!isStillLoading) {
      // If loading is finished and we determine the user is not an admin, then redirect.
      const isConfirmedAdmin = user && userData?.isAdmin === true;
      if (!isConfirmedAdmin) {
        router.push('/');
      }
    }
  }, [isStillLoading, user, userData, router]);

  // While ANY data is loading, show a full-screen spinner.
  // This prevents any child components from rendering or any logic from running prematurely.
  if (isStillLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If loading is complete AND the user is a confirmed admin, render the children.
  // The useEffect above will have already handled redirection for non-admins.
  if (user && userData?.isAdmin === true) {
    return <>{children}</>;
  }

  // In the brief moment after loading and before the redirect effect kicks in,
  // render nothing to prevent a flash of content.
  return null;
}
