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
import { resetWeeklyLeaderboard } from '@/ai/flows/leaderboard-flow';

export default function AdminLeaderboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const result = await resetWeeklyLeaderboard();
      if (result.success) {
        toast({
          title: 'Leaderboard Reset!',
          description: `Successfully reset weekly coins for ${result.usersAffected} users.`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Failed to reset leaderboard:', error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Leaderboard Management"
        description="Manage the weekly leaderboard."
      />
      <Card>
        <CardHeader>
          <CardTitle>Reset Weekly Leaderboard</CardTitle>
          <CardDescription>
            This action will set the `weeklyCoins` for all users to 0. This
            should be done at the start of each new weekly competition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertTriangle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Warning: This is a destructive action.</h4>
              <p className="text-sm">
                This action cannot be undone. It will permanently reset all weekly progress for all users. Please be certain before proceeding.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-6">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Weekly Leaderboard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the weekly score for every single user in the
                  database to 0. This action is irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Yes, reset the leaderboard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </AdminAuthWrapper>
  );
}

    