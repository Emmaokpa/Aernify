
'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, writeBatch, increment, query, where } from 'firebase/firestore';
import type { RedemptionRequest } from '@/lib/types';
import { Loader2, Check, X, FileQuestion, User, Coins, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

function RedemptionList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRedemptionsQuery = useMemo(() => {
    return query(collection(firestore, 'redemption_requests'), where('status', '==', 'pending'));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection<RedemptionRequest>(pendingRedemptionsQuery);

  const handleDecision = async (request: RedemptionRequest, decision: 'approve' | 'reject') => {
    setProcessingId(request.id);

    const batch = writeBatch(firestore);
    const requestRef = doc(firestore, 'redemption_requests', request.id);

    // Update request status
    batch.update(requestRef, { status: decision === 'approve' ? 'approved' : 'rejected' });

    // If rejected, refund the user's coins
    if (decision === 'reject') {
      const userRef = doc(firestore, 'users', request.userId);
      batch.update(userRef, { coins: increment(request.coinsSpent) });
    }

    try {
      await batch.commit();
      toast({
        title: `Request ${decision === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The request from ${request.userDisplayName} has been processed.`,
      });
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process the request. Please try again.',
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
           <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (requests?.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg bg-card border">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">All Clear!</h3>
        <p className="mt-2 text-muted-foreground">
          There are no pending redemption requests to review.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {requests?.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary"/>${request.giftCardValue} {request.giftCardName}</CardTitle>
            <CardDescription className='space-y-1 pt-2'>
                <div className='flex items-center gap-2 text-sm'>
                    <User className='w-4 h-4' />
                    <span>{request.userDisplayName}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                    <Coins className='w-4 h-4 text-primary' />
                    <span className='font-semibold text-primary'>{request.coinsSpent.toLocaleString()} Coins</span>
                </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground text-right">
              Requested {request.requestedAt ? formatDistanceToNow(request.requestedAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecision(request, 'reject')}
              disabled={processingId === request.id}
            >
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
            <Button
              size="sm"
              onClick={() => handleDecision(request, 'approve')}
              disabled={processingId === request.id}
              className='bg-green-600 hover:bg-green-700'
            >
              {processingId === request.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1 h-4 w-4" />
              )}
              Approve
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function AdminVerifyRedemptionsPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Verify Redemptions"
        description="Approve or reject user requests for gift card redemptions."
      />
      <div className="space-y-8">
        <RedemptionList />
      </div>
    </AdminAuthWrapper>
  );
}
