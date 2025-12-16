
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
import { Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function GrantAdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [targetUid, setTargetUid] = useState('');

  const handleGrantAdmin = async () => {
    if (!targetUid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a User ID.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const userToUpdateRef = doc(firestore, 'users', targetUid);
      await updateDoc(userToUpdateRef, {
        isAdmin: true,
      });
      toast({
        title: 'Success!',
        description: `Admin privileges granted to user ${targetUid}.`,
      });
      // Refreshing the page will reload the user's profile and token
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to grant admin privileges:', error);
      toast({
        variant: 'destructive',
        title: 'Grant Failed',
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
        title="Admin: Grant Privileges"
        description="Grant admin status to a user by updating their profile."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Grant Admin Status</CardTitle>
            <CardDescription>
              Enter the User ID (UID) of the user you want to make an admin.
              This will set their `isAdmin` field to `true` in Firestore.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertTriangle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Warning: Use with caution.</h4>
                <p className="text-sm">
                  Granting admin privileges gives a user full control over the
                  admin dashboard features. Only grant this to trusted users.
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

            <Button onClick={handleGrantAdmin} disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <UserCheck className="mr-2 h-4 w-4" />
              Grant Admin Privileges
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
