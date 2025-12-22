
'use client';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ShieldOff, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { isFuture, formatDistanceToNow, add } from 'date-fns';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const VIP_PRICE_KOBO = 5000 * 100; // 5000 NGN in kobo

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function VipPage() {
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleVipPayment = () => {
    if (!user || !profile || !PAYSTACK_PUBLIC_KEY) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to initialize payment. Please try again later.',
      });
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: VIP_PRICE_KOBO,
      currency: 'NGN',
      ref: `AERNIFY-VIP-${user.uid}-${Date.now()}`,
      metadata: {
        user_id: user.uid,
        payment_type: 'vip_subscription',
      },
      onClose: () => {
        setIsProcessingPayment(false);
      },
      callback: async (response: any) => {
        // INSTANT UPDATE LOGIC
        // The webhook is still the source of truth, but this provides instant UI feedback.
        setIsProcessingPayment(false);
        if (response.status === 'success' && user) {
          try {
            const userRef = doc(firestore, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const userProfile = userSnap.data();

            const now = new Date();
            let startDate = now;

            // If user is already a VIP, extend their subscription
            if (userProfile?.vipExpiresAt && userProfile.vipExpiresAt.toDate() > now) {
                startDate = userProfile.vipExpiresAt.toDate();
            }

            const newExpirationDate = add(startDate, { days: 30 });

            // Optimistically update the user document on the client
            await updateDoc(userRef, {
              vipExpiresAt: Timestamp.fromDate(newExpirationDate)
            });

            toast({
              title: 'Welcome to VIP!',
              description: 'Your VIP status is now active.',
            });
          } catch (error) {
              console.error("Client-side VIP update failed:", error);
              // Inform user that verification will happen in the background
              toast({
                  title: 'Payment Successful!',
                  description: 'Your VIP status will be updated shortly after verification.',
              });
          }
        }
      },
    });

    setIsProcessingPayment(true);
    handler.openIframe();
  };

  const isVipActive = profile?.vipExpiresAt && isFuture(profile.vipExpiresAt.toDate());

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
                <p className="text-muted-foreground text-sm">Double the coins from games, offers, and all other activities.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <ShieldOff className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Ad-Free Experience</h3>
                <p className="text-muted-foreground text-sm">Enjoy the entire app without any interruptions from ads.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Exclusive Rewards</h3>
                <p className="text-muted-foreground text-sm">Access a special selection of premium gift cards and products.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activate Your VIP Status</CardTitle>
            <CardDescription>
              {isVipActive ? 'You are a VIP member!' : 'Complete the payment to instantly activate your VIP benefits.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Monthly Fee</p>
              <p className="text-4xl font-bold">₦5,000</p>
            </div>

            {isUserLoading && <Skeleton className="h-28 w-full" />}
            
            {!isUserLoading && isVipActive && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-green-600/10 p-4 text-center text-green-400 font-semibold">
                 <div className='flex items-center gap-2'>
                    <Crown className="h-6 w-6" />
                    <span>Your VIP Membership is Active</span>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">
                    Expires in {formatDistanceToNow(profile.vipExpiresAt.toDate(), { addSuffix: false })}
                 </p>
              </div>
            )}
            
            {!isUserLoading && !isVipActive && (
              <Button onClick={handleVipPayment} disabled={isProcessingPayment} className="w-full" size="lg">
                {isProcessingPayment && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Upgrade to VIP Now
              </Button>
            )}

          </CardContent>
        </Card>
      </div>
    </>
  );
}
