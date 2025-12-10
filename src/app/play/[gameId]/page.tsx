'use client';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Coins, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import { cn } from '@/lib/utils';


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
  const [countdown, setCountdown] = useState(PLAY_TIME_FOR_REWARD);


  useEffect(() => {
    if (!game || !user || rewardClaimed) {
      return;
    }

    const gameTimer = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                clearInterval(gameTimer);
                claimReward();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

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
    
    return () => clearInterval(gameTimer);
  }, [game, user, firestore, rewardClaimed, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{game?.title}</h1>
        <Button asChild variant="outline">
          <Link href="/play">Back to Games</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <Skeleton className="w-full aspect-video" />
          )}
          {game?.iframeUrl && (
            <iframe
              src={game.iframeUrl}
              className="w-full aspect-video"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claim Your Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg',
              rewardClaimed ? 'bg-green-500/10' : 'bg-primary/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 flex items-center justify-center rounded-full',
                  rewardClaimed ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'
                )}
              >
                {rewardClaimed ? <CheckCircle /> : <Clock />}
              </div>
              <div>
                <h3 className="font-bold">
                  {rewardClaimed ? 'Reward Claimed!' : 'Play for 3 Minutes'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {rewardClaimed
                    ? `You earned ${game?.reward} coins.`
                    : `Time remaining: ${formatTime(countdown)}`}
                </p>
              </div>
            </div>
            <div
              className={cn(
                'font-bold text-lg flex items-center gap-1.5',
                rewardClaimed ? 'text-green-500' : 'text-primary'
              )}
            >
              <Coins className="w-5 h-5" />
              <span>{game?.reward} Coins</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
