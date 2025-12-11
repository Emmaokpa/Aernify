'use server';
/**
 * @fileOverview A flow for managing the weekly leaderboard.
 *
 * - resetWeeklyLeaderboard - A function that resets all users' weeklyCoins to 0.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  query,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const ResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  usersAffected: z.number(),
});

export async function resetWeeklyLeaderboard(): Promise<
  z.infer<typeof ResetOutputSchema>
> {
  return resetWeeklyLeaderboardFlow();
}

const resetWeeklyLeaderboardFlow = ai.defineFlow(
  {
    name: 'resetWeeklyLeaderboardFlow',
    outputSchema: ResetOutputSchema,
  },
  async () => {
    const { firestore } = initializeFirebase();

    try {
      const usersRef = collection(firestore, 'users');
      // Query for all users to reset them.
      // In a very large-scale app, this would be done in smaller batches.
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: true,
          message: 'No users found to reset.',
          usersAffected: 0,
        };
      }

      // Use a write batch to update all users in a single atomic operation.
      const batch = writeBatch(firestore);
      let usersAffected = 0;

      querySnapshot.forEach((userDoc) => {
        const userRef = doc(firestore, 'users', userDoc.id);
        batch.update(userRef, { weeklyCoins: 0 });
        usersAffected++;
      });

      await batch.commit();

      return {
        success: true,
        message: `Successfully reset weekly coins for ${usersAffected} users.`,
        usersAffected,
      };
    } catch (error: any) {
      console.error('Error resetting weekly leaderboard:', error);
      return {
        success: false,
        message:
          error.message || 'An unexpected error occurred during the reset.',
        usersAffected: 0,
      };
    }
  }
);

    