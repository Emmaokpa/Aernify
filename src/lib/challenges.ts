'use client';
import {
  doc,
  increment,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { UserProfile, DailyChallenge, UserChallengeProgress } from './types';
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

  const batch = writeBatch(firestore);

  const progressUpdate = {
    [`progress.${challengeType}.currentValue`]: increment(amount),
    date: getTodayString(),
  };

  // Use set with merge to create the document if it doesn't exist, and update if it does.
  batch.set(progressDocRef, progressUpdate, { merge: true });

  try {
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
    batch.update(progressDocRef, progressUpdate);

    await batch.commit();
};

    