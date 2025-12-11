'use client';

import { useState, useMemo } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, writeBatch, increment, collection, serverTimestamp } from 'firebase/firestore';
import type { Product, ShippingInfo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm, SubmitHandler } from 'react-hook-form';

export default function CheckoutPage({ params }: { params: { productId: string } }) {
  const { productId } = params;
  const { toast } = useToast();
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const productDocRef = useMemo(() => {
    if (!productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading: isProductLoading } = useDoc<Product>(productDocRef);

  const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingInfo>({
      defaultValues: {
          email: profile?.email ?? '',
          fullName: profile?.displayName ?? '',
      }
  });


  if (isProductLoading) {
    return <CheckoutSkeleton />;
  }

  if (!product) {
    notFound();
  }

  const handlePurchase: SubmitHandler<ShippingInfo> = async (shippingData) => {
    if (!user || !profile || !product) {
      setErrorMessage('An unexpected error occurred. Please try logging in again.');
      setPurchaseState('error');
      return;
    }

    setPurchaseState('processing');

    if (profile.coins < product.price) {
      setErrorMessage('You do not have enough coins for this purchase.');
      setPurchaseState('error');
      return;
    }

    const batch = writeBatch(firestore);

    // 1. Deduct coins from user
    const userDocRef = doc(firestore, 'users', user.uid);
    batch.update(userDocRef, {
      coins: increment(-product.price),
    });

    // 2. Create new order document
    const orderRef = doc(collection(firestore, 'orders'));
    batch.set(orderRef, {
      userId: user.uid,
      userDisplayName: profile.displayName || user.email,
      productId: product.id,
      productName: product.name,
      productImageUrl: product.imageUrl,
      coinsSpent: product.price,
      shippingInfo: shippingData,
      status: 'pending',
      orderedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      setPurchaseState('success');
      toast({
        title: 'Purchase Successful!',
        description: `Your order for ${product.name} has been placed.`,
      });
    } catch (error) {
      console.error('Error during purchase: ', error);
      setErrorMessage('An error occurred while placing your order. Your coins have not been charged. Please try again.');
      setPurchaseState('error');
    }
  };
  
  const isLoading = isUserLoading || isProductLoading || isSubmitting;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {purchaseState === 'success' ? 'Purchase Complete!' : 'Complete Your Order'}
          </CardTitle>
        </CardHeader>

        {purchaseState === 'success' ? (
          <SuccessView />
        ) : purchaseState === 'error' ? (
          <ErrorView
            errorMessage={errorMessage}
            onTryAgain={() => setPurchaseState('idle')}
          />
        ) : (
          <form onSubmit={handleSubmit(handlePurchase)}>
            <CardContent className="grid md:grid-cols-2 gap-8">
              {/* Product and Cost Summary */}
              <div className="space-y-6">
                 <h3 className="text-lg font-semibold border-b pb-2">1. Order Summary</h3>
                 <div className="flex gap-4 items-start">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                </div>
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                    <span>Your Balance:</span>
                    <span className="font-medium flex items-center gap-1.5">
                        <Coins className="w-4 h-4" />
                        {isUserLoading ? '...' : (profile?.coins ?? 0).toLocaleString()}
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
              </div>
              
              {/* Shipping Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">2. Shipping Information</h3>
                
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" {...register('fullName', { required: 'Full name is required' })} />
                        {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
                    </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" {...register('email', { required: 'Email is required' })} />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input id="phoneNumber" {...register('phoneNumber', { required: 'Phone number is required' })} />
                        {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber.message}</p>}
                    </div>
                </div>

                <div>
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input id="addressLine1" {...register('addressLine1', { required: 'Address is required' })} />
                    {errors.addressLine1 && <p className="text-xs text-destructive mt-1">{errors.addressLine1.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register('city', { required: 'City is required' })} />
                        {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="state">State / Province</Label>
                        <Input id="state" {...register('state', { required: 'State is required' })} />
                        {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" {...register('postalCode', { required: 'Postal code is required' })} />
                        {errors.postalCode && <p className="text-xs text-destructive mt-1">{errors.postalCode.message}</p>}
                    </div>
                </div>
                 <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register('country', { required: 'Country is required' })} />
                    {errors.country && <p className="text-xs text-destructive mt-1">{errors.country.message}</p>}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-6">
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Place Order
                </Button>
                <Button asChild variant="outline" className="w-full" type="button" onClick={() => router.back()}>
                    Cancel
                </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

function SuccessView() {
  const router = useRouter();
  return (
    <>
        <CardContent className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-lg">Thank you for your order!</p>
            <p className="text-muted-foreground">
                Your order has been placed successfully and is now pending fulfillment.
            </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={() => router.push('/shop')}>
                Back to Shop
            </Button>
        </CardFooter>
    </>
  );
}

function ErrorView({ errorMessage, onTryAgain }: { errorMessage: string, onTryAgain: () => void }) {
  const router = useRouter();
  return (
     <>
        <CardContent className="text-center space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <p className="text-lg font-bold">Purchase Failed</p>
            <p className="text-muted-foreground">{errorMessage}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={onTryAgain}>
                Try Again
            </Button>
            <Button asChild variant="outline" className="w-full">
                <button onClick={() => router.push('/shop')}>Back to Shop</button>
            </Button>
        </CardFooter>
     </>
  );
}

function CheckoutSkeleton() {
    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2 mx-auto" />
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-1/3" />
                        <div className="flex gap-4 items-start">
                            <Skeleton className="w-24 h-24 rounded-lg" />
                            <div className="space-y-2 flex-grow">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    </div>
                     <div className="space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <div className="space-y-4">
                           {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        </div>
    )
}

    