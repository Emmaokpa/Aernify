
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth, useFirestore, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
          
          try {
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
              // User exists in Auth, but not in Firestore. Create the profile.
              console.log(`User ${firebaseUser.uid} not found in Firestore. Creating profile...`);
              
              const newUserProfile: Omit<UserProfile, 'id'> = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'New User',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL,
                coins: 10, // Award starting coins here
                weeklyCoins: 0,
                referralCode: generateReferralCode(),
                isAdmin: false,
                isVip: false,
                currentStreak: 0,
                lastLoginDate: '',
              };
              
              // We create a version of the profile that is compliant with the creation rule (no coins)
              const { coins, ...initialProfile } = newUserProfile;
              
              // This should succeed based on the security rule for create
              await setDoc(userRef, initialProfile);
              
              // After creation, we can immediately update it to add the coins
              // This is a separate operation that should be allowed by the update rule
              await setDoc(userRef, { coins: coins }, { merge: true });

            }
          } catch (e: any) {
            console.error("Error during user profile check/creation:", e);
             const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
                requestResourceData: { note: 'Profile creation/check failed' }
            });
            errorEmitter.emit('permission-error', permissionError);
            setUserError(permissionError);
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
