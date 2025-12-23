
'use client';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import type { UserProfile } from './types';
import { applyReferralCode } from '@/ai/flows/referral-flow';

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Ensures a user profile exists in Firestore and applies a referral code if provided.
 * If the document does not exist, it creates a new profile with initial data.
 * @param firestore - The Firestore instance.
 * @param user - The newly created and authenticated Firebase Auth user object.
 * @param referralCode - An optional referral code provided during signup.
 */
export const ensureUserProfile = async (firestore: Firestore, user: User, referralCode?: string) => {
  if (!user.uid) {
    throw new Error('User object is missing UID.');
  }
  
  const userRef = doc(firestore, 'users', user.uid);
  
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Define the data for the new user profile
      const initialProfileData = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        coins: 100, // Start with 100 coins
        weeklyCoins: 100,
        referralCode: generateReferralCode(),
        referralCount: 0,
        isAdmin: false,
        currentStreak: 0,
        lastLoginDate: null,
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, initialProfileData);
      console.log(`Successfully created profile for new user: ${user.uid}`);
      
      // If a referral code was used, apply it now after the user profile is created.
      if (referralCode) {
        console.log(`Applying referral code "${referralCode}" for user ${user.uid}`);
        // We run this without awaiting it to avoid blocking the UI thread.
        // The server-side flow will handle the logic.
        applyReferralCode({ newUserUid: user.uid, referralCode: referralCode })
          .then(result => {
            if(result.success) {
              console.log('Referral applied successfully.');
            } else {
              console.warn(`Failed to apply referral code: ${result.message}`);
            }
          })
          .catch(error => {
            console.error('Error calling applyReferralCode flow:', error);
          });
      }
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    // Re-throw a more specific error for the UI to catch if needed
    throw new Error('Failed to create or verify user profile in the database.');
  }
};
