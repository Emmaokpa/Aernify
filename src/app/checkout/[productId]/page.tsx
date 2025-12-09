'use client';

import { useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { products, currentUser } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const product = products.find((p) => p.id === productId);
  const { toast } = useToast();

  const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!product) {
    notFound();
  }

  const handlePurchase = async () => {
    setPurchaseState('processing');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (currentUser.coins < product.price) {
      setErrorMessage('You do not have enough coins to make this purchase.');
      setPurchaseState('error');
      return;
    }

    // On success
    currentUser.coins -= product.price; // Simulate balance deduction
    setPurchaseState('success');
    toast({
      title: 'Purchase Successful!',
      description: `You have successfully bought ${product.name}.`,
    });
  };

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
                    <span className="font-medium flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      {currentUser.coins.toLocaleString()}
                    </span>
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
              disabled={purchaseState === 'processing'}
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
