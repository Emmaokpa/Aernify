
'use client';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { WithId } from '@/firebase/firestore/use-collection';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2, Terminal } from 'lucide-react';
import { ImageUploader } from './image-uploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

type Product = {
  name: string;
  description: string;
  imageUrl: string;
  priceCoins: number;
  priceUSD?: number;
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Image URL is required'),
  priceCoins: z.coerce.number().min(1, 'Coin price must be positive'),
  priceUSD: z.coerce.number().optional(),
});

type ProductFormProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  product?: WithId<Product>;
  onSuccess: () => void;
};

export function ProductForm({ isOpen, setOpen, product, onSuccess }: ProductFormProps) {
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      priceCoins: 0,
      priceUSD: undefined,
    },
  });
  
  const { reset, control } = form;

  useEffect(() => {
    if (isOpen) {
        setSubmissionError(null);
        if (product) {
          reset(product);
        } else {
          reset({
            name: '',
            description: '',
            imageUrl: '',
            priceCoins: 0,
            priceUSD: undefined,
          });
        }
    }
  }, [product, reset, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
        setSubmissionError('Firestore is not available. Please try again later.');
        return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);

    const docId = product ? product.id : crypto.randomUUID();
    const docRef = doc(firestore, 'products', docId);

    const productData = { 
      id: docId, 
      ...values,
    };

    try {
      await setDoc(docRef, productData, { merge: true });
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error('Submission failed', error);
      setSubmissionError(`Submission Failed: ${error.message} (Code: ${error.code})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
           <DialogDescription>
             {product ? 'Update the details for this product.' : 'Fill in the details to add a new product.'}
           </DialogDescription>
        </DialogHeader>

        {submissionError && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Save Failed</AlertTitle>
                <AlertDescription className="break-words">
                    {submissionError}
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
             <ScrollArea className="overflow-y-auto">
                <div className="space-y-4 pr-6">
                    <FormField
                      control={control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <FormControl>
                            <ImageUploader
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Wireless Earbuds" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the product" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={control}
                      name="priceCoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (Coins)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 15000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={control}
                      name="priceUSD"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD, Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 19.99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
