'use client';

import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Coins, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry, UserProfile } from '@/lib/types';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';


const getTrophyColor = (rank: number) => {
  if (rank === 1) return 'text-amber-400 fill-amber-400';
  if (rank === 2) return 'text-slate-400 fill-slate-400';
  if (rank === 3) return 'text-orange-600 fill-orange-600';
  return 'text-muted-foreground';
};

const getTrophyCardClass = (rank: number) => {
  if (rank === 1) return 'bg-amber-400/10 border-amber-400/40 -translate-y-4';
  if (rank === 2) return 'bg-slate-400/10 border-slate-400/40';
  if (rank === 3) return 'bg-orange-600/10 border-orange-600/40';
  return '';
};

// --- Top Player Card Component ---
function TopPlayerCard({
  entry,
  isLoading,
}: {
  entry?: LeaderboardEntry;
  isLoading: boolean;
}) {
  if (isLoading || !entry) {
    return (
       <div className="flex flex-col items-center">
        <Skeleton className="h-10 w-8 mb-2" />
        <Card className="w-full text-center p-6">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-8 w-24 mx-auto" />
        </Card>
      </div>
    );
  }

  const { rank, score, user } = entry;
  const isFirst = rank === 1;

  return (
    <div
      className={cn(
        'flex flex-col items-center',
        isFirst && 'md:row-start-1 md:row-end-3',
        rank === 2 && 'md:row-start-2',
        rank === 3 && 'md:row-start-2'
      )}
    >
      <p className={cn('font-bold text-4xl mb-2', getTrophyColor(rank))}>
        #{rank}
      </p>
      <Card className={cn('w-full text-center p-6 relative overflow-visible', getTrophyCardClass(rank))}>
        {isFirst && (
          <div className={cn('absolute -top-6 left-1/2 -translate-x-1/2', getTrophyColor(1))}>
            <Crown className="w-12 h-12" />
          </div>
        )}
        <Avatar
          className={cn(
            'w-24 h-24 mx-auto mb-4 border-4',
            rank === 1 && 'border-amber-400',
            rank === 2 && 'border-slate-400',
            rank === 3 && 'border-orange-600',
          )}
        >
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name?.charAt(0) ?? '?'}</AvatarFallback>
        </Avatar>
        <p className="text-xl font-bold">{user.name}</p>
        <p className="text-2xl font-bold text-primary mt-2 flex items-center justify-center gap-2">
          <Coins className="w-6 h-6" /> {score.toLocaleString()}
        </p>
      </Card>
    </div>
  );
}


// --- List Item Component ---
function RankedUser({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const { rank, score, user } = entry;

  return (
     <div
      className={cn(
        'flex items-center p-3 rounded-lg transition-colors',
        isCurrentUser ? 'bg-primary/20 border-primary/40 border' : 'bg-card hover:bg-muted'
      )}
    >
      <div className="w-12 text-center text-lg font-bold text-muted-foreground">
        {rank ? `#${rank}` : '-'}
      </div>
      <Avatar className="w-10 h-10 mx-4">
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name?.charAt(0) ?? '?'}</AvatarFallback>
      </Avatar>
      <p className="font-semibold flex-grow">{user.name}</p>
      <div className="font-bold text-primary flex items-center gap-1.5">
        <Coins className="w-4 h-4" /> {score.toLocaleString()}
      </div>
    </div>
  );
}

// --- Main Leaderboard Page Component ---
export default function LeaderboardPage() {
    const firestore = useFirestore();
    const { user: currentUserAuth, profile: currentUserProfile, isUserLoading } = useUser();

    const leaderboardQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'), 
            orderBy('weeklyCoins', 'desc'), 
            limit(50)
        );
    }, [firestore]);

    const { data: users, isLoading: isCollectionLoading } = useCollection<UserProfile>(leaderboardQuery);

    const isLoading = isUserLoading || isCollectionLoading;

    const leaderboardData: LeaderboardEntry[] = useMemo(() => {
        if (!users) return [];
        return users.map((user, index) => ({
            rank: index + 1,
            score: user.weeklyCoins,
            user: {
                id: user.uid,
                name: user.displayName || 'Anonymous',
                avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
            }
        }));
    }, [users]);


  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  const isCurrentUserInTop50 = useMemo(() => {
    if (!currentUserAuth || !leaderboardData) return false;
    return leaderboardData.some(entry => entry.user.id === currentUserAuth.uid);
  }, [currentUserAuth, leaderboardData]);
  
  const currentUserEntryForDisplay: LeaderboardEntry | null = useMemo(() => {
    if (!currentUserProfile || !currentUserAuth) return null;
    return {
      rank: 0, // No rank shown
      score: currentUserProfile?.weeklyCoins ?? 0,
      user: {
        id: currentUserAuth.uid,
        name: currentUserProfile.displayName || 'Anonymous',
        avatarUrl: currentUserProfile.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${currentUserAuth.uid}`
      }
    };
  }, [currentUserProfile, currentUserAuth]);


  return (
    <>
      <PageHeader
        title="Weekly Leaderboard"
        description="See who's on top this week. Top players win weekly prizes!"
      />

      <Card className="mb-8 bg-primary/10 border-primary/20">
          <CardContent className='p-6 text-center'>
            <div className='max-w-md mx-auto'>
                <Award className='w-12 h-12 mx-auto text-primary mb-2' />
                <h3 className='text-lg font-bold text-primary-foreground'>Weekly Top Player Reward</h3>
                <p className='text-muted-foreground'>The top player at the end of the week wins a <span className='font-bold text-primary-foreground'>$50 Gift Card!</span> Only the #1 ranked player is eligible.</p>
            </div>
          </CardContent>
      </Card>


      {/* --- Top 3 Display --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8 mb-8 items-end">
        <TopPlayerCard entry={topThree[1]} isLoading={isLoading} />
        <TopPlayerCard entry={topThree[0]} isLoading={isLoading} />
        <TopPlayerCard entry={topThree[2]} isLoading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>All players ranked by coins earned this week.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
               Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center p-3">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="w-10 h-10 rounded-full mx-4" />
                  <Skeleton className="h-6 flex-grow" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : (
               rest.map((entry) => (
                <RankedUser 
                  key={entry.user.id} 
                  entry={entry} 
                  isCurrentUser={entry.user.id === currentUserAuth?.uid}
                />
              ))
            )}
             {!isLoading && leaderboardData.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No leaderboard data available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Current User Not in Top 50 Display */}
      {!isLoading && !isCurrentUserInTop50 && currentUserEntryForDisplay && (
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Your Current Standing</CardTitle>
                </CardHeader>
                <CardContent>
                    <RankedUser entry={currentUserEntryForDisplay} isCurrentUser={true} />
                    <p className="text-xs text-muted-foreground text-center mt-3">You are not in the top 50. Keep playing to climb the ranks!</p>
                </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}
