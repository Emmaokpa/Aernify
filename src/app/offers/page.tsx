'use client';
import { useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Coins } from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Offer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function OfferSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col group">
      <CardHeader className="p-0">
        <Skeleton className="aspect-[16/9] w-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}


export default function AffiliatePage() {
  const firestore = useFirestore();
  const offersCollection = useMemo(() => collection(firestore, 'offers'), [firestore]);
  const { data: offers, isLoading } = useCollection<Offer>(offersCollection);

  return (
    <>
      <PageHeader
        title="Affiliate Offers"
        description="Earn big rewards by completing offers from our partners."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <OfferSkeleton key={i} />)}
        {offers?.map((offer) => (
          <Card key={offer.id} className="overflow-hidden flex flex-col group">
            <CardHeader className="p-0">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={offer.imageUrl}
                  alt={offer.title}
                  fill
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={offer.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <h3 className="text-lg font-semibold truncate">{offer.title}</h3>
              <p className="text-sm text-muted-foreground">{offer.company}</p>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
              <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                <Coins className="w-5 h-5" />
                <span>{offer.reward.toLocaleString()}</span>
              </div>
              <Button asChild className="w-full">
                <a href={offer.link} target="_blank" rel="noopener noreferrer">Start Offer</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
        {!isLoading && offers?.length === 0 && (
          <p className="text-muted-foreground col-span-full">No offers available right now. Check back later!</p>
        )}
      </div>
    </>
  );
}
