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
 * If the user exists, it updates their display name and photo URL.
 * If the user does not exist, it creates a new profile.
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth user object.
 */
export const ensureUserProfile = async (firestore: Firestore, user: User) => {
  const userRef = doc(firestore, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // User profile already exists, check for updates.
      const currentProfile = docSnap.data();
      const updates: Partial<UserProfile> = {};
      if (user.displayName && user.displayName !== currentProfile.displayName) {
        updates.displayName = user.displayName;
      }
      if (user.photoURL && user.photoURL !== currentProfile.photoURL) {
        updates.photoURL = user.photoURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
        console.log(`Successfully updated profile for user: ${user.uid}`);
      }
    } else {
      // Document does not exist, so create it with all initial data.
      const initialProfileData: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email || '',
        photoURL: user.photoURL,
        coins: 10, // Start with 10 coins
        weeklyCoins: 0,
        referralCode: generateReferralCode(),
        referralCount: 0,
        isAdmin: false,
        isVip: false,
        currentStreak: 0,
        lastLoginDate: "",
      };

      await setDoc(userRef, initialProfileData);

      console.log(`Successfully created and initialized profile for user: ${user.uid}`);
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    // Re-throw the error so the calling function can handle it and show UI feedback.
    throw new Error('Failed to create or verify user profile in the database.');
  }
};
