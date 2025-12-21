'use client';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import type { UserProfile } from './types';

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Ensures a user profile exists in Firestore after sign-in or sign-up.
 * Follows a two-step creation process to comply with security rules.
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth user object.
 */
export const ensureUserProfile = async (firestore: Firestore, user: User) => {
  const userRef = doc(firestore, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Document does not exist, so create it.
      
      // Step 1: Create the document with fields allowed by the 'create' rule.
      // Crucially, `coins` is omitted here.
      const initialProfileData = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email || '',
        photoURL: user.photoURL,
        weeklyCoins: 0,
        referralCode: generateReferralCode(),
        isAdmin: false,
        isVip: false,
        currentStreak: 0,
        lastLoginDate: "", // Must be an empty string to satisfy create rule
      };

      await setDoc(userRef, initialProfileData);

      // Step 2: Immediately update the new document to add the starting coins.
      // This is a separate 'update' operation, governed by different rules.
      await updateDoc(userRef, {
        coins: 10,
      });

      console.log(`Successfully created and initialized profile for user: ${user.uid}`);
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    // Re-throw the error so the calling function can handle it and show UI feedback.
    throw new Error('Failed to create or verify user profile in the database.');
  }
};
