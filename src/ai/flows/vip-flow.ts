'use server';
/**
 * @fileOverview A flow for handling VIP subscription payments.
 *
 * - generateDva - Creates a Dedicated Virtual Account for a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { createDedicatedAccount } from '@/lib/paystack';
import type { UserProfile } from '@/lib/types';

const DvaInputSchema = z.object({
  userId: z.string().describe('The UID of the user requesting the DVA.'),
});

const DvaOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
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
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, message: 'User not found.' };
      }

      const userProfile = userSnap.data() as UserProfile;

      // Call the Paystack service to create the DVA
      const dva = await createDedicatedAccount(userProfile);

      // Return the account details to the client instead of writing here.
      return {
        success: true,
        message: 'Dedicated account created successfully.',
        bankName: dva.bankName,
        accountNumber: dva.accountNumber,
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
