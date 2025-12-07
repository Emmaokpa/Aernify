'use client';

import { useState } from 'react';
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

export default function EarnPage() {
  const referralCode = 'YOURCODE123';
  const [adsWatched, setAdsWatched] = useState(0);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const dailyAdLimit = 20;

  const handleWatchAd = () => {
    if (adsWatched < dailyAdLimit) {
      setIsAdModalOpen(true);
    }
  };

  const handleVideoEnd = () => {
    setIsAdModalOpen(false);
    setAdsWatched(adsWatched + 1);
    setShowReward(true);
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
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
            {/* Placeholder for a 15-second video ad */}
            <video
              width="100%"
              height="100%"
              autoPlay
              onEnded={handleVideoEnd}
              muted // Autoplay often requires the video to be muted
              playsInline
            >
              <source src="https://storage.googleapis.com/web-dev-assets/video-and-source-tags/chrome.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReward} onOpenChange={setShowReward}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Reward Claimed!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-4">
              <div className="text-5xl font-bold text-primary">
                +10 Coins
              </div>
              <p className="text-muted-foreground mt-2">
                The coins have been added to your balance.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="w-full"
              onClick={() => setShowReward(false)}
            >
              Awesome!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
