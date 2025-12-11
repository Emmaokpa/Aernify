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
import type { GiftCard } from '@/lib/types';
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

type GiftCardFormData = Omit<GiftCard, 'id'>;
type GiftCardWithId = GiftCard & { id: string };

function EditGiftCardForm({ giftCard }: { giftCard: GiftCardWithId }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<GiftCardFormData>({
    defaultValues: {
      ...giftCard,
      price: Number(giftCard.price),
      value: Number(giftCard.value),
    },
  });

  const onSubmit: SubmitHandler<GiftCardFormData> = async (data) => {
    try {
      const giftCardDocRef = doc(firestore, 'giftCards', giftCard.id);
      await updateDoc(giftCardDocRef, {
        ...data,
        price: Number(data.price),
        value: Number(data.value),
      });
      toast({
        title: 'Gift Card Updated!',
        description: `${data.name} has been successfully updated.`,
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating gift card:', err);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to update gift card. Please try again.',
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
          <DialogTitle>Edit Gift Card</DialogTitle>
          <DialogDescription>
            Make changes to &quot;{giftCard.name}&quot;. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
           <div className="space-y-2">
            <Label htmlFor="name">Card Name</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>
           <div className="space-y-2">
            <Label>Card Image</Label>
             {giftCard.imageUrl && <Image src={giftCard.imageUrl} alt={giftCard.name} width={100} height={60} className='rounded-md aspect-video object-contain border p-1' />}
            <ImageUploadForm onUploadSuccess={(url) => setValue('imageUrl', url, { shouldValidate: true })} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input
              id="imageHint"
              {...register('imageHint')}
              placeholder="e.g. 'brand logo'"
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="value">Value (e.g., in USD)</Label>
            <Input
              id="value"
              type="number"
              {...register('value', { required: true, valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (in Coins)</Label>
            <Input
              id="price"
              type="number"
              {...register('price', { required: true, valueAsNumber: true })}
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

function AddGiftCardForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<GiftCardFormData>();
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<GiftCardFormData> = async (data) => {
    setError(null);
    if (!data.imageUrl) {
        setError("Please upload an image for the gift card.");
        return;
    }
    try {
      const giftCardsCollection = collection(firestore, 'giftCards');
      await addDoc(giftCardsCollection, {
        ...data,
        price: Number(data.price),
        value: Number(data.value)
      });
      toast({
        title: 'Gift Card Added!',
        description: `${data.name} has been added to the redeem section.`,
      });
      reset();
    } catch (err: any) {
      console.error(err);
      setError('Failed to add gift card. Please check the console for errors.');
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
        <CardTitle>Add New Gift Card</CardTitle>
        <CardDescription>
          Fill out the form below to add a new gift card to the redeem section.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="name">Card Name</Label>
            <Input id="name" {...register('name', { required: true })} placeholder="e.g. Amazon Gift Card" />
          </div>
          <div className="space-y-2">
            <Label>Card Image</Label>
            <ImageUploadForm onUploadSuccess={(url) => setValue('imageUrl', url, { shouldValidate: true })} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input
              id="imageHint"
              {...register('imageHint')}
              placeholder="e.g. 'brand logo'"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value (e.g., in USD)</Label>
            <Input
              id="value"
              type="number"
              {...register('value', { required: true, valueAsNumber: true })}
              defaultValue={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (in Coins)</Label>
            <Input
              id="price"
              type="number"
              {...register('price', { required: true, valueAsNumber: true })}
              defaultValue={10000}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Gift Card
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GiftCardList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const giftCardsCollection = useMemo(() => collection(firestore, 'giftCards'), [firestore]);
    const { data: giftCards, isLoading } = useCollection<GiftCardWithId>(giftCardsCollection);

    const handleDelete = async (giftCardId: string) => {
        try {
            await deleteDoc(doc(firestore, 'giftCards', giftCardId));
            toast({
                title: 'Gift Card Deleted',
                description: 'The gift card has been removed.',
            });
        } catch (error: any) {
            console.error("Error deleting gift card: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the gift card.',
            });
        }
    };

    if (isLoading) {
        return <p>Loading gift cards...</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Gift Cards</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {giftCards?.map(card => (
                    <Card key={card.id} className="group relative">
                        <div className="relative aspect-[1.6] w-full overflow-hidden rounded-t-lg bg-muted flex items-center justify-center p-2">
                           <Image src={card.imageUrl} alt={card.name} width={120} height={75} className="object-contain" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg">{card.name}</h3>
                            <p className="text-sm text-muted-foreground">${card.value} for {card.price} coins</p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                             <EditGiftCardForm giftCard={card} />
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
                                    This will permanently delete the gift card &quot;{card.name}&quot;. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(card.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                ))}
                {giftCards?.length === 0 && <p className='text-muted-foreground'>No gift cards found.</p>}
            </CardContent>
        </Card>
    )
}

export default function AdminGiftCardsPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Manage Gift Cards"
        description="Add, edit, or delete gift cards available for redemption."
      />
      <div className="space-y-8">
        <AddGiftCardForm />
        <GiftCardList />
      </div>
    </AdminAuthWrapper>
  );
}
