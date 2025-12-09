'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/firebase/auth-provider';

export default function AdminAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading, isAuthenticated, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push('/');
      }
    }
  }, [isUserLoading, isAuthenticated, isAdmin, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && isAdmin) {
    return <>{children}</>;
  }

  return null;
}
