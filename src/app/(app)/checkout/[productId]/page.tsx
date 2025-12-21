'use client';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { Product, ProductVariant } from '@/lib/types';
import { doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

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

const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

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

function PaystackButton({ config, onTransactionComplete, onTransactionClose, disabled }: any) {
  
  const handlePayment = () => {
    const handler = window.PaystackPop.setup({
      ...config,
      onSuccess: (transaction: any) => {
        onTransactionComplete(transaction);
      },
      onClose: () => {
        onTransactionClose();
      },
    });
    handler.openIframe();
  }

  return (
    <Button type="button" onClick={handlePayment} size="lg" className="w-full text-lg" disabled={disabled || config.isSubmitting}>
      {config.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
      {disabled && !config.isSubmitting ? 'Out of Stock' : 'Proceed to Payment'}
    </Button>
  );
}

function CheckoutForm({ product, user, profile, form }: { product: Product & {id: string}; user: any; profile: any; form: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  const placeOrderInFirestore = async (shippingValues: ShippingFormData, transactionRef: string) => {
     if (product.variants && product.variants.length > 0 && !selectedVariant) {
        toast({ variant: 'destructive', title: 'Error', description: 'Product variant not selected.' });
        return;
    }
    
    try {
      const batch = writeBatch(firestore);
      // Create a reference to the user's "orders" subcollection
      const orderRef = doc(collection(firestore, 'users', user.uid, 'orders'));
      const productRef = doc(firestore, 'products', product.id);
      
      let finalVariant = selectedVariant;
      
      // Decrement stock if variants exist
      if (product.variants && product.variants.length > 0 && finalVariant) {
        const newVariants = product.variants.map(v => 
          v.color === finalVariant!.color ? { ...v, stock: v.stock - 1 } : v
        );
        batch.update(productRef, { variants: newVariants });
      }
      
      // Create the order in the user's subcollection
      batch.set(orderRef, {
        userId: user.uid,
        userDisplayName: profile.displayName,
        productId: product.id,
        productName: product.name,
        productImageUrl: finalVariant?.imageUrl || product.imageUrls[0],
        selectedVariant: finalVariant,
        amountPaid: product.price,
        shippingInfo: shippingValues,
        status: 'pending',
        orderedAt: serverTimestamp(),
        paymentRef: transactionRef,
      });

      await batch.commit();

      toast({ title: 'Order Placed!', description: 'Your order has been successfully placed.' });
      router.push('/shop');
    } catch (error) {
      console.error('Order placement error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save order details after payment.' });
    }
  };

  const handleSuccess = (transaction: any) => {
    setIsSubmitting(true);
    placeOrderInFirestore(form.getValues(), transaction.reference).finally(() => setIsSubmitting(false));
  };

  const handleClose = () => {
    toast({
      variant: 'default',
      title: 'Payment Closed',
      description: 'The payment popup was closed.',
    });
  };

  const config = {
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      email: form.getValues('email'),
      amount: product.price * 100, // Amount in kobo
      currency: 'NGN',
      ref: `AERNIFY-${Date.now()}`,
      metadata: {
        custom_fields: [
            {
                display_name: "Full Name",
                variable_name: "full_name",
                value: form.getValues('fullName'),
            },
        ],
      },
      isSubmitting: isSubmitting,
    };
    
    const handleFormSubmit: SubmitHandler<ShippingFormData> = (shippingValues) => {
       if (product.variants && product.variants.length > 0 && !selectedVariant) {
        toast({ variant: 'destructive', title: 'Variant Not Selected', description: 'Please select a color for the product.' });
        return;
       }
       // The PaystackButton will now handle the payment initiation
    };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
      <div className="grid md:grid-cols-2 gap-12">
        {/* Left Side: Product Info */}
        <div className="md:col-span-1 space-y-6">
          <h1 className="text-xl font-bold">Your Order</h1>
           <div className="overflow-hidden rounded-2xl bg-card/80 border">
              <div className="relative aspect-square">
                <Image src={selectedVariant?.imageUrl || product.imageUrls?.[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
              </div>
              <div className='p-6'>
                  <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
                  <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>{product.description}</p>
                  
                  {product.variants && product.variants.length > 0 && (
                      <div className="mt-4">
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
                   <div className="flex justify-between items-center font-bold text-lg mt-6 border-t pt-4">
                      <span>Total:</span>
                      <div className='flex items-center gap-2 text-primary'>
                          <span>{formatToNaira(product.price)}</span>
                      </div>
                  </div>
              </div>
            </div>
        </div>

        {/* Right Side: Shipping Form */}
        <div className="md:col-span-1 space-y-6">
          <h1 className="text-xl font-bold">Shipping Details</h1>
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
          
          <PaystackButton
              config={config}
              onTransactionComplete={handleSuccess}
              onTransactionClose={handleClose}
              disabled={selectedVariant?.stock === 0}
          />
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
      country: 'Nigeria',
    },
  });
  
   useEffect(() => {
    // When the user profile loads, reset the form with the user's data.
    // This pre-fills the form and prevents the controlled/uncontrolled warning.
    if (profile) {
      form.reset({
        email: profile.email || '',
        fullName: profile.displayName || '',
        // keep other fields as they were, let the user fill them
        phoneNumber: form.getValues('phoneNumber') || '',
        addressLine1: form.getValues('addressLine1') || '',
        addressLine2: form.getValues('addressLine2') || '',
        city: form.getValues('city') || '',
        state: form.getValues('state') || '',
        postalCode: form.getValues('postalCode') || '',
        country: 'Nigeria',
      });
    }
  }, [profile, form]);


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
      <CheckoutForm product={{...product, id: productId}} user={user} profile={profile} form={form} />
    </div>
  );
}
