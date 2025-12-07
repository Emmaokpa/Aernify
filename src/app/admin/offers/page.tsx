
'use client';
import { useState, useEffect }from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { WithId } from '@/firebase/firestore/use-collection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const OfferForm = dynamic(() => import('@/components/admin/forms/offer-form').then(mod => mod.OfferForm), { ssr: false });

type Offer = {
  name: string;
  description: string;
  imageUrl: string;
  rewardAmount: number;
  provider: string;
  requiredAction: string;
}


export default function AdminOffersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<WithId<Offer> | undefined>(undefined);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const offersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'offers') : null),
    [firestore]
  );
  
  const { data: offers, isLoading, error } = useCollection<Offer>(offersCollectionRef);
  
  useEffect(() => {
    if (error) {
        toast({
            variant: "destructive",
            title: "Error fetching offers",
            description: "You may not have permission to view this data.",
        });
    }
  }, [error, toast]);


  const handleEdit = (offer: WithId<Offer>) => {
    setSelectedOffer(offer);
    setFormOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedOffer(undefined);
    setFormOpen(true);
  }

  const handleDelete = async (offerId: string) => {
    if(!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'offers', offerId));
      toast({
        title: 'Offer Deleted',
        description: 'The offer has been successfully deleted.',
      });
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem deleting the offer. You may not have permission.',
      });
    }
  };
  
  const handleFormSuccess = () => {
    toast({
        title: selectedOffer ? 'Offer Updated' : 'Offer Created',
        description: `The offer has been successfully ${selectedOffer ? 'updated' : 'created'}.`,
    });
  }

  return (
    <>
      <PageHeader
        title="Manage Offers"
        description="Add, edit, or delete affiliate offers available in the app."
      />
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Add New Offer
        </Button>
      </div>

      {isFormOpen && (
        <OfferForm 
          isOpen={isFormOpen} 
          setOpen={setFormOpen}
          offer={selectedOffer}
          onSuccess={handleFormSuccess}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="w-16 h-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && offers?.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    {offer.imageUrl ? (
                        <Image
                            src={offer.imageUrl}
                            alt={offer.name}
                            width={64}
                            height={64}
                            className="rounded object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No Image</span>
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{offer.name}</TableCell>
                  <TableCell>{offer.provider}</TableCell>
                  <TableCell>{offer.rewardAmount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(offer)}>
                      <Edit />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the offer
                            from your database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(offer.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
