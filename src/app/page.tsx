'use client';

import { useState, useEffect, useMemo } from 'react';
import DailyLoginModal from '@/components/daily-login-modal';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Game } from '@/lib/types';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { incrementChallengeProgress } from '@/lib/challenges';
import { getTodayString } from '@/lib/utils';
import { differenceInCalendarDays } from 'date-fns';

const DAILY_REWARD = 20;
const STREAK_REWARDS = {
  7: 150,
  30: 1000,
};

export default function DashboardPage() {
  const [modalState, setModalState] = useState({ isOpen: false, reward: 0, bonus: 0, streak: 0 });
  
  const firestore = useFirestore();
  const { user, profile, isUserLoading } = useUser();

  const gamesCollection = useMemo(() => {
    if (!firestore || !user) return null; // Wait for user
    return collection(firestore, 'games');
  }, [firestore, user]);

  const { data: games, isLoading: isGamesLoading } = useCollection<Game>(gamesCollection);

  useEffect(() => {
    if (isUserLoading || !user) {
      return;
    }

    const checkDailyLogin = async () => {
      // Manually fetch the latest profile inside the effect to avoid dependency loop
      const userDocRefForRead = doc(firestore, 'users', user.uid);
      const profileSnap = await getDoc(userDocRefForRead);
      if (!profileSnap.exists()) return;
      const currentProfile = profileSnap.data();


      const todayStr = getTodayString();
      const dailyLoginDocRef = doc(firestore, 'daily_logins', `${user.uid}_${todayStr}`);
      
      try {
        const docSnap = await getDoc(dailyLoginDocRef);

        if (!docSnap.exists()) {
          const userDocRef = doc(firestore, 'users', user.uid);
          const batch = writeBatch(firestore);

          let totalReward = DAILY_REWARD;
          let streakBonus = 0;
          let newStreak = 1;
          
          const lastLoginDate = currentProfile.lastLoginDate;
          const today = new Date(todayStr);

          if (lastLoginDate) {
              const lastLogin = new Date(lastLoginDate);
              const daysDiff = differenceInCalendarDays(today, lastLogin);

              if (daysDiff === 1) {
                  // Streak continues
                  newStreak = (currentProfile.currentStreak || 0) + 1;
              } else if (daysDiff > 1) {
                  // Streak broken
                  newStreak = 1;
              } else {
                  // Already logged in today, but something went wrong. Let's be safe.
                  newStreak = currentProfile.currentStreak || 1;
                  return; // Exit if already logged in today
              }
          }

          // Check for streak milestone rewards
          if (newStreak in STREAK_REWARDS) {
            streakBonus = STREAK_REWARDS[newStreak as keyof typeof STREAK_REWARDS];
            totalReward += streakBonus;
          }

          // Update user's profile
          batch.update(userDocRef, { 
            coins: increment(totalReward),
            weeklyCoins: increment(totalReward),
            currentStreak: newStreak,
            lastLoginDate: todayStr
          });

          // Mark daily login as claimed
          batch.set(dailyLoginDocRef, { claimedAt: serverTimestamp() });
          
          await batch.commit();

          // Also update challenge progress for daily check-in
          await incrementChallengeProgress(firestore, user.uid, 'dailyCheckIn');
          
          setModalState({ isOpen: true, reward: DAILY_REWARD, bonus: streakBonus, streak: newStreak });
        }
      } catch (error) {
        console.error("Error checking or granting daily reward:", error);
      }
    };

    // Check after a short delay to not be too intrusive
    const timer = setTimeout(checkDailyLogin, 1500);
    return () => clearTimeout(timer);

  }, [user, isUserLoading, firestore]);

  const heroGame = games?.[0];
  const isLoading = isGamesLoading || isUserLoading;

  return (
    <>
      <div className="grid gap-8">
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden group">
          {isLoading && <Skeleton className="absolute inset-0" />}
          {heroGame && (
            <>
              {heroGame.imageUrl ? (
                <Image
                  src={heroGame.imageUrl}
                  alt={heroGame.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <Link href={`/play/${heroGame.id}`}>
                  <Button size="lg" className="text-lg">
                    Play Now <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Popular Games
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))}
            {games?.map((game) => (
              <Link href={`/play/${game.id}`} key={game.id}>
                <Card className="overflow-hidden aspect-[3/4] relative group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 rounded-2xl">
                  {game.imageUrl ? (
                     <Image
                        src={game.imageUrl}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                      />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                     <h3 className='font-bold text-white'>{game.title}</h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <DailyLoginModal 
        isOpen={modalState.isOpen} 
        onOpenChange={(isOpen) => setModalState(prev => ({...prev, isOpen}))} 
        reward={modalState.reward}
        bonus={modalState.bonus}
        streak={modalState.streak}
       />
    </>
  );
}
