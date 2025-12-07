'use client';

import { useState, useEffect } from 'react';
import { games } from '@/lib/data';
import DailyLoginModal from '@/components/daily-login-modal';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsModalOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const heroGame = games[1];

  return (
    <>
      <div className="grid gap-6">
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
          <Image
            src={heroGame.imageUrl}
            alt={heroGame.title}
            fill
            className="object-cover"
            data-ai-hint={heroGame.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              Time to Play & Earn
            </h1>
            <p className="text-lg text-white/80 mt-2 max-w-lg drop-shadow-md">
              Jump into your favorite games and start earning rewards instantly.
            </p>
            <Button asChild size="lg" className="mt-6 w-fit">
              <Link href="/play">Play Now</Link>
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Popular Games
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {games.map((game) => (
              <Link href={`/play`} key={game.id}>
                <Card className="overflow-hidden aspect-[3/4] relative group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 rounded-2xl">
                  <Image
                    src={game.imageUrl}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    data-ai-hint={game.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-bold text-white text-lg leading-tight drop-shadow-md">
                      {game.title}
                    </h3>
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
