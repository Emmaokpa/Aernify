'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { currentUser, games } from '@/lib/data';
import DailyLoginModal from '@/components/daily-login-modal';
import { Coins } from 'lucide-react';
import PageHeader from '@/components/page-header';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsModalOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-6">
        <Card className="bg-secondary/30 border-secondary">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary rounded-full p-3">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardDescription>Your Balance</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">
                  {currentUser.coins.toLocaleString()} Coins
                </CardTitle>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {games.map((game) => (
            <Link href={`/play`} key={game.id}>
              <Card className="overflow-hidden aspect-[3/4] relative group">
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  data-ai-hint={game.imageHint}
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <DailyLoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
