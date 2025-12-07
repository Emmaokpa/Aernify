
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      iframeUrl: '',
      imageUrl: '',
    },
  });
  
  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
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
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const docId = game ? game.id : crypto.randomUUID();
      const docRef = doc(firestore, 'games', docId);

      await setDoc(docRef, { 
        id: docId, 
        ...values,
       }, { merge: true });

      onSuccess();
      setOpen(false);
      
    } catch (error) {
       console.error("Error during form submission:", error);
       toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'There was a problem saving the game. You may not have permission.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{game ? 'Edit Game' : 'Add New Game'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange('')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
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
              control={form.control}
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
