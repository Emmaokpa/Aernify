
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
import type { LeaderboardEntry } from '@/lib/types';
import { useMemo } from 'react';
import { useUser, useFirestore, usePublicFirestoreQuery } from '@/firebase';
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
  isAdmin,
}: {
  entry: LeaderboardEntry;
  isAdmin: boolean;
}) {
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
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
        </Avatar>
        <p className="text-xl font-bold">{user.name}</p>
        {isAdmin && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
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
  isAdmin,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  isAdmin: boolean;
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
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
        <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
      </Avatar>
      <div className='flex-grow'>
        <p className="font-semibold">{user.name}</p>
        {isAdmin && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
      </div>
      <div className="font-bold text-primary flex items-center gap-1.5">
        <Coins className="w-4 h-4" /> {score.toLocaleString()}
      </div>
    </div>
  );
}

// --- Main Leaderboard Page Component ---
export default function LeaderboardPage() {
    const firestore = useFirestore();
    const { user: currentUserAuth, isAdmin, isUserLoading } = useUser();
    
    // Query the public /leaderboard collection
    const { data: leaderboardData, isLoading: isLeaderboardLoading } = usePublicFirestoreQuery<LeaderboardEntry>(
        () => query(
            collection(firestore, 'leaderboard'), 
            orderBy('rank', 'asc'), 
            limit(50)
        )
    );

    const isLoading = isUserLoading || isLeaderboardLoading;

    if(isLoading) {
        return null; // App layout shows skeleton
    }

    const topThree = leaderboardData?.slice(0, 3) ?? [];
    const rest = leaderboardData?.slice(3) ?? [];
    
    // Find the current user in the fetched leaderboard data
    const currentUserEntry = leaderboardData?.find(entry => entry.user.id === currentUserAuth?.uid);

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
                    <h3 className='text-xl font-bold text-foreground'>Weekly Champion's Prize</h3>
                    <p className='text-muted-foreground'>The #1 player at the end of the week with over <span className='font-bold text-primary'>30,000 coins</span> wins a <span className='font-bold text-primary'>$50 Gift Card</span>. Do you have what it takes?</p>
                </div>
            </CardContent>
        </Card>

        {/* --- Top 3 Display --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8 mb-8 items-end">
            {topThree[1] && <TopPlayerCard entry={topThree[1]} isAdmin={!!isAdmin} />}
            {topThree[0] && <TopPlayerCard entry={topThree[0]} isAdmin={!!isAdmin} />}
            {topThree[2] && <TopPlayerCard entry={topThree[2]} isAdmin={!!isAdmin} />}
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Rankings</CardTitle>
            <CardDescription>Top 50 players ranked by coins earned this week.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-2">
                {rest.map((entry) => (
                    <RankedUser 
                    key={entry.user.id} 
                    entry={entry} 
                    isCurrentUser={entry.user.id === currentUserAuth?.uid}
                    isAdmin={!!isAdmin}
                    />
                ))}
                {(leaderboardData ?? []).length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    Leaderboard is empty. Be the first to get on the board!
                </div>
                )}
            </div>
            </CardContent>
        </Card>
      
        {/* Current User Not in Top 50 Display */}
        {currentUserEntry && (
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Your Current Standing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankedUser entry={currentUserEntry} isCurrentUser={true} isAdmin={!!isAdmin} />
                    </CardContent>
                </Card>
            </div>
        )}
        </>
    );
}
