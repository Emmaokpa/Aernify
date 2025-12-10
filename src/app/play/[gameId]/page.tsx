'use client';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Coins, Clock, CheckCircle, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


const PLAY_TIME_FOR_REWARD = 3 * 60; // 3 minutes in seconds

export default function GamePage() {
  const params = useParams();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const gameDocRef = useMemo(() => {
    if (!gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);

  const { data: game, isLoading } = useDoc<Game>(gameDocRef);

  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (!game || !user || rewardClaimed) {
      return;
    }

    const claimReward = async () => {
      if (!game || !user) return;
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
          coins: increment(game.reward),
        });
        
        setRewardClaimed(true);

        toast({
          title: 'Reward Claimed!',
          description: (
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span>
                You earned {game.reward} coins for playing {game.title}!
              </span>
            </div>
          ),
        });
      } catch (error) {
        console.error('Error awarding coins:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not award coins. Please try again later.'
        })
      }
    };
    
    // Set a timer to claim the reward
    const gameTimer = setTimeout(() => {
        claimReward();
    }, PLAY_TIME_FOR_REWARD * 1000);
    
    return () => clearTimeout(gameTimer);
  }, [game, user, firestore, rewardClaimed, toast]);


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{game?.title}</h1>
        <Button asChild variant="outline">
          <Link href="/play">Back to Games</Link>
        </Button>
      </div>

       <div className="w-full aspect-video overflow-hidden rounded-2xl border">
          {isLoading && (
            <Skeleton className="w-full h-full" />
          )}
          {game?.iframeUrl && (
            <iframe
              src={game.iframeUrl}
              className="w-full h-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin"
            />
          )}
       </div>

      <div className="md:hidden flex items-center justify-center gap-2 p-4 bg-muted text-muted-foreground rounded-lg">
        <RotateCw className="w-5 h-5" />
        <p className="font-medium">For the best experience, rotate your device.</p>
      </div>
    </div>
  );
}
