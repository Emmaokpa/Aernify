'use client';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import type { UserProfile } from './types';

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Ensures a user profile exists in Firestore.
 * If the document does not exist, it creates a new profile with initial data.
 * This function should only be called AFTER a user is successfully authenticated.
 * @param firestore - The Firestore instance.
 * @param user - The newly created and authenticated Firebase Auth user object.
 */
export const ensureUserProfile = async (firestore: Firestore, user: User) => {
  const userRef = doc(firestore, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Document does not exist, so create it.
      const initialProfileData: Omit<UserProfile, 'weeklyCoins' | 'currentStreak' | 'lastLoginDate' | 'isVip' | 'referralCount' | 'photoURL'> & {createdAt: any} = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email || '',
        coins: 10, // Initial coin balance
        referralCode: generateReferralCode(),
        isAdmin: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, initialProfileData);
      console.log(`Successfully created profile for new user: ${user.uid}`);
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    // Re-throw the error so the calling function can handle it and show UI feedback.
    throw new Error('Failed to create or verify user profile in the database.');
  }
};
