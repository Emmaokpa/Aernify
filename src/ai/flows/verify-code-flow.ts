
'use server';
/**
 * @fileOverview A flow for verifying a 6-digit code and activating a user account.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, getFirestore } from 'firebase/firestore';
import { ensureUserProfile } from '@/lib/auth-utils';
import { isPast } from 'date-fns';
import { initializeFirebase } from '@/firebase';

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
    const { firestore } = initializeFirebase(); // Use client SDK firestore instance

    try {
      // 1. Find the most recent verification code document for the user
      const verificationCollectionRef = collection(firestore, `users/${uid}/verification`);
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
      await ensureUserProfile(firestore, userRecord, verificationData.referralCode);

      // 6. Delete the used verification code document
      await deleteDoc(verificationDoc.ref);

      return { success: true, message: 'Email verified successfully!' };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      return { success: false, message: error.message || 'An unexpected server error occurred.' };
    }
  }
);
