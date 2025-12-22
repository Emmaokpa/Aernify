
'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Copy, Info, PlayCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { incrementChallengeProgress } from '@/lib/challenges';
import { doc, updateDoc, increment } from 'firebase/firestore';
import VideoAdPlayer from '@/components/video-ad-player';


export default function EarnPage() {
  const { toast } = useToast();
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [adsWatched, setAdsWatched] = useState(0);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const dailyAdLimit = 20;
  
  const handleWatchAd = () => {
    if (adsWatched < dailyAdLimit) {
      setIsAdModalOpen(true);
    }
  };

  const handleAdEnded = async () => {
    setIsAdModalOpen(false);
    setAdsWatched(adsWatched + 1);
    
    if (!user) return;

    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { 
          coins: increment(10),
          weeklyCoins: increment(10)
        });

        // Increment challenge progress
        await incrementChallengeProgress(firestore, user.uid, 'watchAd');

        toast({
            title: "Reward Claimed!",
            description: "+10 Coins have been added to your balance.",
        });

    } catch (error) {
        console.error("Error rewarding for ad watch:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not claim reward. Please try again.",
        });
    }
  };

  const handleAdError = (error: any) => {
    setIsAdModalOpen(false);
    console.error("Ad Player Error:", error);
    toast({
        variant: "destructive",
        title: "Ad Error",
        description: "The video ad could not be loaded. This might be due to ad availability or a configuration issue.",
    });
  }

  const handleCopyCode = () => {
    if (!profile?.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
  }

  return (
    <>
      <PageHeader
        title="More Ways to Earn"
        description="Complete tasks to collect more reward coins."
      />
      <div className="space-y-8">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <span className="text-2xl">Watch & Earn</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Watch a short video ad and get rewarded with 10 coins instantly!
            </p>
            <Button
              className="w-full"
              onClick={handleWatchAd}
              disabled={adsWatched >= dailyAdLimit}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Watch Video Ad ({adsWatched}/{dailyAdLimit})
            </Button>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Info className="w-4 h-4 mr-2" />
              <span>
                {adsWatched >= dailyAdLimit
                  ? 'You have reached your daily limit.'
                  : 'You can watch more ads.'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-2xl">Refer a Friend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Invite a friend with your code and get{' '}
              <span className="font-bold text-primary">100 coins!</span>
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Your referral code:</p>
              {isUserLoading ? (
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input readOnly value={profile?.referralCode || 'N/A'} className="font-mono" />
                  <Button onClick={handleCopyCode} disabled={!profile?.referralCode}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAdModalOpen} onOpenChange={setIsAdModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Watching Ad</AlertDialogTitle>
            <AlertDialogDescription>
              Please watch the entire video to receive your reward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="w-full bg-black rounded-md overflow-hidden relative flex items-center justify-center min-h-[300px]">
            <VideoAdPlayer
              adTagUrl="https://youradexchange.com/video/select.php?r=10739066"
              onAdEnded={handleAdEnded}
              onAdError={handleAdError}
            />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
