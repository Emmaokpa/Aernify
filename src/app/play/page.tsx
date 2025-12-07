
'use client';

import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';

type Game = {
  name: string;
  imageUrl: string;
};

export default function PlayPage() {
  const firestore = useFirestore();
  const gamesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  const { data: games, isLoading } = useCollection<Game>(gamesCollectionRef);

  return (
    <>
      <PageHeader
        title="Play Games"
        description="Choose a game to play and earn coins. The more you play, the more you earn!"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading &&
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        {games?.map((game) => (
          <Link href={`/play/${game.id}`} key={game.id}>
            <Card className="overflow-hidden aspect-[3/4] relative group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 rounded-2xl">
              <Image
                src={game.imageUrl}
                alt={game.name}
                fill
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="font-bold text-white">{game.name}</h3>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

    