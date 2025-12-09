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
        // This should ideally not happen if codes are unique
        console.warn(`Multiple users found with the same referral code: ${referralCode}`);
        // We will proceed with the first one found
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerUid = referrerDoc.id;

    if (referrerUid === newUserUid) {
      return { success: false, message: 'You cannot refer yourself.' };
    }
    
    const referrerUserRef = doc(firestore, 'users', referrerUid);

    const batch = writeBatch(firestore);

    const referralBonus = 100;

    // Award 100 coins to the referrer
    batch.update(referrerUserRef, {
      coins: increment(referralBonus),
    });
    
    // We will add coins to the new user on the client-side after this flow returns success.
    // So we don't need to update the new user's doc here.

    try {
      await batch.commit();
      return { success: true, message: 'Referral successful! Both users have been rewarded.' };
    } catch (error) {
      console.error("Error committing referral batch:", error);
      // In a real-world scenario, you'd want more robust error handling/logging
      return { success: false, message: 'An error occurred while applying the referral.' };
    }
  }
);
