
'use server';
/**
 * @fileOverview Flows for managing the weekly leaderboard.
 *
 * - resetWeeklyLeaderboard: Resets all users' weeklyCoins to 0.
 * - updateLeaderboard: Updates the public /leaderboard collection with the top users.
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
  limit,
  orderBy,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, LeaderboardEntry } from '@/lib/types';

// Schema for the reset flow output
const ResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  usersAffected: z.number(),
});

// Schema for the update flow output
const UpdateOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  usersUpdated: z.number(),
});

/**
 * Public function to trigger the leaderboard reset flow.
 */
export async function resetWeeklyLeaderboard(): Promise<
  z.infer<typeof ResetOutputSchema>
> {
  return resetWeeklyLeaderboardFlow();
}

/**
 * Public function to trigger the public leaderboard update flow.
 */
export async function updateLeaderboard(): Promise<
  z.infer<typeof UpdateOutputSchema>
> {
  return updateLeaderboardFlow();
}

/**
 * Flow to reset the `weeklyCoins` of all users to 0.
 */
const resetWeeklyLeaderboardFlow = ai.defineFlow(
  {
    name: 'resetWeeklyLeaderboardFlow',
    outputSchema: ResetOutputSchema,
  },
  async () => {
    const { firestore } = initializeFirebase();

    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: true,
          message: 'No users found to reset.',
          usersAffected: 0,
        };
      }

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

/**
 * Flow to update the public `/leaderboard` collection with the top 50 users
 * based on `weeklyCoins`.
 */
const updateLeaderboardFlow = ai.defineFlow(
  {
    name: 'updateLeaderboardFlow',
    outputSchema: UpdateOutputSchema,
  },
  async () => {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    try {
      // 1. Get the top 50 users from the private /users collection
      const usersQuery = query(
        collection(firestore, 'users'),
        orderBy('weeklyCoins', 'desc'),
        limit(50)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        // If there are no users, we might still want to clear the old leaderboard.
        // This part can be extended to delete all documents in /leaderboard.
        // For now, we just report success with 0 users.
        return { success: true, message: 'No users found to update.', usersUpdated: 0 };
      }
      
      // 2. Clear the existing leaderboard collection (optional, but good for cleanup)
      const leaderboardCollectionRef = collection(firestore, 'leaderboard');
      const oldLeaderboardSnap = await getDocs(leaderboardCollectionRef);
      oldLeaderboardSnap.forEach(doc => batch.delete(doc.ref));

      // 3. Create new documents in the public /leaderboard collection
      let rank = 1;
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data() as UserProfile;
        const leaderboardDocRef = doc(firestore, 'leaderboard', userDoc.id);

        const leaderboardEntry: LeaderboardEntry = {
          rank: rank++,
          score: userData.weeklyCoins,
          user: {
            id: userData.uid,
            name: userData.displayName || 'Anonymous',
            avatarUrl: userData.photoURL || '',
            email: userData.email, // Include email, it will be secured by rules
          },
        };

        batch.set(leaderboardDocRef, leaderboardEntry);
      });

      await batch.commit();

      return {
        success: true,
        message: `Successfully updated public leaderboard with ${usersSnapshot.size} users.`,
        usersUpdated: usersSnapshot.size,
      };
    } catch (error: any) {
      console.error('Error updating public leaderboard:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during the update.',
        usersUpdated: 0,
      };
    }
  }
);
