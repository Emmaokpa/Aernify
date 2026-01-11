
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from './types';
import { initializeFirebase } from '@/firebase';

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * This function is now ONLY for client-side social logins.
 * Email/password signup is handled by the /api/verify-code route.
 * @param user - The newly created and authenticated Firebase Auth user object.
 */
export const ensureUserProfile = async (user: User) => {
  const { firestore } = initializeFirebase();
  if (!user.uid) {
    throw new Error('User object is missing UID.');
  }
  
  const userRef = doc(firestore, 'users', user.uid);
  
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const initialProfileData: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        coins: 0,
        weeklyCoins: 0,
        referralCode: generateReferralCode(),
        referralCount: 0,
        isAdmin: false,
        currentStreak: 0,
        lastLoginDate: '',
        isVip: false,
        vipExpiresAt: undefined,
      };

      await setDoc(userRef, initialProfileData);
      console.log(`Successfully created profile for new social login user: ${user.uid}`);
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    throw new Error('Failed to create or verify user profile in the database.');
  }
};
