
'use client';
import { useState, useMemo } from 'react';
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
import { useForm, SubmitHandler } from 'react-hook-form';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useCollection,
} from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { Offer } from '@/lib/types';
import Image from 'next/image';
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

type OfferFormData = Omit<Offer, 'id'>;
type OfferWithId = Offer & { id: string };

function EditOfferForm({ offer }: { offer: OfferWithId }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<OfferFormData>({
    defaultValues: {
      ...offer,
      reward: Number(offer.reward),
    },
  });

  const onSubmit: SubmitHandler<OfferFormData> = async (data) => {
    try {
      const offerDocRef = doc(firestore, 'offers', offer.id);
      await updateDoc(offerDocRef, {
        ...data,
        reward: Number(data.reward),
      });
      toast({
        title: 'Offer Updated!',
        description: `${data.title} has been successfully updated.`,
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating offer:', err);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to update offer. Please try again.',
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
          <DialogDescription>
            Make changes to &quot;{offer.title}&quot;. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Offer Title</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" {...register('company', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Offer Image</Label>
             {offer.imageUrl && <Image src={offer.imageUrl} alt={offer.title} width={100} height={100} className='rounded-md aspect-video object-cover' />}
            <ImageUploadForm onUploadSuccess={(url) => setValue('imageUrl', url, { shouldValidate: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input
              id="imageHint"
              {...register('imageHint')}
              placeholder="e.g. 'analytics chart'"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Offer Link</Label>
            <Input
              id="link"
              type="url"
              {...register('link', { required: true })}
              placeholder="https://partner.com/offer/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reward">Reward Coins</Label>
            <Input
              id="reward"
              type="number"
              {...register('reward', { required: true, valueAsNumber: true })}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddOfferForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<OfferFormData>();
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<OfferFormData> = async (data) => {
    setError(null);
     if (!data.imageUrl) {
        setError("Please upload an image for the offer.");
        return;
    }
    try {
      const offersCollection = collection(firestore, 'offers');
      await addDoc(offersCollection, {
        ...data,
        reward: Number(data.reward) // Ensure reward is a number
      });
      toast({
        title: 'Offer Added!',
        description: `${data.title} has been added to the database.`,
      });
      reset();
    } catch (err: any) {
      console.error(err);
      setError('Failed to add offer. Please check the console for errors.');
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: err.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Affiliate Offer</CardTitle>
        <CardDescription>
          Fill out the form below to add a new offer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="title">Offer Title</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" {...register('company', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Offer Image</Label>
            <ImageUploadForm onUploadSuccess={(url) => setValue('imageUrl', url, { shouldValidate: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input
              id="imageHint"
              {...register('imageHint')}
              placeholder="e.g. 'analytics chart'"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Offer Link</Label>
            <Input
              id="link"
              type="url"
              {...register('link', { required: true })}
              placeholder="https://partner.com/offer/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reward">Reward Coins</Label>
            <Input
              id="reward"
              type="number"
              {...register('reward', { required: true, valueAsNumber: true })}
              defaultValue={100}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Offer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OfferList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const offersCollection = useMemo(() => collection(firestore, 'offers'), [firestore]);
    const { data: offers, isLoading } = useCollection<OfferWithId>(offersCollection);

    const handleDelete = async (offerId: string) => {
        try {
            await deleteDoc(doc(firestore, 'offers', offerId));
            toast({
                title: 'Offer Deleted',
                description: 'The offer has been removed.',
            });
        } catch (error: any) {
            console.error("Error deleting offer: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the offer.',
            });
        }
    };

    if (isLoading) {
        return <p>Loading offers...</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Offers</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {offers?.map(offer => (
                    <Card key={offer.id} className="group relative">
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                           <Image src={offer.imageUrl} alt={offer.title} fill className="object-cover" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg">{offer.title}</h3>
                             <p className="text-sm text-muted-foreground">{offer.company}</p>
                            <p className="text-sm text-primary font-semibold">{offer.reward} coins</p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                            <EditOfferForm offer={offer} />
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete the offer &quot;{offer.title}&quot;. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(offer.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                ))}
                {offers?.length === 0 && <p className='text-muted-foreground'>No offers found.</p>}
            </CardContent>
        </Card>
    )
}

export default function AdminOffersPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Manage Offers"
        description="Add, edit, or delete affiliate offers available in the app."
      />
      <div className="space-y-8">
        <AddOfferForm />
        <OfferList />
      </div>
    </AdminAuthWrapper>
  );
}
