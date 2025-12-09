'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth, useFirestore, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

interface AuthContextState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userError: Error | null;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false);
      },
      (error) => {
        setUserError(error);
        setUser(null);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const value = { 
    user, 
    profile,
    isUserLoading: isUserLoading || (!!user && isProfileLoading), 
    isAuthenticated: !!user,
    isAdmin: profile?.isAdmin ?? false,
    userError 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
