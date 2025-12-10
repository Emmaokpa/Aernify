'use client';
import { useState, useMemo, useEffect } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Coins, Loader2, CheckCircle, Clock, ExternalLink } from "lucide-react";
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

function SubmitOfferDialog({ offer, children, disabled }: { offer: Offer, children: React.ReactNode, disabled?: boolean }) {
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
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Proof for: {offer.title}</DialogTitle>
          <DialogDescription>
            Upload a screenshot or other proof of completion to receive your reward. Your submission will be reviewed by an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <p className="font-medium">Upload your proof of completion</p>
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
            Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OfferList() {
  const firestore = useFirestore();
  const { user } = useUser();

  const offersCollection = useMemo(() => collection(firestore, 'offers'), [firestore]);
  const { data: offers, isLoading: isLoadingOffers } = useCollection<Offer>(offersCollection);

  const submissionsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'offer_submissions'), where('userId', '==', user.uid));
  }, [firestore, user]);
  const { data: submissions, isLoading: isLoadingSubmissions } = useCollection<OfferSubmission>(submissionsQuery);

  const isLoading = isLoadingOffers || (user && isLoadingSubmissions);
  
  const augmentedOffers = useMemo(() => {
    if (!offers) return [];
    
    if (!submissions) {
        return offers.map(offer => ({ ...offer, status: null }));
    }
    
    const submissionMap = new Map(submissions.map(s => [s.offerId, s]));
    
    return offers
      .map(offer => {
        const submission = submissionMap.get(offer.id);
        const status = submission ? submission.status : null;
        return { ...offer, status };
      })
      .filter(offer => offer.status !== 'approved');

  }, [offers, submissions]);

  if (isLoading) {
     return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {Array.from({ length: 3 }).map((_, i) => <OfferSkeleton key={i} />)}
       </div>
     )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {augmentedOffers.map((offer) => {
        const isPending = offer.status === 'pending';
        return (
          <Card key={offer.id} className="overflow-hidden flex flex-col rounded-2xl group">
            <CardHeader className="p-0 relative">
               <div className="relative aspect-[16/9]">
                <Image
                  src={offer.imageUrl}
                  alt={offer.title}
                  fill
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={offer.imageHint}
                />
              </div>
              {isPending && (
                <Badge variant="outline" className="absolute top-3 right-3 text-amber-600 border-amber-500/30 bg-amber-500/20 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Pending Review
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <p className="text-sm text-muted-foreground">{offer.company}</p>
              <h3 className="text-lg font-semibold">{offer.title}</h3>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
               <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                <Coins className="w-5 h-5" />
                <span>{offer.reward.toLocaleString()}</span>
              </div>
              <div className="w-full flex flex-col sm:flex-row gap-2">
                 <Button asChild className="w-full">
                    <a href={offer.link} target="_blank" rel="noopener noreferrer">
                    Start Offer <ExternalLink className='ml-2 h-4 w-4' />
                    </a>
                </Button>
                <SubmitOfferDialog offer={offer} disabled={isPending}>
                    <Button variant="outline" className="w-full" disabled={isPending}>
                        {isPending ? 'Submitted' : 'Submit Proof'}
                    </Button>
                </SubmitOfferDialog>
              </div>
            </CardFooter>
          </Card>
        )
      })}
      {!isLoading && augmentedOffers.length === 0 && (
        <div className="col-span-full text-center py-20 rounded-lg bg-card border">
            <CheckCircle className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">All Caught Up!</h3>
            <p className="mt-2 text-muted-foreground">
            You've completed all available offers. Check back later for new ones.
            </p>
        </div>
      )}
    </div>
  );
}

function OfferSkeleton() {
  return (
     <Card className="overflow-hidden flex flex-col rounded-2xl group">
        <CardHeader className="p-0">
          <Skeleton className="aspect-[16/9] w-full" />
        </CardHeader>
        <CardContent className="p-4 flex-grow space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
            <Skeleton className="h-7 w-1/3" />
            <div className="w-full flex flex-col sm:flex-row gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
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
      <OfferList />
    </>
  );
}
