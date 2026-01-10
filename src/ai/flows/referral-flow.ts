
'use server';

/**
 * @fileOverview A flow for handling referral code application.
 *
 * - applyReferralCode - A function that handles the referral logic.
 * - ReferralInput - The input type for the applyReferralCode function.
 * - ReferralOutput - The return type for the applyReferralCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, query, collection, where, getDocs, writeBatch, doc, increment } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { isFuture } from 'date-fns';

const ReferralInputSchema = z.object({
  newUserUid: z.string().describe('The UID of the new user signing up.'),
  referralCode: z.string().describe('The referral code entered by the new user.'),
});
export type ReferralInput = z.infer<typeof ReferralInputSchema>;

const ReferralOutputSchema = z.object({
  success: z.boolean().describe('Whether the referral was applied successfully.'),
  message: z.string().describe('A message describing the result.'),
});
export type ReferralOutput = z.infer<typeof ReferralOutputSchema>;

export async function applyReferralCode(input: ReferralInput): Promise<ReferralOutput> {
  return applyReferralCodeFlow(input);
}

const applyReferralCodeFlow = ai.defineFlow(
  {
    name: 'applyReferralCodeFlow',
    inputSchema: ReferralInputSchema,
    outputSchema: ReferralOutputSchema,
  },
  async ({ newUserUid, referralCode }) => {
    // We need to initialize firebase on the server
    const { firestore } = initializeFirebase();

    // Find the user with the given referral code
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Invalid referral code.' };
    }

    if (querySnapshot.size > 1) {
        console.warn(`Multiple users found with the same referral code: ${referralCode}`);
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerUid = referrerDoc.id;
    const referrerProfile = referrerDoc.data();

    if (referrerUid === newUserUid) {
      return { success: false, message: 'You cannot refer yourself.' };
    }
    
    const referrerUserRef = doc(firestore, 'users', referrerUid);

    const batch = writeBatch(firestore);

    const isVip = referrerProfile.vipExpiresAt && isFuture(referrerProfile.vipExpiresAt.toDate());
    const multiplier = isVip ? 2 : 1;
    const referralBonus = 100 * multiplier;

    // Award bonus coins to the referrer and increment their referral count
    batch.update(referrerUserRef, {
      coins: increment(referralBonus),
      weeklyCoins: increment(referralBonus),
      referralCount: increment(1),
    });

    try {
      await batch.commit();
      return { success: true, message: 'Referral successful! The referrer has been rewarded.' };
    } catch (error) {
      console.error("Error committing referral batch:", error);
      return { success: false, message: 'An error occurred while applying the referral.' };
    }
  }
);
