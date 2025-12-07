
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


type Game = {
  name: string;
  playgamaId: string;
  imageUrl: string;
  rewardAmount: number;
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  playgamaId: z.string().min(1, 'Playgama ID is required'),
  imageUrl: z.string().url('Must be a valid URL'),
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
      playgamaId: '',
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
        playgamaId: '',
        imageUrl: '',
        rewardAmount: 0,
      });
    }
  }, [game, form, isOpen]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const docRef = game ? doc(firestore, 'games', game.id) : doc(firestore, 'games', crypto.randomUUID());
      await setDoc(docRef, values, { merge: true });
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
              name="playgamaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playgama ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., galaxy-invaders" {...field} />
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
