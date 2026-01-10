
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
  orderBy,
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
    // 1. Get ALL of today's challenges of the specific type, ordered by reward to tackle easier ones first.
    const challengesQuery = query(
      collection(firestore, 'challenges'),
      where('date', '==', todayStr),
      where('type', '==', challengeType),
      orderBy('reward', 'asc') // Process easier/lower-reward challenges first
    );
    const challengesSnap = await getDocs(challengesQuery);

    if (challengesSnap.empty) {
      return; // No challenges of this type for today.
    }

    // 2. Get the user's current progress document for today.
    const progressSnap = await getDoc(progressDocRef);
    const progressData: UserChallengeProgress = (progressSnap.data() as UserChallengeProgress) || {
      date: todayStr,
      progress: {},
    };

    let wasUpdated = false;
    
    // 3. Find the FIRST non-completed, non-claimed challenge of this type.
    for (const challengeDoc of challengesSnap.docs) {
      const challenge = { ...challengeDoc.data(), id: challengeDoc.id } as DailyChallenge;
      
      const challengeProgress = progressData.progress?.[challenge.id];
      const isClaimed = challengeProgress?.claimed ?? false;
      const currentValue = challengeProgress?.currentValue ?? 0;

      // If this challenge is not completed and not claimed, this is the one we update.
      if (currentValue < challenge.targetValue && !isClaimed) {
        
        // Ensure the progress object for this challenge exists
        if (!progressData.progress[challenge.id]) {
            progressData.progress[challenge.id] = { currentValue: 0, claimed: false };
        }
        
        // Increment the progress
        progressData.progress[challenge.id].currentValue = currentValue + amount;
        wasUpdated = true;
        
        // We found our target challenge and updated it, so we can stop looking.
        break; 
      }
    }


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
