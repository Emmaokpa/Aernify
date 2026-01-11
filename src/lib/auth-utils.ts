
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
 * This should ONLY be called AFTER an email is verified or for social logins.
 * @param firestore - The Firestore instance (can be client or admin).
 * @param user - The newly created and authenticated Firebase Auth user object.
 */
export const ensureUserProfile = async (firestore: Firestore, user: User) => {
  if (!user.uid) {
    throw new Error('User object is missing UID.');
  }
  
  const userRef = doc(firestore, 'users', user.uid);
  
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Define the data for the new user profile
      const initialProfileData: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        coins: 0, // Start with 0 coins
        weeklyCoins: 0,
        referralCode: generateReferralCode(),
        referralCount: 0,
        isAdmin: false,
        currentStreak: 0,
        lastLoginDate: '', // Set to empty string initially
        isVip: false,
        vipExpiresAt: undefined,
      };

      await setDoc(userRef, initialProfileData);
      console.log(`Successfully created profile for new user: ${user.uid}`);
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    // Re-throw the error so the calling flow knows something went wrong.
    throw new Error('Failed to create or verify user profile in the database.');
  }
};
