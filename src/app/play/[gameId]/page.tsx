'use client';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { games } from '@/lib/data';

const GAME_REWARD_COINS = 5;

export default function GamePage() {
  const params = useParams();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const { toast } = useToast();

  const [game, setGame] = useState<(typeof games)[0] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching game data
    setTimeout(() => {
        const foundGame = games.find(g => g.id === gameId);
        setGame(foundGame);
        setIsLoading(false);
    }, 500);
  }, [gameId]);


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
