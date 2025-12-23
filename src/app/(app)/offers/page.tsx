
'use client';
import { useState, useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Coins, Loader2, CheckCircle, Clock, ExternalLink, DollarSign, Sparkles } from "lucide-react";
import { useFirestoreQuery, usePublicFirestoreQuery, useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import type { Offer, AffiliateProduct } from '@/lib/types';
import type { OfferSubmission, AffiliateSaleSubmission } from '@/lib/types';
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
import { incrementChallengeProgress } from '@/lib/challenges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateSalesCopy } from '@/ai/flows/sales-copy-flow';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Submission dialog for simple offers
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
      await addDoc(collection(firestore, 'offer_submissions'), {
        userId: user.uid,
        userDisplayName: profile.displayName || 'Anonymous',
        offerId: offer.id,
        offerTitle: offer.title,
        reward: offer.reward,
        proofImageUrl: proofImageUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      await incrementChallengeProgress(firestore, user.uid, 'completeOffer');
      toast({
        title: 'Submission Received!',
        description: `Your submission for "${offer.title}" is pending review.`,
      });
      setIsDialogOpen(false);
      setProofImageUrl(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit offer. Please try again.');
      toast({ variant: 'destructive', title: 'An error occurred.', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Proof for: {offer.title}</DialogTitle>
          <DialogDescription>
            Upload a screenshot or other proof of completion to receive your reward. Your submission will be reviewed by an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive px-1">{error}</p>}
          <ImageUploadForm onUploadSuccess={(url) => { setProofImageUrl(url); setError(null); }} />
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !proofImageUrl}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Submission dialog for affiliate sales
function SubmitSaleDialog({ product, children, disabled }: { product: AffiliateProduct, children: React.ReactNode, disabled?: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, profile } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofOfSale, setProofOfSale] = useState<string>('');

  const handleSubmit = async () => {
    if (!proofOfSale) {
      setError("Please provide a transaction ID or buyer email as proof of sale.");
      return;
    }
    if (!user || !profile) {
      setError("You must be logged in to submit a sale.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(firestore, 'affiliate_sale_submissions'), {
        userId: user.uid,
        userDisplayName: profile.displayName || 'Anonymous',
        affiliateProductId: product.id,
        affiliateProductTitle: product.title,
        reward: product.reward,
        proofOfSale: proofOfSale,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      toast({
        title: 'Sale Submitted!',
        description: `Your submission for "${product.title}" is pending review.`,
      });
      setIsDialogOpen(false);
      setProofOfSale('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit sale. Please try again.');
      toast({ variant: 'destructive', title: 'An error occurred.', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Sale Proof: {product.title}</DialogTitle>
          <DialogDescription>
            Enter the transaction ID or buyer's email from the sale you generated to receive your reward. This will be verified by an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive px-1">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="proof-of-sale">Transaction ID or Buyer's Email</Label>
            <Input id="proof-of-sale" value={proofOfSale} onChange={(e) => setProofOfSale(e.target.value)} />
          </div>
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !proofOfSale}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// AI Sales Copy Generator Dialog (VIP Only)
function SalesCopyGeneratorDialog({ product, children, disabled }: { product: AffiliateProduct, children: React.ReactNode, disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<'Tweet' | 'Facebook Post' | 'Email'>('Tweet');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedCopy('');
    try {
      const result = await generateSalesCopy({
        productName: product.title,
        productDescription: product.description,
        productUrl: product.productUrl,
        format: format,
      });
      setGeneratedCopy(result.salesCopy);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate sales copy.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCopy);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Sales Assistant (VIP)</DialogTitle>
          <DialogDescription>
            Generate marketing copy for &quot;{product.title}&quot; to use in your promotions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <Label className="font-semibold">Choose a format:</Label>
            <RadioGroup defaultValue="Tweet" className="mt-2 grid grid-cols-3 gap-4" onValueChange={(value: 'Tweet' | 'Facebook Post' | 'Email') => setFormat(value)}>
              <div>
                <RadioGroupItem value="Tweet" id="r1" className="sr-only" />
                <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">Tweet</Label>
              </div>
              <div>
                <RadioGroupItem value="Facebook Post" id="r2" className="sr-only" />
                <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">Facebook Post</Label>
              </div>
              <div>
                <RadioGroupItem value="Email" id="r3" className="sr-only" />
                <Label htmlFor="r3" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">Email</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Copy
          </Button>

          {generatedCopy && (
            <div className="space-y-2">
              <Label>Generated Copy:</Label>
              <Textarea value={generatedCopy} readOnly rows={8} />
              <Button onClick={handleCopy} variant="secondary" className="w-full">Copy Text</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function OfferList() {
  const firestore = useFirestore();

  const { data: offers, isLoading: isLoadingOffers } = usePublicFirestoreQuery<Offer>(
    () => collection(firestore, 'offers')
  );

  const { data: submissions, isLoading: isLoadingSubmissions } = useFirestoreQuery<OfferSubmission>(
    (uid) => query(collection(firestore, 'offer_submissions'), where('userId', '==', uid))
  );

  const isLoading = isLoadingOffers || isLoadingSubmissions;
  
  const augmentedOffers = useMemo(() => {
    if (!offers) return [];
    if (!submissions) return offers.map(offer => ({ ...offer, status: null }));
    const submissionMap = new Map(submissions.map(s => [s.offerId, s]));
    return offers
      .map(offer => ({ ...offer, status: submissionMap.get(offer.id)?.status || null }))
      .filter(offer => offer.status !== 'approved');
  }, [offers, submissions]);

  if (isLoading) {
     return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3.5] rounded-2xl" />)}
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
                <div className="relative aspect-video">
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
              <h3 className="text-lg font-semibold leading-tight">{offer.title}</h3>
              <div className="font-bold text-primary flex items-center gap-1.5 text-lg mt-2">
                <Coins className="w-5 h-5" />
                <span>{offer.reward.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-card">
              <div className="flex w-full gap-2">
                 <Button asChild className="flex-1 rounded-full" size="sm">
                    <a href={offer.link} target="_blank" rel="noopener noreferrer">
                    Start <ExternalLink className='ml-1.5 h-4 w-4' />
                    </a>
                </Button>
                <SubmitOfferDialog offer={offer} disabled={isPending}>
                    <Button variant="secondary" className="flex-1 rounded-full" size="sm" disabled={isPending}>
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

function AffiliateProductList() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const { data: products, isLoading: isLoadingProducts } = usePublicFirestoreQuery<AffiliateProduct>(
      () => collection(firestore, 'affiliate_products')
  );

  const { data: submissions, isLoading: isLoadingSubmissions } = useFirestoreQuery<AffiliateSaleSubmission>(
    (uid) => query(collection(firestore, 'affiliate_sale_submissions'), where('userId', '==', uid))
  );

  const isLoading = isLoadingProducts || isLoadingSubmissions;
  
  const augmentedProducts = useMemo(() => {
    if (!products) return [];
    if (!submissions) return products.map(p => ({ ...p, status: null }));
    const submissionMap = new Map(submissions.map(s => [s.affiliateProductId, s]));
    return products
      .map(p => ({ ...p, status: submissionMap.get(p.id)?.status || null }))
      .filter(p => p.status !== 'approved');
  }, [products, submissions]);

  if (isLoading) {
     return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3.5] rounded-2xl" />)}
       </div>
     )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {augmentedProducts.map((product) => {
        const isPending = product.status === 'pending';
        const isVip = profile?.isVip ?? false;
        
        const salesAssistantButton = (
          <SalesCopyGeneratorDialog product={product} disabled={!isVip}>
            <Button variant="default" className="w-full rounded-full" size="sm" disabled={!isVip}>
                <Sparkles className="w-4 h-4 mr-2" /> AI Sales Assistant
            </Button>
          </SalesCopyGeneratorDialog>
        );

        return (
          <Card key={product.id} className="overflow-hidden flex flex-col rounded-2xl group">
             <CardHeader className="p-0 relative">
                <div className="relative aspect-video">
                    <Image src={product.imageUrl} alt={product.title} fill className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" data-ai-hint={product.imageHint} />
                </div>
                 {isPending && (
                    <Badge variant="outline" className="absolute top-3 right-3 text-amber-600 border-amber-500/30 bg-amber-500/20 backdrop-blur-sm">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Pending Review
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <p className="text-sm text-muted-foreground">{product.vendor}</p>
              <h3 className="text-lg font-semibold leading-tight">{product.title}</h3>
              <div className="font-bold text-primary flex items-center gap-1.5 text-lg mt-2">
                <Coins className="w-5 h-5" />
                <span>{product.reward.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-card flex-col gap-2">
              {!isVip ? (
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="w-full">{salesAssistantButton}</TooltipTrigger>
                    <TooltipContent>
                      <p>Upgrade to VIP to use the AI Sales Assistant!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                salesAssistantButton
              )}

              <div className="flex w-full gap-2">
                 <Button asChild className="flex-1 rounded-full" size="sm" variant="secondary">
                    <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                    Get Link <ExternalLink className='ml-1.5 h-4 w-4' />
                    </a>
                </Button>
                <SubmitSaleDialog product={product} disabled={isPending}>
                    <Button variant="secondary" className="flex-1 rounded-full" size="sm" disabled={isPending}>
                        {isPending ? 'Submitted' : 'Submit Sale'}
                    </Button>
                </SubmitSaleDialog>
              </div>
            </CardFooter>
          </Card>
        )
      })}
      {!isLoading && augmentedProducts.length === 0 && (
        <div className="col-span-full text-center py-20 rounded-lg bg-card border">
            <CheckCircle className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No Products Available</h3>
            <p className="mt-2 text-muted-foreground">
            There are no affiliate products to promote right now.
            </p>
        </div>
      )}
    </div>
  );
}

export default function AffiliatePage() {
  return (
    <>
      <PageHeader
        title="Affiliate Hub"
        description="Earn rewards by completing simple offers or promoting high-value products."
      />
      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offers">
            <Coins className="w-4 h-4 mr-2" /> Simple Offers
          </TabsTrigger>
          <TabsTrigger value="affiliate">
            <DollarSign className="w-4 h-4 mr-2" /> Affiliate Products
          </TabsTrigger>
        </TabsList>
        <TabsContent value="offers" className="mt-6">
          <OfferList />
        </TabsContent>
        <TabsContent value="affiliate" className="mt-6">
          <AffiliateProductList />
        </TabsContent>
      </Tabs>
    </>
  );
}
