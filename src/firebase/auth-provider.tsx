'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth, useFirestore, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userError: Error | null;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

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
      async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in. Check if their profile exists in Firestore.
          const userRef = doc(firestore, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);

          if (!docSnap.exists()) {
            // User exists in Auth, but not in Firestore. Create the profile.
            console.log(`User ${firebaseUser.uid} not found in Firestore. Creating profile...`);
            const newUserProfile: Omit<UserProfile, 'id'> = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL,
              coins: 10, // Default starting coins
              weeklyCoins: 0,
              referralCode: generateReferralCode(),
              isAdmin: false,
              isVip: false,
              currentStreak: 0,
              lastLoginDate: '',
            };
            await setDoc(userRef, newUserProfile);
          }
        }
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
  }, [auth, firestore]);

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

    

    