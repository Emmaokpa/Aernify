
'use server';
/**
 * @fileOverview A flow for verifying a 6-digit code and activating a user account.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, setDoc, writeBatch, where, increment, getDoc as getClientDoc } from 'firebase/firestore';
import { ensureUserProfile } from '@/lib/auth-utils';
import { isPast, isFuture } from 'date-fns';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';


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
    const { firestore: clientFirestore } = initializeFirebase(); // Use client SDK for all DB operations

    try {
      // 1. Find the most recent verification code document for the user (using client SDK)
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

      // --- At this point, the code is valid ---
      
      const batch = writeBatch(clientFirestore);

      // 4. Ensure the user profile exists in Firestore (this is where it gets created)
      const userRecord = await adminAuth.getUser(uid);
      await ensureUserProfile(clientFirestore, userRecord);

      // 5. Apply referral if it exists, using the client SDK within the same flow
      if (verificationData.referralCode) {
        const usersRef = collection(clientFirestore, 'users');
        const referralQuery = query(usersRef, where('referralCode', '==', verificationData.referralCode.toUpperCase()));
        const snapshot = await getDocs(referralQuery);

        if (!snapshot.empty) {
            const referrerDoc = snapshot.docs[0];
            const referrerUid = referrerDoc.id;
            
            if(referrerUid !== uid) {
                const referrerProfile = referrerDoc.data() as UserProfile;
                const isVip = referrerProfile.vipExpiresAt && isFuture(referrerProfile.vipExpiresAt.toDate());
                const multiplier = isVip ? 2 : 1;
                const referralBonus = 100 * multiplier;

                batch.update(referrerDoc.ref, {
                    coins: increment(referralBonus),
                    weeklyCoins: increment(referralBonus),
                    referralCount: increment(1),
                });
            }
        }
      }

      // 6. Delete the used verification code document (using client SDK)
      batch.delete(verificationDoc.ref);
      
      // 7. Commit all database changes
      await batch.commit();

      // 8. Finally, mark the user as verified in Firebase Auth (using Admin SDK)
      await adminAuth.updateUser(uid, {
        emailVerified: true,
      });

      return { success: true, message: 'Email verified successfully!' };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      return { success: false, message: error.message || 'An unexpected server error occurred.' };
    }
  }
);
