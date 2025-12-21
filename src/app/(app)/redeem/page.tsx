
'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Coins, Loader2, Construction } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { GiftCard } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useSafeCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function RedeemPage() {
  const { toast } = useToast();
  // const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();

  // const { data: giftCards, isLoading: isLoadingGiftCards } = useSafeCollection<GiftCard>(
  //     () => collection(firestore, 'giftCards')
  // );

  /*
  const handleRedeem = async (card: GiftCard) => {
    if (!user || !profile) return;

    setIsRedeeming(card.id);
    
    if (profile.coins < card.price) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Coins',
        description: `You need ${card.price.toLocaleString()} coins, but you only have ${profile.coins.toLocaleString()}.`,
      });
      setIsRedeeming(null);
      return;
    }
    
    const batch = writeBatch(firestore);
    const userDocRef = doc(firestore, 'users', user.uid);
    const redemptionRequestRef = doc(collection(firestore, 'redemption_requests'));

    // 1. Deduct coins from user
    batch.update(userDocRef, {
      coins: increment(-card.price)
    });

    // 2. Create redemption request
    batch.set(redemptionRequestRef, {
        userId: user.uid,
        userDisplayName: profile.displayName || user.email,
        giftCardId: card.id,
        giftCardName: card.name,
        giftCardValue: card.value,
        coinsSpent: card.price,
        status: 'pending',
        requestedAt: serverTimestamp()
    });

    try {
      await batch.commit();

      toast({
        title: 'Request Submitted!',
        description: `Your request for a ${card.name} gift card is pending review.`,
      });

    } catch(error) {
      console.error("Error submitting redemption request: ", error);
      toast({
        variant: 'destructive',
        title: 'Redemption Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsRedeeming(null);
    }
  };
  */

  // const isLoading = isUserLoading || isLoadingGiftCards;
  
  return (
    <>
      <PageHeader
        title="Redeem Gift Cards"
        description="Exchange your coins for real-world value. Choose from a variety of gift cards."
      />
       <div className="text-right mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary border">
            <Coins className="h-5 w-5" />
            <span>Your Balance:</span>
            {isUserLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span>{profile?.coins?.toLocaleString() ?? 0}</span>
            )}
          </div>
        </div>

      <div className="text-center py-20 rounded-lg bg-card border">
        <Construction className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">Coming Soon!</h3>
        <p className="mt-2 text-muted-foreground">
          The gift card redemption feature is currently under construction.
          <br />
          Check back later for exciting rewards!
        </p>
      </div>

      {/* 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && Array.from({length: 4}).map((_, i) => (
           <Skeleton key={i} className="aspect-[4/4.5] rounded-2xl" />
        ))}
        {giftCards?.map((card) => {
          const hasSufficientCoins = profile ? profile.coins >= card.price : false;
          return (
            <Card key={card.id} className="overflow-hidden flex flex-col rounded-2xl group">
              <CardHeader className="p-0 relative">
                <div className="relative aspect-[1.6]">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    data-ai-hint={card.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <h3 className="text-lg font-semibold">{card.name}</h3>
                <p className="text-xl font-bold text-foreground mt-1">${card.value}</p>
              </CardContent>
              <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
                <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                  <Coins className="w-5 h-5" />
                  <span>{card.price.toLocaleString()}</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={isRedeeming === card.id || isUserLoading || !hasSufficientCoins}>
                      {isRedeeming === card.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Redeem
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to spend{' '}
                        <span className="font-bold text-primary">{card.price.toLocaleString()}</span> coins to get a ${card.value} {card.name} gift card?
                        <br/><br/>
                        Upon approval, the gift card code will be sent to your registered email address. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRedeem(card)}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      */}
    </>
  );
}
