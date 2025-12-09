'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { games as staticGames, type Game } from '@/lib/data';
import { GameForm } from '@/components/admin/forms/game-form';

export default function ManageGamesPage() {
  const [games, setGames] = useState(staticGames);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const handleAddNew = () => {
    setSelectedGame(null);
    setIsFormOpen(true);
  };

  const handleEdit = (game: Game) => {
    setSelectedGame(game);
    setIsFormOpen(true);
  };

  const handleDelete = (gameId: string) => {
    setGames(games.filter(game => game.id !== gameId));
  };
  
  const handleSave = (gameData: Game) => {
    if (selectedGame) {
      setGames(games.map(g => g.id === gameData.id ? gameData : g));
    } else {
      setGames([...games, { ...gameData, id: `g${games.length + 1}` }]);
    }
    setIsFormOpen(false);
    setSelectedGame(null);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedGame(null);
  };

  return (
    <>
      <PageHeader
        title="Manage Games"
        description="Add, edit, or remove games from your application."
      />

      <Card>
        <CardContent className="p-6">
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
                {games.length > 0 ? (
                  games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.title}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">{game.provider}</TableCell>
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
                                  This will permanently delete the game "{game.title}". This action cannot be undone.
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

      {isFormOpen && (
        <GameForm
          game={selectedGame}
          onSave={handleSave}
          onCancel={handleFormCancel}
        />
      )}
    </>
  );
}
