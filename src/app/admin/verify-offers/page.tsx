'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, writeBatch, increment, query, where } from 'firebase/firestore';
import type { OfferSubmission } from '@/lib/types';
import Image from 'next/image';
import { Loader2, Check, X, FileQuestion, User, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

function SubmissionList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingSubmissionsQuery = useMemo(() => {
    return query(collection(firestore, 'offer_submissions'), where('status', '==', 'pending'));
  }, [firestore]);

  const { data: submissions, isLoading } = useCollection<OfferSubmission>(pendingSubmissionsQuery);

  const handleDecision = async (submission: OfferSubmission, decision: 'approve' | 'reject') => {
    setProcessingId(submission.id);

    const batch = writeBatch(firestore);
    const submissionRef = doc(firestore, 'offer_submissions', submission.id);

    // Update submission status
    batch.update(submissionRef, { status: decision === 'approve' ? 'approved' : 'rejected' });

    // If approved, update user's coin balance
    if (decision === 'approve') {
      const userRef = doc(firestore, 'users', submission.userId);
      batch.update(userRef, { coins: increment(submission.reward) });
    }

    try {
      await batch.commit();
      toast({
        title: `Submission ${decision === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The submission from ${submission.userDisplayName} has been processed.`,
      });
    } catch (error: any) {
      console.error('Error processing submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process the submission. Please try again.',
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
            <CardContent>
              <Skeleton className="aspect-video w-full rounded-md" />
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

  if (submissions?.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg bg-card border">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">All Clear!</h3>
        <p className="mt-2 text-muted-foreground">
          There are no pending submissions to review.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions?.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <CardTitle>{submission.offerTitle}</CardTitle>
            <CardDescription className='space-y-1'>
                <div className='flex items-center gap-2'>
                    <User className='w-4 h-4' />
                    <span>{submission.userDisplayName} ({submission.userId.substring(0, 6)}...)</span>
                </div>
                <div className='flex items-center gap-2'>
                    <Coins className='w-4 h-4 text-primary' />
                    <span className='font-semibold text-primary'>{submission.reward} Coins</span>
                </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className='text-sm font-medium'>Proof of Completion:</p>
             <a href={submission.proofImageUrl} target="_blank" rel="noopener noreferrer" className='block'>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border hover:opacity-80 transition-opacity">
                    <Image
                        src={submission.proofImageUrl}
                        alt={`Proof for ${submission.offerTitle}`}
                        fill
                        className="object-cover"
                    />
                </div>
             </a>
            <p className="text-xs text-muted-foreground text-right">
              Submitted {submission.submittedAt ? formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecision(submission, 'reject')}
              disabled={processingId === submission.id}
            >
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
            <Button
              size="sm"
              onClick={() => handleDecision(submission, 'approve')}
              disabled={processingId === submission.id}
              className='bg-green-600 hover:bg-green-700'
            >
              {processingId === submission.id ? (
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

export default function AdminVerifyOffersPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Verify Offers"
        description="Approve or reject user submissions for affiliate offers."
      />
      <div className="space-y-8">
        <SubmissionList />
      </div>
    </AdminAuthWrapper>
  );
}
