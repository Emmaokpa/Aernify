import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, writeBatch, increment, getDocs } from 'firebase/firestore';
import type { UserProfile } from './types';
import { initializeFirebase } from '@/firebase';
import { isFuture } from 'date-fns';

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Ensures a user profile document exists in Firestore.
 * If it doesn't, it creates one with initial data.
 * @param user - The Firebase Auth user object.
 * @param referralCode - Optional referral code provided during signup.
 */
export const ensureUserProfile = async (user: User, referralCode?: string) => {
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
      console.log(`Successfully created profile for new user: ${user.uid}`);
      
      // If a referral code was provided during signup, apply it now.
      if (referralCode) {
        await applyReferralCode(user.uid, referralCode);
      }
    }
  } catch (error) {
    console.error(`Error ensuring user profile for ${user.uid}:`, error);
    throw new Error('Failed to create or verify user profile in the database.');
  }
};


/**
 * Applies a referral code, giving a bonus to the referrer.
 * This is a client-side function intended to be called after a new user is created.
 * @param newUserUid The UID of the new user who used the code.
 * @param referralCode The referral code they entered.
 */
async function applyReferralCode(newUserUid: string, referralCode: string) {
    const { firestore } = initializeFirebase();
    try {
        const q = query(
            collection(firestore, 'users'),
            where('referralCode', '==', referralCode.toUpperCase())
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Referral code ${referralCode} not found.`);
            return;
        }

        const batch = writeBatch(firestore);

        for (const referrerDoc of querySnapshot.docs) {
            const referrerUid = referrerDoc.id;
            // Prevent users from referring themselves
            if (referrerUid === newUserUid) continue;

            const referrerProfile = referrerDoc.data() as UserProfile;
            const isVip = referrerProfile.vipExpiresAt && isFuture(referrerProfile.vipExpiresAt.toDate());
            const multiplier = isVip ? 2 : 1;
            const referralBonus = 100 * multiplier;

            batch.update(referrerDoc.ref, {
                coins: increment(referralBonus),
                weeklyCoins: increment(referralBonus),
                referralCount: increment(1)
            });
            
            console.log(`Applied referral bonus of ${referralBonus} to ${referrerUid}.`);
        }

        await batch.commit();

    } catch (error) {
        console.error("Error applying referral code:", error);
    }
}
