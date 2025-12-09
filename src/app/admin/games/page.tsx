'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useCollection,
} from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type GameFormData = Omit<Game, 'id'>;

function AddGameForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<GameFormData>();
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<GameFormData> = async (data) => {
    setError(null);
    try {
      const gamesCollection = collection(firestore, 'games');
      await addDoc(gamesCollection, {
        ...data,
        reward: Number(data.reward) // Ensure reward is a number
      });
      toast({
        title: 'Game Added!',
        description: `${data.title} has been added to the database.`,
      });
      reset();
    } catch (err: any) {
      console.error(err);
      setError('Failed to add game. Please check the console for errors.');
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: err.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Game</CardTitle>
        <CardDescription>
          Fill out the form below to add a new game to the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="title">Game Title</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              {...register('imageUrl', { required: true })}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input
              id="imageHint"
              {...register('imageHint')}
              placeholder="e.g. 'space arcade'"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iframeUrl">Game Iframe URL</Label>
            <Input
              id="iframeUrl"
              type="url"
              {...register('iframeUrl', { required: true })}
              placeholder="https://gametime.com/embed/..."
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="reward">Reward Coins</Label>
            <Input
              id="reward"
              type="number"
              {...register('reward', { required: true, valueAsNumber: true })}
              defaultValue={5}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Game
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GameList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const gamesCollection = useMemo(() => collection(firestore, 'games'), [firestore]);
    const { data: games, isLoading } = useCollection<Game>(gamesCollection);

    const handleDelete = async (gameId: string) => {
        try {
            await deleteDoc(doc(firestore, 'games', gameId));
            toast({
                title: 'Game Deleted',
                description: 'The game has been removed.',
            });
        } catch (error: any) {
            console.error("Error deleting game: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the game.',
            });
        }
    };

    if (isLoading) {
        return <p>Loading games...</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Games</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games?.map(game => (
                    <Card key={game.id} className="group relative">
                        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                           <Image src={game.imageUrl} alt={game.title} fill className="object-cover" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg">{game.title}</h3>
                            <p className="text-sm text-muted-foreground">{game.reward} coins</p>
                        </div>
                        <div className="absolute top-2 right-2">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete the game "{game.title}". This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(game.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                ))}
                {games?.length === 0 && <p className='text-muted-foreground'>No games found.</p>}
            </CardContent>
        </Card>
    )
}

export default function AdminGamesPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Manage Games"
        description="Add, edit, or delete games available in the app."
      />
      <div className="space-y-8">
        <AddGameForm />
        <GameList />
      </div>
    </AdminAuthWrapper>
  );
}
