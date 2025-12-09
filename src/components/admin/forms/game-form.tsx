'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import type { Game } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameFormProps {
  game: Game | null;
  onSave: (game: Game) => void;
  onCancel: () => void;
}

export function GameForm({ game, onSave, onCancel }: GameFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(game?.title || '');
  const [iframeUrl, setIframeUrl] = useState(game?.iframeUrl || '');
  const [imageUrl, setImageUrl] = useState(game?.imageUrl || '');
  const [provider, setProvider] = useState(game?.provider || '');


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const gameData: Game = {
        id: game?.id || `g${Date.now()}`,
        title: name,
        iframeUrl,
        imageUrl,
        provider,
        reward: game?.reward || 50,
        imageHint: game?.imageHint || 'game'
    };

    onSave(gameData);
    setIsSubmitting(false);
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onCancel()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{game ? 'Edit Game' : 'Add New Game'}</SheetTitle>
          <SheetDescription>Fill in the details for the game. Click save when you're done.</SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} id="game-form" className="flex-1 flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="name">Game Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Galaxy Invaders" required />
                    </div>
                     <div>
                        <Label htmlFor="provider">Provider</Label>
                        <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g., Playgama" required />
                    </div>
                    <div>
                        <Label htmlFor="iframeUrl">Game Iframe URL</Label>
                        <Input id="iframeUrl" value={iframeUrl} onChange={(e) => setIframeUrl(e.target.value)} placeholder="https://..." type="url" required />
                    </div>
                    <div>
                        <Label htmlFor="imageUrl">Game Image URL</Label>
                        <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." type="url" required />
                    </div>
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
      </SheetContent>
    </Sheet>
  );
}
