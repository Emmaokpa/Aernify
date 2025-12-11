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

const ReferralInputSchema = z.object({
  newUserUid: z.string().describe('The UID of the new user signing up.'),
  referralCode: z.string().describe('The referral code entered by the new user.'),
});
export type ReferralInput = z.infer<typeof ReferralInputSchema>;

const ReferralOutputSchema = z.object({
  success: z.boolean().describe('Whether the referral was applied successfully.'),
  message: z.string().describe('A message describing the result.'),
  bonusAwarded: z.boolean().describe('Whether the new user received a bonus for using the code.')
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
      return { success: false, message: 'Invalid referral code.', bonusAwarded: false };
    }

    if (querySnapshot.size > 1) {
        console.warn(`Multiple users found with the same referral code: ${referralCode}`);
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerUid = referrerDoc.id;

    if (referrerUid === newUserUid) {
      return { success: false, message: 'You cannot refer yourself.', bonusAwarded: false };
    }
    
    const referrerUserRef = doc(firestore, 'users', referrerUid);
    const newUserRef = doc(firestore, 'users', newUserUid);

    const batch = writeBatch(firestore);

    const referralBonus = 100;
    const newUserBonus = 50;

    // Award 100 coins to the referrer
    batch.update(referrerUserRef, {
      coins: increment(referralBonus),
      weeklyCoins: increment(referralBonus),
    });
    
    // Award 50 bonus coins to the new user for using a code
    batch.update(newUserRef, {
        coins: increment(newUserBonus),
        weeklyCoins: increment(newUserBonus),
    });

    try {
      await batch.commit();
      return { success: true, message: 'Referral successful! Both users have been rewarded.', bonusAwarded: true };
    } catch (error) {
      console.error("Error committing referral batch:", error);
      return { success: false, message: 'An error occurred while applying the referral.', bonusAwarded: false };
    }
  }
);

    