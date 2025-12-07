
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { products } from '@/lib/data';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, increment, writeBatch } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const product = products.find((p) => p.id === productId);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!product) {
    notFound();
  }

  const handlePurchase = async () => {
    if (!user || !userData || !firestore) return;

    setPurchaseState('processing');

    if (userData.coins < product.price) {
      setErrorMessage('You do not have enough coins to make this purchase.');
      setPurchaseState('error');
      return;
    }

    const batch = writeBatch(firestore);

    // 1. Deduct coins from user
    const userRef = doc(firestore, 'users', user.uid);
    batch.update(userRef, { coins: increment(-product.price) });

    // 2. Create a purchase record
    const purchaseRef = doc(firestore, 'users', user.uid, 'purchases', crypto.randomUUID());
    batch.set(purchaseRef, {
      productId: product.id,
      productName: product.name,
      amountPaid: product.price,
      purchaseDate: new Date().toISOString(),
      paymentMethod: 'coins',
    });

    try {
      await batch.commit();
      setPurchaseState('success');
      toast({
        title: 'Purchase Successful!',
        description: `You have successfully bought ${product.name}.`,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      setErrorMessage('An unexpected error occurred during the purchase.');
      setPurchaseState('error');
    }
  };

  const isLoading = isUserLoading || isUserDataLoading;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {purchaseState === 'success' ? 'Purchase Complete!' : 'Confirm Your Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {purchaseState === 'success' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-lg">Thank you for your order!</p>
              <p className="text-muted-foreground">
                You have successfully purchased <span className="font-bold">{product.name}</span>.
              </p>
            </div>
          ) : purchaseState === 'error' ? (
             <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <p className="text-lg font-bold">Purchase Failed</p>
              <p className="text-muted-foreground">{errorMessage}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-4 items-center">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                <div className="font-bold text-primary flex items-center gap-1.5 text-lg ml-auto whitespace-nowrap">
                  <Coins className="w-5 h-5" />
                  <span>{product.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Your Balance:</span>
                  {isLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <span className="font-medium flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      {userData?.coins?.toLocaleString() ?? 0}
                    </span>
                  )}
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Cost:</span>
                  <span className="text-primary flex items-center gap-1.5">
                    <Coins className="w-5 h-5" />
                    {product.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {purchaseState === 'idle' && (
            <Button
              className="w-full"
              size="lg"
              onClick={handlePurchase}
              disabled={isLoading || purchaseState === 'processing'}
            >
              {purchaseState === 'processing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Purchase
            </Button>
          )}
           {purchaseState === 'error' && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setPurchaseState('idle')}
            >
              Try Again
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">
              {purchaseState === 'success' ? 'Back to Shop' : 'Cancel'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
