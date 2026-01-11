
import { NextRequest, NextResponse } from 'next/server';
import {
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

export const runtime = 'nodejs';

async function resetWeeklyLeaderboard() {
  const { firestore } = initializeFirebase();
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef);
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { success: true, message: 'No users found to reset.', usersAffected: 0 };
  }

  const batch = writeBatch(firestore);
  let usersAffected = 0;
  querySnapshot.forEach((userDoc) => {
    const userRef = doc(firestore, 'users', userDoc.id);
    batch.update(userRef, { weeklyCoins: 0 });
    usersAffected++;
  });
  await batch.commit();

  return { success: true, message: `Successfully reset weekly coins for ${usersAffected} users.`, usersAffected };
}

async function updateLeaderboard() {
  const { firestore } = initializeFirebase();
  const batch = writeBatch(firestore);

  // 1. Get the top 50 users from the private /users collection
  const usersQuery = query(
    collection(firestore, 'users'),
    orderBy('weeklyCoins', 'desc'),
    limit(50)
  );
  const usersSnapshot = await getDocs(usersQuery);

  // 2. Clear the existing leaderboard collection
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
        email: userData.email,
      },
    };

    batch.set(leaderboardDocRef, leaderboardEntry);
  });

  await batch.commit();
  return { success: true, message: `Successfully updated public leaderboard with ${usersSnapshot.size} users.`, usersUpdated: usersSnapshot.size };
}


export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'reset') {
      const result = await resetWeeklyLeaderboard();
      // Also update public leaderboard after reset
      await updateLeaderboard();
      return NextResponse.json(result);
    }

    if (action === 'update') {
      const result = await updateLeaderboard();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
