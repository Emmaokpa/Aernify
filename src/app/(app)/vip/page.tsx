
'use client';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ShieldOff, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { isFuture, differenceInDays } from 'date-fns';
import PaystackButton from '@/components/paystack-button';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const VIP_PRICE_KOBO = 5000 * 100; // 5000 NGN in kobo

export default function VipPage() {
  const { user, profile, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // The webhook is now the single source of truth.
  // The client will just show a success message and let the backend handle the update.
  const handleSuccess = async (response: any) => {
    setIsProcessing(true); // Show processing state on the button
    if (response.status === 'success') {
      toast({
        title: 'Payment Successful!',
        description: 'Your VIP status is being processed and will update shortly. Please refresh in a moment.',
      });
      // NO MORE client-side database updates here.
    } else {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // User closed the payment popup
    setIsProcessing(false);
  };
  
  const isVipActive = profile?.vipExpiresAt && isFuture(profile.vipExpiresAt.toDate());
  const daysRemaining = profile?.vipExpiresAt ? differenceInDays(profile.vipExpiresAt.toDate(), new Date()) : 0;

  return (
    <>
      <PageHeader
        title="VIP Membership"
        description="Unlock exclusive benefits and maximize your earnings."
      />
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-primary/10 border border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">VIP Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">2x Earnings</h3>
                <p className="text-muted-foreground text-sm">
                  Double the coins from games, offers, and all other activities.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <ShieldOff className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Ad-Free Experience</h3>
                <p className="text-muted-foreground text-sm">
                  Enjoy the entire app without any interruptions from ads.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Exclusive Rewards</h3>
                <p className="text-muted-foreground text-sm">
                  Access a special selection of premium gift cards and products.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activate Your VIP Status</CardTitle>
            <CardDescription>
              {isVipActive
                ? 'You are a VIP member!'
                : 'Complete the payment to instantly activate your VIP benefits.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Monthly Fee</p>
              <p className="text-4xl font-bold">₦5,000</p>
            </div>

            {isUserLoading && <Skeleton className="h-28 w-full" />}

            {!isUserLoading && isVipActive && profile?.vipExpiresAt && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-primary/10 p-4 text-center text-primary font-semibold">
                <div className="flex items-center gap-2">
                  <Crown className="h-6 w-6" />
                  <span>Your VIP Membership is Active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Expires in {daysRemaining > 0 ? `${daysRemaining} days` : 'less than a day'}
                </p>
              </div>
            )}

            {!isUserLoading && !isVipActive && user && (
              <PaystackButton
                config={{
                  key: PAYSTACK_PUBLIC_KEY,
                  email: user.email!,
                  amount: VIP_PRICE_KOBO,
                  currency: 'NGN',
                  ref: `AERNIFY-VIP-${user.uid}-${Date.now()}`,
                  metadata: {
                    user_id: user.uid,
                    payment_type: 'vip_subscription',
                  },
                }}
                onSuccess={handleSuccess}
                onClose={handleClose}
                isProcessing={isProcessing}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                Upgrade to VIP Now
              </PaystackButton>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
