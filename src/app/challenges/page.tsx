
'use client';

import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { dailyChallenges } from '@/lib/data';
import { Coins, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChallengesPage() {
  return (
    <>
      <PageHeader
        title="Daily Challenges"
        description="Complete tasks to earn bonus coins. New challenges every day!"
      />
      <div className="space-y-4">
        {dailyChallenges.map((challenge) => (
          <Card
            key={challenge.id}
            className={cn(
              'bg-card/80 overflow-hidden rounded-2xl',
              challenge.isCompleted && 'opacity-60'
            )}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 rounded-lg">
                  {challenge.icon}
                </div>
                <div>
                  <h3 className="font-bold text-md">{challenge.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {challenge.description}
                  </p>
                </div>
                {challenge.isVip && <Lock className="w-4 h-4 ml-auto text-primary" />}
              </div>

              <div className="space-y-2">
                <Progress value={challenge.progress} className="h-2" />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {challenge.currentValue}/{challenge.targetValue}
                  </span>
                  <span>{challenge.difficulty}</span>
                </div>
              </div>
              
              <div className='flex flex-col items-center gap-2'>
                <Button
                  className="w-full"
                  disabled={challenge.isCompleted || challenge.isVip && !challenge.isCompleted}
                >
                  {challenge.isCompleted ? 'Claimed' : challenge.isVip ? 'Upgrade to VIP to Unlock' : 'In Progress'}
                </Button>
                <div className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <Coins className="w-4 h-4" />
                  <span>{challenge.reward}</span>
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
