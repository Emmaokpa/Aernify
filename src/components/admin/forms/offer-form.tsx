
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

type Offer = {
  name: string;
  description: string;
  imageUrl: string;
  rewardAmount: number;
  provider: string;
  requiredAction: string;
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Image URL is required'),
  rewardAmount: z.coerce.number().min(1, 'Reward amount must be positive'),
  provider: z.string().min(1, 'Provider is required'),
  requiredAction: z.string().min(1, 'Required action is required'),
});

type OfferFormProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  offer?: WithId<Offer>;
  onSuccess: () => void;
};

export function OfferForm({ isOpen, setOpen, offer, onSuccess }: OfferFormProps) {
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      rewardAmount: 0,
      provider: '',
      requiredAction: ''
    },
  });
  
  const { reset, control } = form;

  useEffect(() => {
    if (isOpen) {
        setSubmissionError(null);
        if (offer) {
          reset(offer);
        } else {
          reset({
            name: '',
            description: '',
            imageUrl: '',
            rewardAmount: 0,
            provider: '',
            requiredAction: ''
          });
        }
    }
  }, [offer, reset, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
        setSubmissionError('Firestore is not available. Please try again later.');
        return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);

    const docId = offer ? offer.id : crypto.randomUUID();
    const docRef = doc(firestore, 'offers', docId);

    const offerData = { 
      id: docId, 
      ...values,
    };

    try {
      await setDoc(docRef, offerData, { merge: true });
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{offer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
           <DialogDescription>
             {offer ? 'Update the details for this offer.' : 'Fill in the details to add a new offer.'}
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormLabel>Offer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Complete a Survey" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AdGateMedia" {...field} />
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
                    <Textarea placeholder="Describe the offer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="requiredAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Action</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Download and install" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name="rewardAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Amount (Coins)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Offer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
