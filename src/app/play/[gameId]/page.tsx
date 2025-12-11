'use client';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Coins, CheckCircle, Expand, X } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { incrementChallengeProgress } from '@/lib/challenges';


const PLAY_TIME_FOR_REWARD = 3 * 60; // 3 minutes in seconds

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const isMobile = useIsMobile();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const gameDocRef = useMemo(() => {
    if (!gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);

  const { data: game, isLoading } = useDoc<Game>(gameDocRef);

  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [countdown, setCountdown] = useState(PLAY_TIME_FOR_REWARD);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (isGameStarted && user) {
        incrementChallengeProgress(firestore, user.uid, 'playGame');
    }
  }, [isGameStarted, user, firestore]);

  useEffect(() => {
    if (!game || !user || rewardClaimed || !isGameStarted) {
      return;
    }

    const claimReward = async () => {
      if (!game || !user) return;
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
          coins: increment(game.reward),
          weeklyCoins: increment(game.reward),
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
    
    // Countdown timer
    const gameTimer = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                clearInterval(gameTimer);
                if(!rewardClaimed) {
                    claimReward();
                }
                return 0;
            }
            return prev - 1;
        })
    }, 1000);
    
    return () => clearInterval(gameTimer);
  }, [game, user, firestore, rewardClaimed, toast, isGameStarted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFullScreen = () => {
    const elem = gameContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);


  if (isLoading) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-background">
            <Skeleton className="w-full h-full" />
        </div>
    )
  }

  return (
    <div ref={gameContainerRef} className="relative w-full h-full bg-black flex flex-col items-center justify-center group is-game-container">
        <Button onClick={() => router.push('/play')} variant="ghost" size="icon" className="absolute top-4 left-4 z-20 bg-black/50 text-white hover:bg-black/70 hover:text-white">
            <X className="w-6 h-6" />
        </Button>

      {!isGameStarted && game ? (
        <div className="text-center text-white z-10 p-4">
          <div className="relative w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground text-lg mb-8">{game.description}</p>
          <Button size="lg" onClick={() => setIsGameStarted(true)}>Let's Play!</Button>
        </div>
      ) : (
        <div className="w-full h-full">
            {game?.iframeUrl && (
                <iframe
                src={game.iframeUrl}
                className="w-full h-full border-none"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin"
                />
            )}
        </div>
      )}

      {isGameStarted && game && (
        <>
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <div className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white",
                    rewardClaimed ? "bg-green-500/80" : "bg-black/50"
                )}>
                {rewardClaimed ? (
                    <CheckCircle className="h-5 w-5" />
                ) : (
                    <Coins className="h-5 w-5 text-primary" />
                )}
                <span>{rewardClaimed ? `+${game.reward} Coins!` : formatTime(countdown)}</span>
                </div>
                <Button onClick={handleFullScreen} variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/70 hover:text-white">
                    <Expand className="w-5 h-5" />
                </Button>
            </div>
             {isMobile && <p className="hidden landscape:hidden absolute bottom-4 text-center text-white bg-black/50 p-2 rounded-lg z-20 text-sm animate-pulse">
                Rotate your device for a better experience!
            </p>}
        </>
      )}

       <style jsx global>{`
            .is-game-page {
                --main-content-padding: 0;
            }
            .is-game-page .md\\:pl-64 {
                padding-left: 0 !important;
            }
            .is-game-page header,
            .is-game-page aside,
            .is-game-page .fixed.bottom-0 {
                display: none !important;
            }
            body:has(.is-game-container:fullscreen) {
                overflow: hidden;
            }
            .is-game-container:fullscreen {
                padding: 0;
            }
            .is-game-container:fullscreen iframe {
                height: 100vh;
            }
            @media (orientation: landscape) and (max-width: 768px) {
                 .is-game-page {
                    overflow: hidden;
                }
                .is-game-page main {
                    padding: 0 !important;
                    height: 100vh;
                    max-height: 100vh;
                }
            }
       `}</style>

    </div>
  );
}

    