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

    // Get all challenges of the specified type FOR TODAY.
    const challengesQuery = query(
      collection(firestore, 'challenges'),
      where('type', '==', challengeType),
      where('date', '==', todayStr) // This is the crucial fix
    );
    const progressSnap = await getDoc(progressDocRef);
    const progressData = progressSnap.data();

    const challengesSnap = await getDocs(challengesQuery);

    // We must ensure the progress document exists before we can update it with increments.
    // If it doesn't exist, we initialize it.
    if (!progressSnap.exists()) {
      batch.set(progressDocRef, { date: todayStr, progress: {} }, { merge: true });
    }

    challengesSnap.forEach((challengeDoc) => {
      const challenge = { ...challengeDoc.data(), id: challengeDoc.id } as DailyChallenge;
      const isClaimed = progressData?.progress?.[challenge.id]?.claimed ?? false;

      // Only increment progress for challenges that haven't been claimed yet.
      if (!isClaimed) {
        const progressUpdate = {
          [`progress.${challenge.id}.currentValue`]: increment(amount),
        };
        // Use update here since we've ensured the doc exists
        batch.update(progressDocRef, progressUpdate);
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
