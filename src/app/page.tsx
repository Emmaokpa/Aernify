'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dailyChallenges, currentUser } from '@/lib/data';
import type { DailyChallenge } from '@/lib/types';
import DailyLoginModal from '@/components/daily-login-modal';
import { Crown, Star, Coins } from 'lucide-react';
import PageHeader from '@/components/page-header';

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-3 bg-secondary/30 border-secondary">
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="text-primary" /> Daily Challenges
              </CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <CardDescription>Complete challenges to earn extra coins.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyChallenges.slice(0, 3).map((challenge: DailyChallenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-semibold">{challenge.title}</p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary flex items-center gap-1.5">
                      <Coins className="w-4 h-4" /> +{challenge.reward}
                    </p>
                    <Button size="sm" className="mt-1">Start</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary to-purple-900 border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown className="text-primary" /> Get VIP Access
            </CardTitle>
            <CardDescription className="text-purple-200">Earn 2x rewards and get exclusive perks!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white mb-4">$9.99/month</p>
            <Button className="w-full font-bold">Upgrade to VIP</Button>
          </CardContent>
        </Card>
      </div>
      <DailyLoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
