'use client';
import {
  doc,
  getDoc,
  increment,
  writeBatch,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { DailyChallenge } from './types';
import { getTodayString } from './utils';

// Helper function to create or get the daily progress document reference
const getProgressDocRef = (firestore: Firestore, userId: string) => {
  const todayStr = getTodayString();
  const progressDocId = `${userId}_${todayStr}`;
  return doc(firestore, 'user_challenge_progress', progressDocId);
};

export const incrementChallengeProgress = async (
  firestore: Firestore,
  userId: string,
  challengeType: DailyChallenge['type'],
  amount = 1
) => {
  const progressDocRef = getProgressDocRef(firestore, userId);
  const todayStr = getTodayString();

  try {
    const batch = writeBatch(firestore);

    // 1. Get ALL challenges for today.
    const allTodayChallengesQuery = query(
      collection(firestore, 'challenges'),
      where('date', '==', todayStr)
    );
    const challengesSnap = await getDocs(allTodayChallengesQuery);

    if (challengesSnap.empty) {
      return; // No challenges for today, nothing to do.
    }

    // 2. Ensure the user's progress document for today exists.
    const progressSnap = await getDoc(progressDocRef);
    if (!progressSnap.exists()) {
      batch.set(progressDocRef, { date: todayStr, progress: {} });
    }
    const progressData = progressSnap.data();

    // 3. Iterate through today's challenges and update only the ones that match the type.
    challengesSnap.forEach((challengeDoc) => {
      const challenge = { ...challengeDoc.data(), id: challengeDoc.id } as DailyChallenge;

      // Check if the challenge type matches the one we want to increment.
      if (challenge.type === challengeType) {
        const isClaimed = progressData?.progress?.[challenge.id]?.claimed ?? false;

        // Only increment progress for challenges that haven't been claimed yet.
        if (!isClaimed) {
          const progressUpdate = {
            [`progress.${challenge.id}.currentValue`]: increment(amount),
          };
          // Use update, assuming the doc exists or was just created in the batch.
          batch.update(progressDocRef, progressUpdate);
        }
      }
    });

    await batch.commit();
  } catch (error) {
    console.error(`Failed to increment challenge progress for ${challengeType}:`, error);
  }
};


export const claimChallengeReward = async (
  firestore: Firestore,
  userId: string,
  challenge: DailyChallenge,
) => {
    const batch = writeBatch(firestore);

    // 1. Update user's coins
    const userRef = doc(firestore, 'users', userId);
    batch.update(userRef, {
      coins: increment(challenge.reward),
      weeklyCoins: increment(challenge.reward)
    });

    // 2. Mark challenge as claimed for the day
    const progressDocRef = getProgressDocRef(firestore, userId);
    const progressUpdate = {
        [`progress.${challenge.id}.claimed`]: true,
    };
    // Use update, assuming the progress doc must exist to claim.
    batch.update(progressDocRef, progressUpdate);

    await batch.commit();
};
