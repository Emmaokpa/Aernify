
'use client';
import { useState, useEffect }from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { WithId } from '@/firebase/firestore/use-collection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const GameForm = dynamic(() => import('@/components/admin/forms/game-form').then(mod => mod.GameForm), { ssr: false });

type Game = {
  name: string;
  iframeUrl: string;
  imageUrl: string;
}


export default function AdminGamesPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<WithId<Game> | undefined>(undefined);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const gamesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  
  const { data: games, isLoading, error } = useCollection<Game>(gamesCollectionRef);
  
  useEffect(() => {
    if (error) {
        toast({
            variant: "destructive",
            title: "Error fetching games",
            description: "You may not have permission to view this data.",
        });
    }
  }, [error, toast]);


  const handleEdit = (game: WithId<Game>) => {
    setSelectedGame(game);
    setFormOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedGame(undefined);
    setFormOpen(true);
  }

  const handleDelete = async (gameId: string) => {
    if(!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'games', gameId));
      toast({
        title: 'Game Deleted',
        description: 'The game has been successfully deleted.',
      });
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem deleting the game. You may not have permission.',
      });
    }
  };
  
  const handleFormSuccess = () => {
    toast({
        title: selectedGame ? 'Game Updated' : 'Game Created',
        description: `The game has been successfully ${selectedGame ? 'updated' : 'created'}.`,
    });
  }

  return (
    <>
      <PageHeader
        title="Manage Games"
        description="Add, edit, or delete iframe games available in the app."
      />
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Add New Game
        </Button>
      </div>

      {isFormOpen && (
        <GameForm 
          isOpen={isFormOpen} 
          setOpen={setFormOpen}
          game={selectedGame}
          onSuccess={handleFormSuccess}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>iFrame URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="w-16 h-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && games?.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    {game.imageUrl ? (
                        <Image
                            src={game.imageUrl}
                            alt={game.name}
                            width={64}
                            height={64}
                            className="rounded object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No Image</span>
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell className='truncate max-w-xs'>{game.iframeUrl}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(game)}>
                      <Edit />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the game
                            from your database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(game.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
