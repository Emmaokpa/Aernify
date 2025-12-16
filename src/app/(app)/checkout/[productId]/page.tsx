
'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ChevronLeft, AlertTriangle, Coins } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { Product, ProductVariant } from '@/lib/types';
import { doc, writeBatch, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';


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

function CheckoutForm({ product, user, profile, form }: { product: Product & {id: string}; user: any; profile: any; form: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants?.[0] || null);
  
  const hasSufficientCoins = profile.coins >= product.price;

  const handleCheckout: SubmitHandler<ShippingFormData> = async (shippingValues) => {
    if (!selectedVariant) {
        toast({ variant: 'destructive', title: 'Variant Not Selected', description: 'Please select a color for the product.' });
        return;
    }
    if (!hasSufficientCoins) {
        toast({ variant: 'destructive', title: 'Insufficient Coins', description: `You need ${product.price.toLocaleString()} coins for this.` });
        return;
    }
    
    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      const orderRef = doc(collection(firestore, 'orders'));
      const productRef = doc(firestore, 'products', product.id);
      
      // 1. Decrement user coins
      batch.update(userRef, { coins: increment(-product.price) });
      
      // 2. Decrement stock for the selected variant
      const newVariants = product.variants.map(v => 
        v.color === selectedVariant.color ? { ...v, stock: v.stock - 1 } : v
      );
      batch.update(productRef, { variants: newVariants });
      
      // 3. Create the order
      batch.set(orderRef, {
        userId: user.uid,
        userDisplayName: profile.displayName,
        productId: product.id,
        productName: product.name,
        productImageUrl: selectedVariant.imageUrl, // Image of the specific variant
        selectedVariant: selectedVariant,
        coinsSpent: product.price,
        shippingInfo: shippingValues,
        status: 'pending',
        orderedAt: serverTimestamp(),
      });

      await batch.commit();

      toast({ title: 'Order Placed!', description: 'Your order has been successfully placed.' });
      router.push('/shop');
    } catch (error) {
      console.error('Order placement error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to place order.' });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCheckout)}>
      <div className="grid md:grid-cols-2 gap-12">
        {/* Left Side: Product Info */}
        <div className="md:col-span-1 space-y-6">
          <h1 className="text-3xl font-bold">Your Order</h1>
          <Card className="overflow-hidden">
            <div className="relative aspect-square">
              <Image src={selectedVariant?.imageUrl || product.imageUrls?.[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
                {product.variants && product.variants.length > 0 && (
                    <div className="mb-4">
                        <Label>Color: {selectedVariant?.color}</Label>
                        <div className="flex items-center gap-2 mt-2">
                        {product.variants.map((variant) => (
                            <button
                            key={variant.color}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className={cn(
                                'w-8 h-8 rounded-full border-2 transition-all',
                                selectedVariant?.color === variant.color ? 'border-primary scale-110' : 'border-border',
                                variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            )}
                            style={{ backgroundColor: variant.colorHex }}
                            title={variant.color}
                            disabled={variant.stock === 0}
                            />
                        ))}
                        </div>
                         {selectedVariant && selectedVariant.stock < 10 && selectedVariant.stock > 0 && (
                            <p className="text-xs text-amber-500 mt-2">Only {selectedVariant.stock} left in stock!</p>
                         )}
                         {selectedVariant && selectedVariant.stock === 0 && (
                             <p className="text-xs text-destructive mt-2">Out of stock</p>
                         )}
                    </div>
                )}
                 <div className="flex justify-between items-center font-bold text-2xl">
                    <span>Total Cost:</span>
                    <div className='flex items-center gap-2 text-primary'>
                        <Coins className="w-7 h-7" />
                        <span>{product.price.toLocaleString()}</span>
                    </div>
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
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full text-lg" disabled={isSubmitting || selectedVariant?.stock === 0}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Confirm & Place Order'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Your Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will spend <span className="font-bold text-primary">{product.price.toLocaleString()}</span> coins for the {product.name} ({selectedVariant?.color}). Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={form.handleSubmit(handleCheckout)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Yes, Place Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      </form>
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
