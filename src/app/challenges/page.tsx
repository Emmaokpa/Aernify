
'use client';

import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
      <div className="space-y-4">
        {dailyChallenges.map((challenge) => (
          <Card
            key={challenge.id}
            className={cn(
              'bg-card/80 overflow-hidden rounded-2xl transition-all',
              challenge.isCompleted && 'bg-green-600/10 border-green-600/30'
            )}
          >
            <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10 rounded-lg shrink-0">
                  {challenge.icon}
                </div>
                <div className='flex-grow space-y-3'>
                    <div className='flex justify-between items-start'>
                        <div>
                            <h3 className="font-bold text-md">{challenge.title}</h3>
                            <p className="text-xs text-muted-foreground">
                                {challenge.description}
                            </p>
                        </div>
                        <div className="font-bold text-primary flex items-center gap-1.5 text-sm ml-4">
                            <Coins className="w-4 h-4" />
                            <span>{challenge.reward}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Progress value={challenge.progress} className="h-2" />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>
                                Progress: {challenge.currentValue}/{challenge.targetValue}
                            </span>
                             <Badge variant="outline" className={cn('text-xs', getDifficultyClass(challenge.difficulty))}>{challenge.difficulty}</Badge>
                        </div>
                    </div>
                </div>
                 <Button
                  className={cn("ml-4", challenge.isCompleted && "bg-green-600 hover:bg-green-700")}
                  disabled={challenge.isCompleted}
                  size="sm"
                >
                  {challenge.isCompleted ? <CheckCircle className='w-4 h-4' /> : 'Claim'}
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
