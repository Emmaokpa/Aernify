
'use client';
import { useMemo, useState } from 'react';
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
import { Coins, CheckCircle, Trophy, Sparkles, Gamepad2, Video, ListChecks, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DailyChallenge, UserChallengeProgress } from '@/lib/types';
import { claimChallengeReward } from '@/lib/challenges';
import { getTodayString } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const challengeIcons: { [key: string]: React.ReactNode } = {
  dailyCheckIn: <Star />,
  playGame: <Gamepad2 />,
  watchAd: <Video />,
  completeOffer: <ListChecks />,
};

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

const getChallengeLink = (type: DailyChallenge['type']): string | null => {
    switch(type) {
        case 'playGame':
            return '/play';
        case 'completeOffer':
            return '/offers';
        case 'watchAd':
            return '/earn';
        default:
            return null;
    }
}

function ChallengeCard({ challenge, onClaim, claimingId }: { challenge: any, onClaim: (challenge: DailyChallenge) => void, claimingId: string | null }) {
    const cardContent = (
        <Card
            className={cn(
            'bg-card/80 overflow-hidden rounded-2xl transition-all flex flex-col h-full',
            challenge.isClaimed && 'bg-amber-500/10 border-amber-500/30'
            )}
        >
            <CardHeader className="flex flex-row items-start gap-4 p-4">
                <div className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10 rounded-lg shrink-0">
                    {challengeIcons[challenge.type] || <Sparkles />}
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
                    className={cn("w-full", challenge.isClaimed && "bg-amber-500 hover:bg-amber-600 text-black")}
                    disabled={!challenge.isCompleted || challenge.isClaimed || claimingId === challenge.id}
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault(); // Prevent link navigation when claiming
                        onClaim(challenge);
                    }}
                >
                    {claimingId === challenge.id ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                    ) : challenge.isClaimed ? (
                    <>
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Claimed
                    </>
                    ) : 'Claim'}
                </Button>
            </CardFooter>
        </Card>
    );

    const link = getChallengeLink(challenge.type);

    if (link) {
        return <Link href={link} className='block h-full'>{cardContent}</Link>
    }
    
    return cardContent;
}

export default function ChallengesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const challengesQuery = useMemo(() => collection(firestore, 'challenges'), [firestore]);
  const { data: challenges, isLoading: isLoadingChallenges } = useCollection<DailyChallenge>(challengesQuery);

  const progressDocId = useMemo(() => {
    if (!user) return null;
    const today = getTodayString();
    return `${user.uid}_${today}`;
  }, [user]);

  const progressDocRef = useMemo(() => {
    if (!progressDocId) return null;
    return doc(firestore, 'user_challenge_progress', progressDocId);
  }, [progressDocId]);

  const { data: progressData, isLoading: isLoadingProgress } = useDoc<UserChallengeProgress>(progressDocRef);
  
  const handleClaim = async (challenge: DailyChallenge) => {
    if (!user) return;
    setClaimingId(challenge.id);
    try {
        await claimChallengeReward(firestore, user.uid, challenge);
        toast({
            title: "Reward Claimed!",
            description: `You earned ${challenge.reward} coins for completing "${challenge.title}"!`
        });
    } catch (error) {
        console.error("Failed to claim reward:", error);
        toast({
            variant: "destructive",
            title: "Claim Failed",
            description: "Could not claim reward. Please try again."
        })
    } finally {
        setClaimingId(null);
    }
  }
  
  const isLoading = isUserLoading || isLoadingChallenges || (user && isLoadingProgress);

  const augmentedChallenges = useMemo(() => {
    if (!challenges) return [];
    
    return challenges.map(challenge => {
        // Get progress for this specific challenge ID
        const challengeProgress = progressData?.progress?.[challenge.id];
        const currentValue = challengeProgress?.currentValue ?? 0;
        const isClaimed = challengeProgress?.claimed ?? false;

        const isCompleted = currentValue >= challenge.targetValue;

        return {
            ...challenge,
            currentValue,
            isCompleted,
            isClaimed,
            progress: Math.min(100, (currentValue / challenge.targetValue) * 100),
        }
    }).sort((a,b) => a.reward - b.reward);
  }, [challenges, progressData]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Daily Challenges"
          description="Complete tasks to earn bonus coins. New challenges unlock every day!"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length: 6}).map((_, i) => (
             <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Daily Challenges"
        description="Complete tasks to earn bonus coins. New challenges unlock every day!"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {augmentedChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onClaim={handleClaim} claimingId={claimingId} />
        ))}
        {augmentedChallenges.length === 0 && (
          <div className="text-muted-foreground col-span-full text-center py-10">
            No daily challenges available right now. Check back later!
          </div>
        )}
      </div>
    </>
  );
}
