'use client';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Coins, Clock, CheckCircle, Smartphone, ArrowLeft, Expand, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const PLAY_TIME_FOR_REWARD = 3 * 60; // 3 minutes in seconds

export default function GamePage() {
  const params = useParams();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, profile, isUserLoading } = useUser();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const gameDocRef = useMemo(() => {
    if (!gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);

  const { data: game, isLoading } = useDoc<Game>(gameDocRef);

  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [countdown, setCountdown] = useState(PLAY_TIME_FOR_REWARD);
  const [isPlaying, setIsPlaying] = useState(false);


  useEffect(() => {
    if (!game || !user || rewardClaimed || !isPlaying) {
      return;
    }

    const gameTimer = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                clearInterval(gameTimer);
                claimReward();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    const claimReward = async () => {
      if (!game || !user) return;
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
          coins: increment(game.reward),
        });
        
        setRewardClaimed(true);

        toast({
          title: 'Reward Claimed!',
          description: (
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span>
                You earned {game.reward} coins for playing {game.title}!
              </span>
            </div>
          ),
        });
      } catch (error) {
        console.error('Error awarding coins:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not award coins. Please try again later.'
        })
      }
    };
    
    return () => clearInterval(gameTimer);
  }, [game, user, firestore, rewardClaimed, toast, isPlaying]);
  
  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }
  
  if (isPlaying) {
    return (
       <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-shrink-0 p-2 bg-background flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setIsPlaying(false)}>
                <X className="w-6 h-6" />
            </Button>
            <div className="font-bold text-lg">{game?.title}</div>
            <Button variant="ghost" size="icon" onClick={handleFullscreen}>
                <Expand className="w-6 h-6" />
            </Button>
        </div>
        <div className="flex-grow">
            <iframe
                ref={iframeRef}
                src={game?.iframeUrl}
                className="w-full h-full"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin"
                title={game?.title}
            />
        </div>
       </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{game?.title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary border">
              <Coins className="h-5 w-5" />
              <span>{profile?.coins?.toLocaleString() ?? 0}</span>
            </div>
            <Link href="/profile">
                <Avatar className='h-10 w-10'>
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            </Link>
          </div>
      </div>
      
      <div className='p-4 bg-card rounded-xl flex items-center gap-3'>
        <Smartphone className='w-5 h-5 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>For a better experience rotate your device to landscape mode.</p>
      </div>

      <Card className="overflow-hidden bg-gradient-to-b from-card to-background relative">
        <div className='absolute top-2 right-2 z-10'>
            <Button size='icon' variant='secondary' className='rounded-full bg-black/30 hover:bg-black/50 border-none' onClick={() => setIsPlaying(true)}>
                <Expand className='w-5 h-5' />
            </Button>
        </div>
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-6 text-center min-h-[250px]">
           <div className='flex items-center gap-4 w-full'>
                <div className='relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg'>
                    <Image src={game?.imageUrl || ''} alt={game?.title || ''} fill className='object-cover' />
                </div>
                <Button className='flex-grow h-24 rounded-full text-3xl font-bold bg-violet-600 hover:bg-violet-700' onClick={() => setIsPlaying(true)}>
                    Let's Play!
                </Button>
           </div>
           <h2 className='text-2xl font-bold'>{game?.title}</h2>
        </CardContent>
      </Card>
      
      <div className='flex items-center justify-between bg-card p-2 rounded-full'>
        <p className='text-sm pl-4'>Now playing: {game?.title}</p>
        {rewardClaimed ? (
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 font-semibold">
                <CheckCircle className='w-5 h-5' />
                <span>Claimed</span>
            </div>
        ) : (
            <div className='flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold'>
                <Clock className='w-5 h-5'/>
                <span>Claim in {formatTime(countdown)}</span>
            </div>
        )}
      </div>

    </div>
  );
}
