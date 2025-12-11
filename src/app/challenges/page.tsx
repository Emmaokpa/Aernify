
'use client';

import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { dailyChallenges } from '@/lib/data';
import { Coins, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const getDifficultyClass = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
        case 'Easy':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
        case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        case 'Hard':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
    }
}

export default function ChallengesPage() {
  return (
    <>
      <PageHeader
        title="Daily Challenges"
        description="Complete tasks to earn bonus coins. New challenges unlock every day!"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyChallenges.map((challenge) => (
          <Card
            key={challenge.id}
            className={cn(
              'bg-card/80 overflow-hidden rounded-2xl transition-all flex flex-col',
              challenge.isCompleted && 'bg-green-600/10 border-green-600/30'
            )}
          >
            <CardHeader className="flex flex-row items-start gap-4 p-4">
               <div className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10 rounded-lg shrink-0">
                  {challenge.icon}
                </div>
                <div className='flex-grow'>
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <CardDescription className="text-xs leading-tight mt-1">
                        {challenge.description}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                 <div className="space-y-2">
                    <Progress value={challenge.progress} className="h-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                            Progress: {challenge.currentValue}/{challenge.targetValue}
                        </span>
                        <Badge variant="outline" className={cn('text-xs', getDifficultyClass(challenge.difficulty))}>{challenge.difficulty}</Badge>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/20 flex-col items-stretch gap-4">
                 <div className="font-bold text-primary flex items-center justify-center gap-1.5 text-lg w-full">
                    <span>Reward:</span>
                    <Coins className="w-5 h-5" />
                    <span>{challenge.reward}</span>
                </div>
                 <Button
                  className={cn("w-full", challenge.isCompleted && "bg-green-600 hover:bg-green-700")}
                  disabled={challenge.isCompleted}
                  size="sm"
                >
                  {challenge.isCompleted ? <CheckCircle className='w-4 h-4' /> : 'Claim'}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
