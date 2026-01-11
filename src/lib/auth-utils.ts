
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, collection, query, where, getDocs, increment, Firestore, FieldValue } from 'firebase/firestore';
import type { UserProfile } from './types';
import { initializeFirebase } from '@/firebase';
import { isFuture } from 'date-fns';
import { adminDb } from './firebase-admin'; // Use the admin SDK for this server-side utility


// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Applies a referral code, rewarding the referrer.
 * This is a server-only function that uses the Admin SDK.
 * @param newUserUid The UID of the new user who used the code.
 * @param referralCode The referral code they entered.
 */
export const applyReferralCodeAdmin = async (newUserUid: string, referralCode: string) => {
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('referralCode', '==', referralCode.toUpperCase());
    
    try {
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            console.warn(`Referral code ${referralCode} not found.`);
            return { success: false, message: 'Invalid referral code.' };
        }

        const referrerDoc = querySnapshot.docs[0];
        const referrerUid = referrerDoc.id;
        const referrerProfile = referrerDoc.data() as UserProfile;

        if (referrerUid === newUserUid) {
            console.warn(`User ${newUserUid} attempted to refer themselves.`);
            return { success: false, message: 'You cannot refer yourself.' };
        }
        
        const referrerUserRef = adminDb.doc(`users/${referrerUid}`);

        const isVip = referrerProfile.vipExpiresAt && isFuture(referrerProfile.vipExpiresAt.toDate());
        const multiplier = isVip ? 2 : 1;
        const referralBonus = 100 * multiplier;

        // Use Admin SDK's FieldValue to increment atomically
        await referrerUserRef.update({
            coins: FieldValue.increment(referralBonus),
            weeklyCoins: FieldValue.increment(referralBonus),
            referralCount: FieldValue.increment(1),
        });

        return { success: true, message: 'Referral successful!' };
    } catch (error) {
        console.error("Error applying referral code with Admin SDK:", error);
        return { success: false, message: 'An error occurred while applying the referral.' };
    }
}


/**
 * Ensures a user profile exists in Firestore.
 * This function is now only safe to be called by social logins on the client, as email/pass
 * user creation is handled entirely by the `verify-code-flow`.
 * @param user - The newly created and authenticated Firebase Auth user object.
 */
export const ensureUserProfile = async (user: User) => {
  const { firestore } = initializeFirebase(); // Using client SDK
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
