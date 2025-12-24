
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
  setDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { DailyChallenge, UserChallengeProgress } from './types';
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
    // 1. Get ALL of today's challenges from the `challenges` collection.
    const challengesQuery = query(
      collection(firestore, 'challenges'),
      where('date', '==', todayStr)
    );
    const challengesSnap = await getDocs(challengesQuery);

    if (challengesSnap.empty) {
      return; // No challenges for today, nothing to do.
    }

    // 2. Get the user's current progress document for today.
    const progressSnap = await getDoc(progressDocRef);
    const progressData: UserChallengeProgress = (progressSnap.data() as UserChallengeProgress) || {
      date: todayStr,
      progress: {},
    };

    let wasUpdated = false;

    // 3. Iterate through today's challenges and update the progress object in memory.
    challengesSnap.forEach((challengeDoc) => {
      const challenge = { ...challengeDoc.data(), id: challengeDoc.id } as DailyChallenge;

      // Check if the challenge type matches the one we want to increment.
      if (challenge.type === challengeType) {
        const isClaimed = progressData.progress?.[challenge.id]?.claimed ?? false;
        
        // Only increment progress for challenges that haven't been claimed yet.
        if (!isClaimed) {
          const currentValue = progressData.progress?.[challenge.id]?.currentValue ?? 0;
          
          if (!progressData.progress[challenge.id]) {
            progressData.progress[challenge.id] = { currentValue: 0, claimed: false };
          }
          
          progressData.progress[challenge.id].currentValue = currentValue + amount;
          wasUpdated = true;
        }
      }
    });

    // 4. If any progress was updated, write the entire new progress object back to Firestore.
    if (wasUpdated) {
      await setDoc(progressDocRef, progressData, { merge: true });
    }

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
