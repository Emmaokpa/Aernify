'use client';

import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import type { Game } from '@/lib/types';
import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function PlayPage() {
    const firestore = useFirestore();
    const gamesCollection = useMemo(() => collection(firestore, 'games'), [firestore]);
    const { data: games, isLoading } = useCollection<Game>(gamesCollection);

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
              {game.imageUrl ? (
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                />
              ) : (
                 <div className="w-full h-full bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="font-bold text-white">{game.title}</h3>
              </div>
            </Card>
          </Link>
        ))}
        {!isLoading && games?.length === 0 && (
            <p className='text-muted-foreground col-span-full'>No games available right now. Check back later!</p>
        )}
      </div>
    </>
  );
}
