
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, ShieldAlert } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
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
import { add } from 'date-fns';

export default function ManageVipPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [targetUid, setTargetUid] = useState('');

  const handleVipUpdate = async (grant: boolean) => {
    const trimmedUid = targetUid.trim();
    if (!trimmedUid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a User ID.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const userToUpdateRef = doc(firestore, 'users', trimmedUid);
      const docSnap = await getDoc(userToUpdateRef);

      if (!docSnap.exists()) {
        throw new Error('User with this UID does not exist.');
      }

      let newExpiration: Timestamp | null = null;
      if (grant) {
        // Always set expiration to 30 days from now.
        newExpiration = Timestamp.fromDate(add(new Date(), { days: 30 }));
      }
      
      await updateDoc(userToUpdateRef, {
        vipExpiresAt: newExpiration
      });

      toast({
        title: 'Success!',
        description: `User ${trimmedUid} has been ${grant ? 'granted VIP status for 30 days' : 'had their VIP status revoked'}.`,
      });
    } catch (error: any) {
      console.error('Failed to update VIP status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description:
          error.message ||
          'An unknown error occurred. Check the console for details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Manage VIP Status"
        description="Grant or revoke VIP privileges for a user."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Update User VIP Status</CardTitle>
            <CardDescription>
              Enter the User ID (UID) of the user you want to modify. Granting VIP will provide access for 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <ShieldAlert className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Important</h4>
                <p className="text-sm text-foreground/80">
                  Manually changing VIP status does not process any payment. This tool is for administrative overrides.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uid-input">User ID (UID)</Label>
              <div className="flex gap-2">
                <Input
                  id="uid-input"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  placeholder="Enter user UID"
                />
                <Button
                  variant="secondary"
                  onClick={() => setTargetUid(user?.uid || '')}
                >
                  Set to My UID
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
               <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={isLoading}>
                            <Crown className="mr-2 h-4 w-4" />
                            Grant VIP (30 Days)
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to grant VIP?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will give user {targetUid.trim() || '...'} full VIP benefits for 30 days.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleVipUpdate(true)} disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Confirm Grant
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                            <Crown className="mr-2 h-4 w-4" />
                            Revoke VIP
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to revoke VIP?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will immediately remove all VIP benefits from user {targetUid.trim() || '...'}.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleVipUpdate(false)} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Revoke
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
