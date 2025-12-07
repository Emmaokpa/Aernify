
'use client';

import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { WithId } from '@/firebase/firestore/use-collection';
import DailyLoginModal from '@/components/daily-login-modal';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Game = {
  name: string;
  imageUrl: string;
  rewardAmount: number;
};

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const firestore = useFirestore();

  const gamesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  const { data: games, isLoading } = useCollection<Game>(gamesCollectionRef);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsModalOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const heroGame = games?.[0];

  return (
    <>
      <div className="grid gap-8">
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden group">
          {isLoading && <Skeleton className="absolute inset-0" />}
          {heroGame && (
            <>
              <Image
                src={heroGame.imageUrl}
                alt={heroGame.name}
                fill
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <Link href={`/play/${heroGame.id}`}>
                  <Button size="lg" className="text-lg">
                    Play Now <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Popular Games
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
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
                     <h3 className='font-bold text-white'>{game.name}</h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <DailyLoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

    