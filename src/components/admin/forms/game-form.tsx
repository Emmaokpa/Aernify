'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Assuming useFirestore is what provides the initialized db client
import { useFirestore } from '@/firebase'; 
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
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

  const firestore = useFirestore(); // This hook is the likely source of the issue

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    // Reset form error and start submission
    setIsSubmitting(true);
    setFormError(null);
    console.log('[GameForm] Submitting values:', values);

    try {
      if (game) {
        // Update existing game
        console.log(`[GameForm] Attempting to UPDATE document with ID: ${game.id}`);
        const gameDocRef = doc(firestore, 'games', game.id);
        // The values object matches the data structure, so updateDoc is correct
        await updateDoc(gameDocRef, values); 
        console.log('[GameForm] Update successful!');
        onSuccess('Game updated successfully!');
      } else {
        // Create new game
        // doc(collection(db, 'collectionName')) creates a new document reference with an auto-generated ID
        const newGameRef = doc(collection(firestore, 'games')); 
        console.log(`[GameForm] Attempting to CREATE new document with ID: ${newGameRef.id}`);
        // setDoc with the new reference and data is correct
        await setDoc(newGameRef, values); 
        console.log(`[GameForm] Create successful! New document ID: ${newGameRef.id}`);
        onSuccess('Game created successfully!');
      }
    } catch (error) {
      // --- CRITICAL FIX: Enhanced Error Logging and Display ---
      // This will ensure any Firebase/Firestore specific error is caught and shown to the user.
      const firebaseError = error as { code?: string; message?: string; name?: string };
      
      console.error("[GameForm] Submission failed. Error Name:", firebaseError.name);
      console.error("[GameForm] Submission failed. Error Code:", firebaseError.code);
      console.error("[GameForm] Submission failed. Error Message:", firebaseError.message);
      console.error("[GameForm] Full error object:", error);

      // Display a more specific message for the user
      let errorMessage = 'An unexpected error occurred during save.';
      if (firebaseError.code === 'permission-denied') {
        errorMessage = 'Permission Denied. Check your user authentication status and Firestore security rules.';
      } else if (firebaseError.code) {
        errorMessage = `Save failed: ${firebaseError.code}`;
      } else if (firebaseError.message) {
        errorMessage = `Save failed: ${firebaseError.message}`;
      }

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
          <SheetDescription>Fill in the details for the game. Click save when you're done.</SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="game-form" className="flex-1 flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-6">

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
                
                {formError && (
                    <p className="text-sm font-medium text-red-600 dark:text-red-500">{formError}</p>
                )}
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