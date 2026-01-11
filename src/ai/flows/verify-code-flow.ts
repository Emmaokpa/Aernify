
'use server';

/**
 * @fileOverview A flow for verifying a 6-digit code and activating a user account.
 * This flow now exclusively uses the Firebase Admin SDK to prevent build issues.
 */
export const runtime = 'nodejs'; // Force Node.js runtime

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Use the new admin singleton
import { applyReferralCodeAdmin } from '@/lib/auth-utils';
import { isPast } from 'date-fns';
import { UserProfile } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

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


// Helper to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};


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
    try {
      // 1. Find the most recent verification code document for the user using Admin SDK
      const verificationCollectionRef = adminDb.collection(`users/${uid}/verification`);
      const q = verificationCollectionRef.orderBy('createdAt', 'desc').limit(1);
      const querySnapshot = await q.get();

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
      const userRecord = await adminAuth.getUser(uid);

      // 4. Create or Update the user profile in Firestore using the Admin SDK's "upsert" capability
      const userRef = adminDb.doc(`users/${uid}`);
      const initialProfileData: Omit<UserProfile, 'uid'> = {
        displayName: userRecord.displayName || 'New User',
        email: userRecord.email || '',
        photoURL: userRecord.photoURL || null,
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

      // Use set with { merge: true } to create if not exists, or merge if it does.
      // This is a robust "upsert" operation.
      await userRef.set(initialProfileData, { merge: true });

      // 5. Apply referral code if it exists
      const referralCode = verificationData.referralCode;
      if (referralCode) {
        await applyReferralCodeAdmin(uid, referralCode);
      }
      
      // 6. Delete the used verification code document
      await verificationDoc.ref.delete();
      
      // 7. Finally, mark the user as verified in Firebase Auth
      await adminAuth.updateUser(uid, {
        emailVerified: true,
      });

      return { success: true, message: 'Email verified successfully!' };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      // Pass a more specific error message back if available.
      return { success: false, message: error.message || 'An unexpected server error occurred.' };
    }
  }
);
