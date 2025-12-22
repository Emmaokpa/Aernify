'use server';
/**
 * @fileOverview A flow for handling VIP subscription payments.
 *
 * - generateDva - Creates a Dedicated Virtual Account for a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { createDedicatedAccount } from '@/lib/paystack';
import type { UserProfile } from '@/lib/types';

const DvaInputSchema = z.object({
  userId: z.string().describe('The UID of the user requesting the DVA.'),
});

const DvaOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function generateDva(input: z.infer<typeof DvaInputSchema>): Promise<z.infer<typeof DvaOutputSchema>> {
  return generateDvaFlow(input);
}

const generateDvaFlow = ai.defineFlow(
  {
    name: 'generateDvaFlow',
    inputSchema: DvaInputSchema,
    outputSchema: DvaOutputSchema,
  },
  async ({ userId }) => {
    const { firestore } = initializeFirebase();
    try {
      const userRef = doc(firestore, 'users', userId);
      // We need to get the user's profile to get their email for Paystack
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, message: 'User not found.' };
      }

      const userProfile = userSnap.data() as UserProfile;

      // Call the Paystack service to create the DVA
      const dva = await createDedicatedAccount(userProfile);

      // Write the new DVA details back to the user's document
      await updateDoc(userRef, {
        dvaBankName: dva.bankName,
        dvaAccountNumber: dva.accountNumber,
      });

      return {
        success: true,
        message: 'Dedicated account created successfully.',
      };
    } catch (error: any) {
      console.error('Error in generateDvaFlow:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while creating the payment account.',
      };
    }
  }
);
