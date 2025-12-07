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

  // Memoize the document reference to prevent re-creation on every render
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  // Fetch the user's data from Firestore
  const { data: userData, isLoading: isUserDataLoading } = useDoc<{
    isAdmin?: boolean;
  }>(userDocRef);

  const isStillLoading = isUserLoading || (user && isUserDataLoading);
  const isConfirmedAdmin = !isStillLoading && user && userData?.isAdmin === true;
  const isConfirmedNotAdmin = !isStillLoading && (!user || !userData?.isAdmin);

  useEffect(() => {
    // This effect now has a very specific condition.
    // It will ONLY redirect if all loading is complete and the user is confirmed to NOT be an admin.
    if (isConfirmedNotAdmin) {
      router.push('/');
    }
  }, [isConfirmedNotAdmin, router]);

  // While ANY data is loading, show a full-screen spinner.
  // This prevents any child components from rendering prematurely.
  if (isStillLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Only if loading is complete AND the user is a confirmed admin, render the children.
  if (isConfirmedAdmin) {
    return <>{children}</>;
  }

  // If the user is confirmed not to be an admin, this renders nothing.
  // The useEffect above is already handling the redirection.
  // This prevents any flash of content before the redirect happens.
  return null;
}
