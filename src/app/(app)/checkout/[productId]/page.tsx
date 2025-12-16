
'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { Product } from '@/lib/types';
import { doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import PaystackPop from '@paystack/inline-js';


const shippingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'A valid phone number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State / Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

function CheckoutSkeleton() {
    return (
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="md:col-span-1 space-y-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div className="md:col-span-1 space-y-6">
                <Skeleton className="h-10 w-48" />
                 <div className="grid gap-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                 </div>
                 <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
}

function CheckoutForm({ product, user, profile, form }: { product: Product; user: any; profile: any; form: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const createOrderInFirestore = async (shippingValues: ShippingFormData) => {
    try {
      const batch = writeBatch(firestore);
      const orderRef = doc(collection(firestore, 'orders'));

      batch.set(orderRef, {
        userId: user.uid,
        userDisplayName: profile.displayName,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl,
        coinsSpent: product.price, // This field represents the Naira amount paid
        shippingInfo: shippingValues,
        status: 'pending',
        orderedAt: serverTimestamp(),
      });

      await batch.commit();

      toast({ title: 'Order Placed!', description: 'Your order has been successfully placed.' });
      router.push('/shop');
    } catch (error) {
      console.error('Order placement error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save order after payment.' });
    }
  };

  const handleCheckout = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) {
        toast({variant: 'destructive', title: 'Invalid Form', description: 'Please fill out all required shipping details.'});
        return;
    }

    const paystack = new PaystackPop();
    paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: form.getValues('email'),
        amount: product.price * 100, // Amount in kobo
        onSuccess: (transaction) => {
            toast({ title: 'Payment Successful!', description: 'Creating your order...' });
            createOrderInFirestore(form.getValues());
        },
        onCancel: () => {
            toast({ variant: 'destructive', title: 'Payment Cancelled', description: 'The payment process was cancelled.' });
        },
    });
  }

  return (
    <Form {...form}>
      <div className="grid md:grid-cols-2 gap-12">
        {/* Left Side: Product Info */}
        <div className="md:col-span-1 space-y-6">
          <h1 className="text-3xl font-bold">Your Order</h1>
          <Card className="overflow-hidden">
            <div className="relative aspect-square">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center font-bold text-2xl">
              <span>Total Cost:</span>
              <div className='flex items-center gap-2 text-primary'>
                <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(product.price)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Shipping Form */}
        <div className="md:col-span-1 space-y-6">
          <h1 className="text-3xl font-bold">Shipping Details</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="addressLine1" render={({ field }) => (
                  <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="addressLine2" render={({ field }) => (
                  <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="postalCode" render={({ field }) => (
                    <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleCheckout} size="lg" className="w-full text-lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Proceed to Payment
          </Button>
        </div>
      </div>
    </Form>
  );
}


export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, profile, isUserLoading } = useUser();
  const productId = params.productId as string;

  const productDocRef = useMemo(() => {
    if (!productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading: isProductLoading } = useDoc<Product>(productDocRef);

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      email: profile?.email || '',
      fullName: profile?.displayName || '',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria', // Default to Nigeria
    },
  });

  const isLoading = isUserLoading || isProductLoading;

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (!product || !user || !profile) {
     return (
      <div className="max-w-6xl mx-auto text-center">
         <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Button>
        <Card className="mt-8">
            <CardHeader>
                <div className="mx-auto bg-destructive/20 rounded-full p-3 w-fit">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="mt-4">{!product ? 'Product Not Found' : 'Authentication Error'}</CardTitle>
                <CardDescription>
                    {!product 
                        ? 'The product you are trying to purchase could not be found.'
                        : 'You must be logged in to proceed with checkout.'
                    }
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Shop
      </Button>
      <CheckoutForm product={product} user={user} profile={profile} form={form} />
    </div>
  );
}
