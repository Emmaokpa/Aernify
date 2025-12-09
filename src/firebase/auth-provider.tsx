'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from './provider';

interface AuthContextState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

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

  const value = { user, isUserLoading, userError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
