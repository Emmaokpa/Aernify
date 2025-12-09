'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { giftCards, currentUser } from '@/lib/data';
import Image from 'next/image';
import { Coins, Loader2 } from 'lucide-react';
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

export default function RedeemPage() {
  const { toast } = useToast();
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRedeem = async (card: GiftCard) => {
    setIsRedeeming(card.id);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (currentUser.coins < card.price) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Coins',
        description: `You need ${card.price.toLocaleString()} coins, but you only have ${currentUser.coins.toLocaleString()}.`,
      });
      setIsRedeeming(null);
      return;
    }
    
    currentUser.coins -= card.price;
    toast({
      title: 'Redemption Successful!',
      description: `Your request for a ${card.name} gift card is being processed. You will receive it by email.`,
    });
    
    setIsRedeeming(null);
  };
  
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
            {isLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span>{currentUser.coins.toLocaleString()}</span>
            )}
          </div>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {giftCards.map((card) => (
          <Card key={card.id} className="overflow-hidden flex flex-col rounded-2xl group">
            <CardHeader className="p-0">
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
                  <Button className="w-full" disabled={isRedeeming === card.id || isLoading}>
                    {isRedeeming === card.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Redeem
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to spend{' '}
                      <span className="font-bold text-primary">{card.price.toLocaleString()}</span> coins to get a ${card.value} {card.name} gift card? This action cannot be undone.
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
        ))}
      </div>
    </>
  );
}
