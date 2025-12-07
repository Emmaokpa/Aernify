'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Copy, Info, PlayCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";

export default function EarnPage() {
  const referralCode = 'YOURCODE123';
  const [adsWatched, setAdsWatched] = useState(0);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const dailyAdLimit = 20;
  const [countdown, setCountdown] = useState(15);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAdModalOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isAdModalOpen && countdown === 0) {
      handleVideoEnd();
    }
    return () => clearTimeout(timer);
  }, [isAdModalOpen, countdown]);

  const handleWatchAd = () => {
    if (adsWatched < dailyAdLimit) {
      setCountdown(15);
      setIsAdModalOpen(true);
    }
  };

  const handleVideoEnd = () => {
    setIsAdModalOpen(false);
    setAdsWatched(adsWatched + 1);
    toast({
      title: "Reward Claimed!",
      description: "+10 Coins have been added to your balance.",
    });
    // In a real app, you would add 10 coins to the user's balance here.
  };

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
              Invite a friend with your code and you both get{' '}
              <span className="font-bold text-primary">100 coins!</span>
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Your referral code:</p>
              <div className="flex gap-2">
                <Input readOnly value={referralCode} className="font-mono" />
                <Button>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
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
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden relative">
            {/* Placeholder for a 15-second video ad */}
            <video
              width="100%"
              height="100%"
              autoPlay
              muted // Autoplay often requires the video to be muted
              playsInline
              src="https://storage.googleapis.com/web-dev-assets/video-and-source-tags/chrome.mp4"
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center">
              {countdown}
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
