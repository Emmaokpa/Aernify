
'use client';
import { useState }from 'react';
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
import Image from 'next/image';
import { GameForm } from '@/components/admin/forms/game-form';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';


type Game = {
  name: string;
  playgamaId: string;
  imageUrl: string;
  rewardAmount: number;
}


export default function AdminGamesPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<WithId<Game> | undefined>(undefined);
  const firestore = useFirestore();
  const { toast } = useToast();

  const gamesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'games'),
    [firestore]
  );
  
  const { data: games, isLoading } = useCollection<Game>(gamesCollectionRef);

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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem deleting the game.',
      });
    }
  };


  return (
    <>
      <PageHeader
        title="Manage Games"
        description="Add, edit, or delete games available in the app."
      />
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Add New Game
        </Button>
      </div>

      <GameForm 
        isOpen={isFormOpen} 
        setOpen={setFormOpen}
        game={selectedGame}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Playgama ID</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="w-16 h-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && games?.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <Image src={game.imageUrl} alt={game.name} width={64} height={64} className="rounded" />
                  </TableCell>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>{game.playgamaId}</TableCell>
                  <TableCell>{game.rewardAmount}</TableCell>
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

    