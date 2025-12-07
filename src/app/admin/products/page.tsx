
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

const ProductForm = dynamic(() => import('@/components/admin/forms/product-form').then(mod => mod.ProductForm), { ssr: false });

type Product = {
  name: string;
  description: string;
  imageUrl: string;
  priceCoins: number;
  priceUSD?: number;
}


export default function AdminProductsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WithId<Product> | undefined>(undefined);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const productsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'products') : null),
    [firestore]
  );
  
  const { data: products, isLoading, error } = useCollection<Product>(productsCollectionRef);
  
  useEffect(() => {
    if (error) {
        toast({
            variant: "destructive",
            title: "Error fetching products",
            description: "You may not have permission to view this data.",
        });
    }
  }, [error, toast]);


  const handleEdit = (product: WithId<Product>) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedProduct(undefined);
    setFormOpen(true);
  }

  const handleDelete = async (productId: string) => {
    if(!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'products', productId));
      toast({
        title: 'Product Deleted',
        description: 'The product has been successfully deleted.',
      });
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem deleting the product. You may not have permission.',
      });
    }
  };
  
  const handleFormSuccess = () => {
    toast({
        title: selectedProduct ? 'Product Updated' : 'Product Created',
        description: `The product has been successfully ${selectedProduct ? 'updated' : 'created'}.`,
    });
  }

  return (
    <>
      <PageHeader
        title="Manage Products"
        description="Add, edit, or delete products available in the shop."
      />
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Add New Product
        </Button>
      </div>

      {isFormOpen && (
        <ProductForm 
          isOpen={isFormOpen} 
          setOpen={setFormOpen}
          product={selectedProduct}
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
                <TableHead>Price (Coins)</TableHead>
                <TableHead>Price (USD)</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
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
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.priceCoins.toLocaleString()}</TableCell>
                  <TableCell>{product.priceUSD ? `$${product.priceUSD.toFixed(2)}` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
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
                            This action cannot be undone. This will permanently delete the product
                            from your database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)}>
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
