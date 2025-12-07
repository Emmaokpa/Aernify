
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
import { useEffect } from 'react';
import type { WithId } from '@/firebase/firestore/use-collection';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


type Game = {
  name: string;
  iframeUrl: string;
  imageUrl: string;
  rewardAmount: number;
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  iframeUrl: z.string().url('Must be a valid iFrame URL'),
  imageUrl: z.string().url('Must be a valid image URL'),
  rewardAmount: z.coerce.number().min(0, 'Reward must be a positive number'),
});

type GameFormProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  game?: WithId<Game>;
};

export function GameForm({ isOpen, setOpen, game }: GameFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      iframeUrl: '',
      imageUrl: '',
      rewardAmount: 0,
    },
  });
  
  const {formState: {isSubmitting}} = form;

  useEffect(() => {
    if (game) {
      form.reset(game);
    } else {
      form.reset({
        name: '',
        iframeUrl: '',
        imageUrl: '',
        rewardAmount: 0,
      });
    }
  }, [game, form, isOpen]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const docId = game ? game.id : crypto.randomUUID();
      const docRef = doc(firestore, 'games', docId);

      await setDoc(docRef, { id: docId, ...values }, { merge: true });

      toast({
        title: game ? 'Game Updated' : 'Game Created',
        description: `The game "${values.name}" has been saved.`,
      });
      setOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem saving the game.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{game ? 'Edit Game' : 'Add New Game'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Textarea placeholder="<iframe src=... >" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rewardAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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

    