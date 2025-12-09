'use client';

import { useState } from 'react';
import { collection, doc, deleteDoc } from 'firebase/firestore';
// Import the necessary Auth hook
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'; 
import { useAuthContext } from '@/firebase/auth-provider';
import type { WithId } from '@/firebase';

import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ShieldOff, Loader2 } from 'lucide-react'; // Added Loader2 and ShieldOff
import { GameForm } from '@/components/admin/forms/game-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define the shape of a Game document, matching backend.json
export type Game = {
  name: string;
  iframeUrl: string;
  imageUrl: string;
};

export default function ManageGamesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<WithId<Game> | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuthContext();

  const firestore = useFirestore();
  const gamesCollectionRef = useMemoFirebase(() => collection(firestore, 'games'), [firestore]);
  const { data: games, isLoading: areGamesLoading, error: readError } = useCollection<Game>(gamesCollectionRef);

  const isPageLoading = isAuthLoading || areGamesLoading;
  
  const handleAddNew = () => {
    if (!isAdmin) return; 
    setSelectedGame(null);
    setIsFormOpen(true);
    setFeedback(null);
  };

  const handleEdit = (game: WithId<Game>) => {
    if (!isAdmin) return;
    setSelectedGame(game);
    setIsFormOpen(true);
    setFeedback(null);
  };
  
  const handleDelete = async (gameId: string) => {
    setFeedback(null);
    try {
      const gameDocRef = doc(firestore, 'games', gameId);
      await deleteDoc(gameDocRef);
      setFeedback({ type: 'success', message: 'Game deleted successfully!' });
    } catch (error: any) {
      console.error("Delete failed:", error);
      const errorMessage = error.code === 'permission-denied' 
        ? 'Delete failed: Permission Denied. Are you logged in as an Admin?' 
        : `Delete failed: ${error.message}`;
      setFeedback({ type: 'error', message: errorMessage });
    }
  };

  const handleFormSuccess = (message: string) => {
    setFeedback({ type: 'success', message });
    setTimeout(() => {
      setIsFormOpen(false);
      setSelectedGame(null); 
    }, 1500); 
  };
  
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedGame(null);
    setFeedback(null);
  }


  // Render Authentication/Loading States First
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-500">Checking administrator status...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Manage Games"
        description="Add, edit, or remove games from your application."
      />

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          {feedback.type === 'error' 
             ? <XCircle className="h-4 w-4" /> 
             : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{feedback.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {!isAuthenticated || !isAdmin ? (
         <Alert variant="destructive" className="mt-6">
          <ShieldOff className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in as an administrator to access and manage games.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {readError && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Read Error</AlertTitle>
                <AlertDescription>
                  Could not load games. Please check your connection and security rules.
                  <br />
                  Details: {readError.message}
                </AlertDescription>
              </Alert>
            )}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-end mb-4">
                <Button onClick={handleAddNew} disabled={isPageLoading}>
                  <PlusCircle className="mr-2" />
                  Add New Game
                </Button>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Iframe URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areGamesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-10 w-24 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : games && games.length > 0 ? (
                      games.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">{game.name}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs truncate">{game.iframeUrl}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(game)} disabled={isPageLoading}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" disabled={isPageLoading}>
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
                          No games found. Click "Add New Game" to start.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isFormOpen && (
        <GameForm 
          game={selectedGame}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </>
  );
}
