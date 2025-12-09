
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from './provider';

interface AuthContextState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}


const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true); // Set loading true at the start of auth change
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        try {
          // Asynchronously fetch the 'isAdmin' flag from Firestore
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          const isAdminRole = userDoc.exists() && userDoc.data()?.isAdmin === true;
          setIsAdmin(isAdminRole);

        } catch (err: any) {
          console.error("Error fetching admin status:", err);
          setError(err);
          setIsAdmin(false); // Ensure isAdmin is false on error
        } finally {
           setIsLoading(false); // Stop loading after user and admin status are resolved
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false); // Stop loading
      }
    }, (err) => {
        console.error("Auth state change error:", err);
        setError(err);
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false); // Stop loading on error
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const value = { user, isAdmin, isLoading, isAuthenticated, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
