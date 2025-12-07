'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Copy, Info } from 'lucide-react';

export default function EarnPage() {
  const referralCode = "YOURCODE123";

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
            <Button className="w-full">
              Watch Video Ad
            </Button>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Info className="w-4 h-4 mr-2" />
              <span>Loading status...</span>
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
    </>
  );
}
