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

  // We need to find all challenges of the given type
  // This would ideally be cached, but for now we'll fetch it.
  // In a real app, you'd pass the challenges down or use a context.
  
  // For simplicity, we can't query here. We will assume the challenge ID is the same as the type for incrementing.
  // This is a limitation. A better way would be to get the challenge doc.
  // Let's find a way to pass the challenge ID.

  // The logic becomes complex without knowing the challenge IDs.
  // Let's simplify: we will update a field named after the `challengeType`.
  // e.g., progress.playGame.currentValue
  
  // This is not ideal as we have multiple challenges of the same type.
  // Let's rethink.

  // The user action (e.g., playing a game) needs to update all relevant challenges.
  // When a user plays a game, we increment a general counter for `gamesPlayed`.
  // The challenges page will then evaluate this counter against challenge targets.

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
    batch.update(userRef, { coins: increment(challenge.reward) });

    // 2. Mark challenge as claimed for the day
    const progressDocRef = getProgressDocRef(firestore, userId);
    const progressUpdate = {
        [`progress.${challenge.id}.claimed`]: true,
    };
    batch.update(progressDocRef, progressUpdate);

    await batch.commit();
};
