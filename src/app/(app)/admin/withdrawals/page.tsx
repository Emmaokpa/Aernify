
'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, usePublicFirestoreQuery } from '@/firebase';
import { collection, doc, writeBatch, increment, query, where, orderBy } from 'firebase/firestore';
import type { WithdrawalRequest } from '@/lib/types';
import { Loader2, Check, X, FileQuestion, User, Coins, Banknote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type RequestStatus = 'pending' | 'processed' | 'rejected';

function WithdrawalList({ status }: { status: RequestStatus }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading } = usePublicFirestoreQuery<WithdrawalRequest>(
      () => query(
        collection(firestore, 'withdrawal_requests'),
        where('status', '==', status),
        orderBy('requestedAt', 'desc')
      )
  );

  const handleStatusChange = async (requestId: string, coinsToWithdraw: number, userId: string, newStatus: RequestStatus) => {
    setProcessingId(requestId);
    const batch = writeBatch(firestore);
    const requestRef = doc(firestore, 'withdrawal_requests', requestId);

    batch.update(requestRef, { status: newStatus });

    // If request is rejected, refund the user's coins
    if (newStatus === 'rejected') {
      const userRef = doc(firestore, 'users', userId);
      batch.update(userRef, { coins: increment(coinsToWithdraw) });
    }

    try {
      await batch.commit();
      toast({
        title: 'Request Status Updated',
        description: `The request has been marked as ${newStatus}.`,
      });
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update the request status.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (requests?.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg bg-card border">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Requests Found</h3>
        <p className="mt-2 text-muted-foreground">
          There are no withdrawal requests with the status &quot;{status}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {requests?.map((req) => (
        <Card key={req.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{formatToNaira(req.nairaAmount)}</CardTitle>
                <CardDescription>
                  From {req.userDisplayName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary font-bold">
                  <Coins className="w-4 h-4" />
                  <span>{req.coinsToWithdraw.toLocaleString()}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="text-sm border-t pt-4">
                <h4 className="font-semibold mb-2">Bank Details</h4>
                <p><strong>Bank:</strong> {req.bankDetails.bankName}</p>
                <p><strong>Account Name:</strong> {req.bankDetails.accountName}</p>
                <p><strong>Account Number:</strong> {req.bankDetails.accountNumber}</p>
             </div>
             <p className="text-xs text-muted-foreground text-right">
              Requested {req.requestedAt ? formatDistanceToNow(req.requestedAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={processingId === req.id} className="capitalize w-36">
                 {processingId === req.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                     {req.status === 'pending' && <Banknote className="mr-2 h-4 w-4" />}
                     {req.status === 'processed' && <Check className="mr-2 h-4 w-4" />}
                     {req.status === 'rejected' && <X className="mr-2 h-4 w-4" />}
                    </>
                  )}
                  {req.status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange(req.id, req.coinsToWithdraw, req.userId, 'processed')} disabled={req.status === 'processed'}>
                    <Check className="mr-2 h-4 w-4" /> Mark as Processed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(req.id, req.coinsToWithdraw, req.userId, 'rejected')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <X className="mr-2 h-4 w-4" /> Mark as Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Process Withdrawals"
        description="Review and process user requests to withdraw coins for Naira."
      />
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <WithdrawalList status="pending" />
        </TabsContent>
        <TabsContent value="processed">
          <WithdrawalList status="processed" />
        </TabsContent>
        <TabsContent value="rejected">
          <WithdrawalList status="rejected" />
        </TabsContent>
      </Tabs>
    </AdminAuthWrapper>
  );
}
