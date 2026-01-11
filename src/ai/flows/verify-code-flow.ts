
'use server';
/**
 * @fileOverview A flow for verifying a 6-digit code and activating a user account.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, query as adminQuery, collection as adminCollection, where as adminWhere, getDocs as adminGetDocs, increment } from 'firebase-admin/firestore';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ensureUserProfile } from '@/lib/auth-utils';
import { isPast, isFuture } from 'date-fns';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';


/**
 * SERVER-ONLY ADMIN-SDK-BASED REFERRAL LOGIC
 * Applies referral bonus using the Firebase Admin SDK.
 * This is designed to be called from within another admin-context flow.
 * @param adminFirestore - An initialized Firebase Admin Firestore instance.
 * @param newUserUid - The UID of the new user.
 * @param referralCode - The referral code they used.
 */
const applyReferralCodeAdmin = async (adminFirestore: ReturnType<typeof getAdminFirestore>, newUserUid: string, referralCode: string) => {
  const usersRef = adminCollection(adminFirestore, 'users');
  const q = adminQuery(usersRef, adminWhere('referralCode', '==', referralCode.toUpperCase()));
  
  const querySnapshot = await adminGetDocs(q);

  if (querySnapshot.empty) {
    console.warn(`Admin: Invalid referral code "${referralCode}" used by new user ${newUserUid}.`);
    return;
  }

  const referrerDoc = querySnapshot.docs[0];
  const referrerUid = referrerDoc.id;
  const referrerProfile = referrerDoc.data() as UserProfile;

  if (referrerUid === newUserUid) {
    console.warn(`Admin: User ${newUserUid} tried to refer themselves.`);
    return;
  }
  
  const referrerUserRef = doc(adminFirestore, 'users', referrerUid);
  const batch = adminFirestore.batch();

  const isVip = referrerProfile.vipExpiresAt && isFuture(referrerProfile.vipExpiresAt.toDate());
  const multiplier = isVip ? 2 : 1;
  const referralBonus = 100 * multiplier;

  batch.update(referrerUserRef, {
    coins: increment(referralBonus),
    weeklyCoins: increment(referralBonus),
    referralCount: increment(1),
  });

  try {
    await batch.commit();
    console.log(`Admin: Successfully applied referral bonus to ${referrerUid}.`);
  } catch (error) {
    console.error("Admin: Error committing referral batch:", error);
  }
};


const VerifyCodeInputSchema = z.object({
  uid: z.string().describe('The UID of the user.'),
  code: z.string().length(6).describe('The 6-digit code submitted by the user.'),
});
export type VerifyCodeInput = z.infer<typeof VerifyCodeInputSchema>;

const VerifyCodeOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type VerifyCodeOutput = z.infer<typeof VerifyCodeOutputSchema>;

export async function verifyCode(input: VerifyCodeInput): Promise<VerifyCodeOutput> {
  return verifyCodeFlow(input);
}

const verifyCodeFlow = ai.defineFlow(
  {
    name: 'verifyCodeFlow',
    inputSchema: VerifyCodeInputSchema,
    outputSchema: VerifyCodeOutputSchema,
  },
  async ({ uid, code }) => {
    initializeAdminApp();
    const adminAuth = getAuth();
    const adminFirestore = getAdminFirestore();
    const { firestore: clientFirestore } = initializeFirebase(); // Use client SDK for reads from client context

    try {
      // 1. Find the most recent verification code document for the user (using client SDK for safe reads)
      const verificationCollectionRef = collection(clientFirestore, `users/${uid}/verification`);
      const q = query(verificationCollectionRef, orderBy('createdAt', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: 'Invalid or expired code. Please request a new one.' };
      }

      const verificationDoc = querySnapshot.docs[0];
      const verificationData = verificationDoc.data();

      // 2. Check if the code is expired
      if (isPast(verificationData.expiresAt.toDate())) {
        return { success: false, message: 'This code has expired. Please request a new one.' };
      }

      // 3. Check if the code matches
      if (verificationData.code !== code) {
        return { success: false, message: 'The code you entered is incorrect.' };
      }

      // 4. If code is valid, update the user's emailVerified status in Firebase Auth
      await adminAuth.updateUser(uid, {
        emailVerified: true,
      });
      
      // 5. Ensure the user profile exists in Firestore (this is where it gets created)
      const userRecord = await adminAuth.getUser(uid);
      
      // Pass the *admin* firestore instance to ensureUserProfile
      await ensureUserProfile(clientFirestore, userRecord);

      // 6. Apply referral if it exists, using the ADMIN SDK
      if (verificationData.referralCode) {
        await applyReferralCodeAdmin(adminFirestore, uid, verificationData.referralCode);
      }

      // 7. Delete the used verification code document (using admin SDK for guaranteed write)
      await adminFirestore.collection('users').doc(uid).collection('verification').doc(verificationDoc.id).delete();

      return { success: true, message: 'Email verified successfully!' };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      return { success: false, message: error.message || 'An unexpected server error occurred.' };
    }
  }
);
