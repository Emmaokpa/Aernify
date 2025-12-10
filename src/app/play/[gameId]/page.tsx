'use client';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Coins, Clock, Gift, CheckCircle } from 'lucide-react';
import Link from 'next/link';
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
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <Button asChild variant="outline">
          <Link href="/play">
            <ChevronLeft className="mr-2" />
            All Games
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
             {isLoading ? (
                <Skeleton className="h-8 w-64" />
             ) : (
                <CardTitle>{game?.title}</CardTitle>
             )}
        </CardHeader>
        <CardContent className="p-0">
            <div className="aspect-w-16 aspect-h-9 bg-black">
            {isLoading ? (
                <Skeleton className="w-full h-full min-h-[65vh]" />
            ) : game?.iframeUrl ? (
                <iframe
                src={game.iframeUrl}
                className="w-full h-full min-h-[65vh]"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin"
                title={game.title}
                />
            ) : (
                <div className="flex items-center justify-center h-full min-h-[65vh]">
                <p>Game could not be loaded.</p>
                </div>
            )}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl'>
                <Gift className='w-6 h-6 text-primary' />
                <span>Playtime Reward</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {isLoading ? <Skeleton className="h-10 w-1/2" /> : (
                <div className={cn(
                    "flex items-center justify-between p-4 rounded-lg",
                    rewardClaimed ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-primary/10 text-primary"
                )}>
                    {rewardClaimed ? (
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">Reward Claimed!</p>
                                <p className="font-semibold flex items-center gap-1.5">You earned {game?.reward} coins.</p>
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">Reward in {formatTime(countdown)}</p>
                                <p className="font-semibold flex items-center gap-1.5">Play to earn <Coins className="w-4 h-4" /> {game?.reward}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
