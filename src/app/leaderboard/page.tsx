
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
import { Crown, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

type User = {
  username: string;
  photoURL?: string;
  email?: string;
};

type LeaderboardEntry = {
  userId: string;
  score: number;
  rank: number;
  user?: User; // This will be populated after fetching
};

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
  entry?: WithId<LeaderboardEntry>;
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
          <AvatarImage src={user?.photoURL} alt={user?.username} />
          <AvatarFallback>{user?.username?.charAt(0) ?? '?'}</AvatarFallback>
        </Avatar>
        <p className="text-xl font-bold">{user?.username}</p>
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
  entry: WithId<LeaderboardEntry>;
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
        #{rank}
      </div>
      <Avatar className="w-10 h-10 mx-4">
        <AvatarImage src={user?.photoURL} alt={user?.username} />
        <AvatarFallback>{user?.username?.charAt(0) ?? '?'}</AvatarFallback>
      </Avatar>
      <p className="font-semibold flex-grow">{user?.username}</p>
      <div className="font-bold text-primary flex items-center gap-1.5">
        <Coins className="w-4 h-4" /> {score.toLocaleString()}
      </div>
    </div>
  );
}

// --- Main Leaderboard Page Component ---
export default function LeaderboardPage() {
  const firestore = useFirestore();
  const { user: currentUserAuth } = useUser();
  const [leaderboardData, setLeaderboardData] = useState<WithId<LeaderboardEntry>[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<WithId<LeaderboardEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized query for top 10 leaderboard entries
  const leaderboardQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'leaderboardEntries'),
            orderBy('rank', 'asc'),
            limit(10)
          )
        : null,
    [firestore]
  );
  
  const { data: rawLeaderboardData, error: leaderboardError } = useCollection<LeaderboardEntry>(leaderboardQuery);

  // Memoized query for the current user's rank
  const currentUserRankQuery = useMemoFirebase(() => {
    if (!firestore || !currentUserAuth) return null;
    return query(collection(firestore, 'leaderboardEntries'), where('userId', '==', currentUserAuth.uid), limit(1));
  }, [firestore, currentUserAuth]);

  const { data: rawCurrentUserRank, error: userRankError } = useCollection<LeaderboardEntry>(currentUserRankQuery);

  useEffect(() => {
    const fetchUsersForEntries = async (entries: WithId<LeaderboardEntry>[]) => {
      if (!firestore || entries.length === 0) return [];
      
      const userIds = [...new Set(entries.map(e => e.userId))];
      const usersRef = collection(firestore, 'users');
      const usersQuery = query(usersRef, where('id', 'in', userIds));
      
      const { getDocs } = await import('firebase/firestore');
      const userDocs = await getDocs(usersQuery);
      const usersMap = new Map<string, User>();
      userDocs.forEach(doc => usersMap.set(doc.id, doc.data() as User));

      return entries.map(entry => ({
        ...entry,
        user: usersMap.get(entry.userId),
      }));
    };
    
    setIsLoading(true);

    if (rawLeaderboardData) {
      fetchUsersForEntries(rawLeaderboardData).then(data => {
        setLeaderboardData(data);
        setIsLoading(false);
      });
    }
    
    if (rawCurrentUserRank && rawCurrentUserRank.length > 0) {
      fetchUsersForEntries(rawCurrentUserRank).then(data => {
        setCurrentUserRank(data[0]);
      });
    }

  }, [rawLeaderboardData, rawCurrentUserRank, firestore]);

  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);
  const isCurrentUserInTop10 = leaderboardData.some(e => e.userId === currentUserAuth?.uid);

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="See who's on top this week. Top players win weekly prizes!"
      />

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
               Array.from({ length: 5 }).map((_, i) => (
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
                  key={entry.id} 
                  entry={entry} 
                  isCurrentUser={entry.userId === currentUserAuth?.uid}
                />
              ))
            )}
             {/* Show current user's rank if they are not in the top 10 */}
             {!isLoading && currentUserRank && !isCurrentUserInTop10 && (
                <>
                <div className="text-center text-muted-foreground py-4">...</div>
                <RankedUser 
                    key={currentUserRank.id} 
                    entry={currentUserRank} 
                    isCurrentUser={true}
                />
                </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

