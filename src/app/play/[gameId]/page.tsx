'use client';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Coins } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import type { Game } from '@/lib/types';

const PLAY_TIME_FOR_REWARD = 3 * 60 * 1000; // 3 minutes in milliseconds

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

    const timer = setTimeout(async () => {
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
    }, PLAY_TIME_FOR_REWARD);

    return () => clearTimeout(timer);
  }, [game, user, firestore, rewardClaimed, toast]);


  return (
    <>
      <div className="flex items-center justify-between mb-4">
        {isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : game ? (
          <PageHeader
            title={game.title}
            description={`Play for 3 minutes to earn ${game.reward} coins!`}
          />
        ) : (
          <PageHeader title="Game not found" />
        )}
        <Button asChild variant="outline">
          <Link href="/play">
            <ChevronLeft className="mr-2" />
            All Games
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="aspect-w-16 aspect-h-9">
          {isLoading ? (
            <Skeleton className="w-full h-full min-h-[70vh]" />
          ) : game?.iframeUrl ? (
            <iframe
              src={game.iframeUrl}
              className="w-full h-full min-h-[70vh]"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin"
              title={game.title}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[70vh]">
              <p>Game could not be loaded.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
