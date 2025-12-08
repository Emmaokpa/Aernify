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

// --- ZOD SCHEMA FOR VALIDATION ---
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  provider: z.string().min(2, { message: 'Provider is required.' }),
  iframeUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  imageUrl: z.string().min(1, { message: 'An image is required.' }),
  reward: z.coerce.number().min(0, { message: 'Reward must be a positive number.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface GameFormProps {
  game: WithId<Game> | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

export function GameForm({ game, onSuccess, onError, onCancel }: GameFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: game || {
      name: '',
      provider: '',
      iframeUrl: '',
      imageUrl: '',
      reward: 0,
    },
  });

  const firestore = useFirestore();

  // --- CREATE/UPDATE HANDLER ---
  const handleSaveGame: SubmitHandler<FormValues> = async (values) => {
    setIsLoading(true);
    setErrorMessage(null); // Clear previous errors

    try {
      const gameData = { ...values };

      if (game) {
        // --- UPDATE LOGIC ---
        const gameDocRef = doc(firestore, 'games', game.id);
        await updateDoc(gameDocRef, { ...gameData, updatedAt: serverTimestamp() });
        onSuccess('Game updated successfully!');
      } else {
        // --- CREATE LOGIC ---
        const gamesCollectionRef = collection(firestore, 'games');
        await addDoc(gamesCollectionRef, { ...gameData, createdAt: serverTimestamp() });
        onSuccess('Game created successfully!');
      }
    } catch (error: any) {
      // --- MOBILE DEBUGGING FEEDBACK (FAILURE) ---
      const detailedError = `SAVE FAILED: ${error.code} - ${error.message}`;
      setErrorMessage(detailedError);
      onError(detailedError); // Pass error to parent if needed
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onCancel()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{game ? 'Edit Game' : 'Add New Game'}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-grow pr-6">
          <Form {...form}>
            <form id="game-form" className="space-y-6">
              {/* --- UI FEEDBACK MECHANISM --- */}
              {errorMessage && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Save Failed</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
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
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Playgama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="reward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Coins</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50" {...field} />
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
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="game-form"
            onClick={form.handleSubmit(handleSaveGame)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Game
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
