
'use client';
import { useMemo, useState } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, addDoc, doc, updateDoc, increment, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Coins, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col rounded-2xl h-full">
      <CardHeader className="p-0">
        <Skeleton className="aspect-square w-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 bg-card/50">
        <Skeleton className="h-7 w-1/3" />
      </CardFooter>
    </Card>
  );
}

export default function ShopPage() {
  const firestore = useFirestore();
  const { user, profile, isUserLoading } = useUser();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  const productsCollection = useMemo(
    () => collection(firestore, 'products'),
    [firestore]
  );
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(
    productsCollection
  );

  const handlePurchase = async (product: Product) => {
    if (!user || !profile) return;
    setIsPurchasing(product.id);

    if (profile.coins < product.price) {
        toast({
            variant: "destructive",
            title: "Insufficient Coins",
            description: `You need ${product.price.toLocaleString()} coins for this item.`
        });
        setIsPurchasing(null);
        return;
    }

    // Go to checkout page
    // This is a temporary step. In a real app, this would be a checkout page.
    toast({
        title: "Redirecting to Checkout",
        description: `Please fill in your shipping details for ${product.name}.`,
    });
    setIsPurchasing(null); // Stop loading as we redirect
    // Redirect to a new checkout page
    window.location.href = `/checkout/${product.id}`;
  };

  const isLoading = isLoadingProducts || isUserLoading;

  return (
    <>
      <PageHeader
        title="Shop"
        description="Purchase real tech gadgets and watches with your coins. Shipping available within Nigeria."
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
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        {products?.map((product) => {
          const hasSufficientCoins = profile ? profile.coins >= product.price : false;
          return (
            <Card key={product.id} className="overflow-hidden flex flex-col rounded-2xl group h-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              </CardContent>
              <CardFooter className="p-4 flex flex-col items-start gap-3 bg-card/50">
                <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                  <Coins className="w-5 h-5" />
                  <span>{product.price.toLocaleString()}</span>
                </div>
                 <Button className="w-full" disabled={isPurchasing === product.id || !hasSufficientCoins} asChild>
                    <Link href={`/checkout/${product.id}`}>
                        {isPurchasing === product.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Buy Now
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
        {!isLoading && products?.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No products available right now. Check back later!
          </p>
        )}
      </div>
    </>
  );
}
