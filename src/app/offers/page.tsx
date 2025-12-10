'use client';
import { useState, useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Coins, Loader2, CheckCircle, Clock, XCircle, FileClock } from "lucide-react";
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import type { Offer, OfferSubmission } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import ImageUploadForm from '@/components/image-upload-form';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function SubmitOfferDialog({ offer }: { offer: Offer }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, profile } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!proofImageUrl) {
      setError("Please upload an image as proof of completion.");
      return;
    }
    if (!user || !profile) {
      setError("You must be logged in to submit an offer.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const submissionsCollection = collection(firestore, 'offer_submissions');
      await addDoc(submissionsCollection, {
        userId: user.uid,
        userDisplayName: profile.displayName || 'Anonymous',
        offerId: offer.id,
        offerTitle: offer.title,
        reward: offer.reward,
        proofImageUrl: proofImageUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      toast({
        title: 'Submission Received!',
        description: `Your submission for "${offer.title}" is pending review.`,
      });
      setIsDialogOpen(false);
      setProofImageUrl(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit offer. Please try again.');
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Submit for Verification</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit: {offer.title}</DialogTitle>
          <DialogDescription>
            Upload a screenshot or proof of completion to receive your reward. Your submission will be reviewed by an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <p className="font-medium">Step 1: Complete the offer</p>
            <Button variant="outline" asChild>
              <a href={offer.link} target="_blank" rel="noopener noreferrer">
                Go to Offer
              </a>
            </Button>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Step 2: Upload your proof</p>
            <ImageUploadForm onUploadSuccess={(url) => { setProofImageUrl(url); setError(null); }} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !proofImageUrl}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function OfferList() {
  const firestore = useFirestore();
  const offersCollection = useMemo(() => collection(firestore, 'offers'), [firestore]);
  const { data: offers, isLoading } = useCollection<Offer>(offersCollection);

  if (isLoading) {
     return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {Array.from({ length: 3 }).map((_, i) => <OfferSkeleton key={i} />)}
       </div>
     )
  }

  return (
    <div className="space-y-4">
      {offers?.map((offer) => (
        <Card key={offer.id} className="overflow-hidden group sm:flex">
          <div className="relative sm:w-1/3 aspect-[16/9] sm:aspect-auto">
            <Image
              src={offer.imageUrl}
              alt={offer.title}
              fill
              className="object-cover"
              data-ai-hint={offer.imageHint}
            />
          </div>
          <div className="flex flex-col flex-grow">
            <CardHeader>
              <CardTitle>{offer.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{offer.company}</p>
            </CardHeader>
            <CardContent className="flex-grow">
               <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                <Coins className="w-5 h-5" />
                <span>{offer.reward.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter>
              <SubmitOfferDialog offer={offer} />
            </CardFooter>
          </div>
        </Card>
      ))}
      {!isLoading && offers?.length === 0 && (
        <p className="text-muted-foreground col-span-full text-center py-10">No offers available right now. Check back later!</p>
      )}
    </div>
  );
}

function SubmissionHistory() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const submissionsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'offer_submissions'), where('userId', '==', user.uid));
  }, [firestore, user]);
  
  const { data: submissions, isLoading } = useCollection<OfferSubmission>(submissionsQuery);

  const StatusBadge = ({ status }: { status: OfferSubmission['status'] }) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3.5 h-3.5 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10"><Clock className="w-3.5 h-3.5 mr-1" /> Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {Array.from({length: 2}).map((_, i) => (
          <Card key={i} className='p-4 space-y-3'>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-5 w-1/2' />
              <Skeleton className='h-6 w-20' />
            </div>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-4 w-1/4' />
              <Skeleton className='h-4 w-1/3' />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-10">
        <FileClock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Submissions Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete an offer to see its status here.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {submissions.sort((a,b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis()).map(submission => (
        <Card key={submission.id} className='p-4'>
          <div className='flex justify-between items-start'>
            <div>
              <h4 className='font-semibold'>{submission.offerTitle}</h4>
               <p className="text-sm text-muted-foreground">
                Submitted {submission.submittedAt ? formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true }) : 'just now'}
              </p>
            </div>
            <StatusBadge status={submission.status} />
          </div>
          <div className='flex justify-between items-center mt-2'>
            <div className="font-semibold text-primary flex items-center gap-1.5 text-md">
              <Coins className="w-4 h-4" />
              <span>{submission.reward.toLocaleString()}</span>
            </div>
            <a href={submission.proofImageUrl} target="_blank" rel="noopener noreferrer" className='text-sm text-muted-foreground hover:underline'>View Proof</a>
          </div>
        </Card>
      ))}
    </div>
  )
}

function OfferSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col group">
      <CardHeader className="p-0">
        <Skeleton className="aspect-[16/9] w-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}


export default function AffiliatePage() {
  return (
    <>
      <PageHeader
        title="Affiliate Offers"
        description="Earn big rewards by completing offers from our partners."
      />
      <Tabs defaultValue="offers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="offers" className="mt-6">
          <OfferList />
        </TabsContent>
        <TabsContent value="submissions" className="mt-6">
          <SubmissionHistory />
        </TabsContent>
      </Tabs>
    </>
  );
}
