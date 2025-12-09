'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle } from 'lucide-react';
import { ImageUploader } from './image-uploader';
import type { WithId } from '@/firebase';
import type { Game } from '@/app/admin/games/page';
import { ScrollArea } from '@/components/ui/scroll-area';

// Zod schema for validation, matching the Game type
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  iframeUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  imageUrl: z.string().min(1, { message: 'An image is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface GameFormProps {
  game: WithId<Game> | null;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function GameForm({ game, onSuccess, onCancel }: GameFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: game || {
      name: '',
      iframeUrl: '',
      imageUrl: '',
    },
  });

  const firestore = useFirestore();

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true);
    setFormError(null);
    console.log('[GameForm] Submitting values:', values);

    try {
      if (game) {
        // Update existing game
        console.log(`[GameForm] Attempting to update document with ID: ${game.id}`);
        const gameDocRef = doc(firestore, 'games', game.id);
        await updateDoc(gameDocRef, { ...values, updatedAt: serverTimestamp() });
        console.log('[GameForm] Update successful!');
        onSuccess('Game updated successfully!');
      } else {
        // Create new game
        console.log('[GameForm] Attempting to create new document in "games" collection.');
        const gamesCollectionRef = collection(firestore, 'games');
        const docRef = await addDoc(gamesCollectionRef, { ...values, createdAt: serverTimestamp() });
        console.log(`[GameForm] Create successful! New document ID: ${docRef.id}`);
        onSuccess('Game created successfully!');
      }
    } catch (error: any) {
      console.error("[GameForm] Form submission failed. Full error object:", error);
      const errorMessage = `Save failed: ${error.code} - ${error.message}`;
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onCancel()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{game ? 'Edit Game' : 'Add New Game'}</SheetTitle>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="game-form" className="flex-1 flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-6">
                {formError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Save Failed</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

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
                      <FormLabel>Game Iframe URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
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
                            <FormLabel>Game Image</FormLabel>
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
              </div>
            </ScrollArea>

            <SheetFooter className="pt-6 mt-auto">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Game
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
