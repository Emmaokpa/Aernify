
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ImageUploader } from './image-uploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type Game = {
  name: string;
  iframeUrl: string;
  imageUrl: string;
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  iframeUrl: z.string().url('Must be a valid iFrame URL'),
  imageUrl: z.string().url('Image URL is required'),
});

type GameFormProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  game?: WithId<Game>;
  onSuccess: () => void;
};

export function GameForm({ isOpen, setOpen, game, onSuccess }: GameFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      iframeUrl: '',
      imageUrl: '',
    },
  });
  
  const { reset, control } = form;

  useEffect(() => {
    if (isOpen) {
        setSubmissionError(null); // Clear errors when dialog opens
        if (game) {
          reset(game);
        } else {
          reset({
            name: '',
            iframeUrl: '',
            imageUrl: '',
          });
        }
    }
  }, [game, reset, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
        setSubmissionError('Firestore is not available. Please try again later.');
        return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const docId = game ? game.id : crypto.randomUUID();
      const docRef = doc(firestore, 'games', docId);

      const gameData = { 
        id: docId, 
        ...values,
      };

      await setDoc(docRef, gameData, { merge: true });

      onSuccess();
      setOpen(false);
      
    } catch (error: any) {
       const errorMessage = error.message || 'An unknown error occurred.';
       setSubmissionError(`Firestore Error: ${errorMessage} (Code: ${error.code || 'N/A'})`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{game ? 'Edit Game' : 'Add New Game'}</DialogTitle>
           {submissionError && (
             <DialogDescription>
                Please correct the issues below and try again.
             </DialogDescription>
           )}
        </DialogHeader>

        {submissionError && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Submission Failed</AlertTitle>
                <AlertDescription>
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
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Galaxy Invaders" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="iframeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>iFrame URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://game-embed.com" {...field} />
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
                Save Game
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
