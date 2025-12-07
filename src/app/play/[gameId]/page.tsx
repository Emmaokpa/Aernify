
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, writeBatch, increment } from 'firebase/firestore';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type Game = {
  name: string;
  iframeUrl: string;
};

const GAME_REWARD_COINS = 5;
const GAME_REWARD_DURATION_SECONDS = 4 * 60; // 4 minutes

export default function GamePage() {
  const params = useParams();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [hasBeenRewarded, setHasBeenRewarded] = useState(false);

  const gameDocRef = useMemoFirebase(
    () => (firestore && gameId ? doc(firestore, 'games', gameId) : null),
    [firestore, gameId]
  );

  const { data: game, isLoading } = useDoc<Game>(gameDocRef);

  useEffect(() => {
    if (!user || !firestore || !gameId || hasBeenRewarded) return;

    const timer = setTimeout(async () => {
      if (hasBeenRewarded) return;

      try {
        const batch = writeBatch(firestore);

        // 1. Award coins to user
        const userRef = doc(firestore, 'users', user.uid);
        batch.update(userRef, { coins: increment(GAME_REWARD_COINS) });
        
        // 2. Create a gameplay record
        const gamePlayRef = doc(collection(firestore, 'users', user.uid, 'userGamePlays'));
        batch.set(gamePlayRef, {
            id: gamePlayRef.id,
            userId: user.uid,
            gameId: gameId,
            startTime: new Date(Date.now() - GAME_REWARD_DURATION_SECONDS * 1000).toISOString(),
            endTime: new Date().toISOString(),
            rewardEarned: GAME_REWARD_COINS,
        });

        await batch.commit();
        setHasBeenRewarded(true);
        toast({
          title: 'Reward!',
          description: `You earned ${GAME_REWARD_COINS} coins for playing!`,
        });

      } catch (error) {
        console.error("Error awarding game play reward:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not claim your game reward.',
        });
      }

    }, GAME_REWARD_DURATION_SECONDS * 1000);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, [user, firestore, gameId, hasBeenRewarded, toast]);

  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        {isLoading ? <Skeleton className='h-10 w-64' /> : 
        game && <PageHeader title={game.name} description={`Play for 4 minutes to earn ${GAME_REWARD_COINS} coins!`} />
        }
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
            <Skeleton className="w-full h-full" />
          ) : game?.iframeUrl ? (
            <iframe
              src={game.iframeUrl}
              className="w-full h-full min-h-[70vh]"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin"
              title={game.name}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Game could not be loaded.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

    