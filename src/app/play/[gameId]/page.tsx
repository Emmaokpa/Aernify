
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { games } from '@/lib/data';

type Game = {
  name: string;
  iframeUrl: string;
};

const GAME_REWARD_COINS = 5;
const GAME_REWARD_DURATION_SECONDS = 4 * 60; // 4 minutes

export default function GamePage() {
  const params = useParams();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const { user } = useUser();
  const { toast } = useToast();
  const [hasBeenRewarded, setHasBeenRewarded] = useState(false);

  const game = games.find(g => g.id === gameId);
  const isLoading = false;

  useEffect(() => {
    if (!user || !gameId || hasBeenRewarded) return;

    const timer = setTimeout(async () => {
      if (hasBeenRewarded) return;
      
      // This is where you would typically update Firestore
      // For now, we'll just show a toast.
      
      setHasBeenRewarded(true);
      toast({
        title: 'Reward!',
        description: `You earned ${GAME_REWARD_COINS} coins for playing! (Simulation)`,
      });

    }, GAME_REWARD_DURATION_SECONDS * 1000);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, [user, gameId, hasBeenRewarded, toast]);

  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        {isLoading ? <Skeleton className='h-10 w-64' /> : 
        game && <PageHeader title={game.title} description={`Play for 4 minutes to earn ${GAME_REWARD_COINS} coins!`} />
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
              title={game.title}
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
