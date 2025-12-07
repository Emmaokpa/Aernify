'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/firebase/auth-provider';

export default function AdminAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Only perform actions once loading is complete
    if (!isLoading) {
      if (!isAuthenticated || !isAdmin) {
        // If not authenticated or not an admin after loading, redirect.
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // While loading, show a spinner and do nothing else.
  // This prevents any rendering or redirecting until we know the user's final state.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If loading is finished and the user is an authenticated admin, render the children.
  // The useEffect above will handle redirection for all other cases.
  if (isAuthenticated && isAdmin) {
    return <>{children}</>;
  }

  // Render null in the brief moment before the redirect effect kicks in after loading.
  return null;
}
