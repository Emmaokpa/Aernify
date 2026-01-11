'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
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
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

async function callLeaderboardApi(action: 'reset' | 'update') {
  const response = await fetch('/api/admin/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Failed to ${action} leaderboard.`);
  }
  return result;
}

export default function AdminLeaderboardPage() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await callLeaderboardApi('reset');
      toast({
        title: 'Leaderboard Reset!',
        description: `Successfully reset weekly coins for ${result.usersAffected} users.`,
      });
    } catch (error: any) {
      console.error('Failed to reset leaderboard:', error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await callLeaderboardApi('update');
       toast({
        title: 'Leaderboard Updated!',
        description: `Public leaderboard now reflects the latest scores for ${result.usersUpdated} users.`,
      });
    } catch (error: any) {
      console.error('Failed to update leaderboard:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Leaderboard Management"
        description="Manage the weekly leaderboard."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Public Leaderboard</CardTitle>
            <CardDescription>
              This action reads the top 50 users from the private `/users` collection and copies their public data to the `/leaderboard` collection. Run this to refresh the public rankings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleUpdate} disabled={isUpdating || isResetting}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Update Leaderboard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset Weekly Leaderboard</CardTitle>
            <CardDescription>
              This action will set the `weeklyCoins` for all users to 0. This should be done at the start of each new weekly competition.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mb-6">
              <AlertTriangle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Warning: Destructive Action</h4>
                <p className="text-sm">
                  This will permanently reset weekly progress for all users. It will also trigger a public leaderboard update.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isResetting || isUpdating}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Weekly Leaderboard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset the weekly score for every single user in the database to 0. This action is irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    disabled={isResetting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, reset the leaderboard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
