'use client';

import { useState } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { WithId } from '@/firebase';

import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { GameForm } from '@/components/admin/forms/game-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define the shape of a Game document
export type Game = {
  name: string;
  provider: string;
  iframeUrl: string;
  imageUrl: string;
  reward: number;
  createdAt?: any;
  updatedAt?: any;
};

export default function ManageGamesPage() {
  // --- STATE MANAGEMENT (Phase 4) ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<WithId<Game> | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- PHASE 1: CORE SETUP & READ OPERATION ---
  const firestore = useFirestore();
  const gamesCollectionRef = useMemoFirebase(() => collection(firestore, 'games'), [firestore]);
  const { data: games, isLoading: areGamesLoading, error: readError } = useCollection<Game>(gamesCollectionRef);

  const handleAddNew = () => {
    setSelectedGame(null);
    setIsFormOpen(true);
    setFeedbackMessage(null);
  };

  const handleEdit = (game: WithId<Game>) => {
    setSelectedGame(game);
    setIsFormOpen(true);
    setFeedbackMessage(null);
  };
  
  // --- PHASE 3: DELETE OPERATION ---
  const handleDelete = async (gameId: string) => {
    setFeedbackMessage(null);
    try {
      const gameDocRef = doc(firestore, 'games', gameId);
      await deleteDoc(gameDocRef);
      setFeedbackMessage({ type: 'success', message: 'Game deleted successfully!' });
    } catch (error: any) {
      console.error("Delete failed:", error);
      setFeedbackMessage({ type: 'error', message: `DELETE FAILED: ${error.code} - ${error.message}` });
    }
  };

  const handleFormSuccess = (message: string) => {
    setIsFormOpen(false);
    setFeedbackMessage({ type: 'success', message });
  };
  
  const handleFormError = (message: string) => {
    // Keep form open to show the error
    setFeedbackMessage({ type: 'error', message });
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setFeedbackMessage(null);
  }

  return (
    <>
      <PageHeader
        title="Manage Games"
        description="Add, edit, or remove games from your application."
      />

      {/* --- PHASE 4: UI FEEDBACK MECHANISM --- */}
      {feedbackMessage && (
        <Alert variant={feedbackMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          {feedbackMessage.type === 'error' 
             ? <XCircle className="h-4 w-4" /> 
             : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{feedbackMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{feedbackMessage.message}</AlertDescription>
        </Alert>
      )}

      {readError && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Read Error</AlertTitle>
            <AlertDescription>
              Could not load games from the database. Please check your connection and permissions.
              <br />
              Details: {readError.message}
            </AlertDescription>
          </Alert>
        )}

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2" />
              Add New Game
            </Button>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Provider</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areGamesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : games && games.length > 0 ? (
                  games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{game.provider}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                           <Button variant="outline" size="icon" onClick={() => handleEdit(game)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the game "{game.name}". This action cannot be undone.
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      No games found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <GameForm 
          game={selectedGame}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
          onCancel={handleFormCancel}
        />
      )}
    </>
  );
}
