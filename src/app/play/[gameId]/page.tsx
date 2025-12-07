
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type Game = {
  name: string;
  iframeUrl: string;
  rewardAmount: number;
};

export default function GamePage() {
  const params = useParams();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const firestore = useFirestore();

  const gameDocRef = useMemoFirebase(
    () => (firestore && gameId ? doc(firestore, 'games', gameId) : null),
    [firestore, gameId]
  );

  const { data: game, isLoading } = useDoc<Game>(gameDocRef);

  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        {isLoading ? <Skeleton className='h-10 w-64' /> : 
        game && <PageHeader title={game.name} description={`Earn ${game.rewardAmount} coins!`} />
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
