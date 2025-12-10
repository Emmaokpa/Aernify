
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
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useCollection,
} from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
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

type OfferFormData = Omit<Offer, 'id'>;

function AddOfferForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<OfferFormData>();
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<OfferFormData> = async (data) => {
    setError(null);
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
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              {...register('imageUrl', { required: true })}
              placeholder="https://images.unsplash.com/..."
            />
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
    const { data: offers, isLoading } = useCollection<Offer>(offersCollection);

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
                        <div className="absolute top-2 right-2">
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
                                    This will permanently delete the offer "{offer.title}". This action cannot be undone.
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
