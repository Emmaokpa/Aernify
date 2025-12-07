'use client';

import { useState, useEffect } from 'react';
import { games } from '@/lib/data';
import DailyLoginModal from '@/components/daily-login-modal';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
      <div className="grid gap-8">
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden group">
          <Image
            src={heroGame.imageUrl}
            alt={heroGame.title}
            fill
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint={heroGame.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
             <Link href="/play">
              <Button size="lg" className='text-lg'>
                Play Now <ArrowRight className="ml-2" />
              </Button>
            </Link>
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
