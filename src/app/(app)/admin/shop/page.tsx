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
import { Textarea } from '@/components/ui/textarea';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { Loader2, Trash2, Pencil, PlusCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Product } from '@/lib/types';
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

type ProductFormData = Omit<Product, 'id'>;
type ProductWithId = Product & { id: string };

function EditProductForm({ product }: { product: ProductWithId }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<ProductFormData>({
    defaultValues: {
      ...product,
      price: Number(product.price),
      imageUrls: product.imageUrls || [],
      variants: product.variants || [],
    },
  });

  const { fields: imageUrls, append: appendImageUrl, remove: removeImageUrl } = useFieldArray({ control, name: 'imageUrls' });
  const { fields: variants, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });


  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    try {
      const productDocRef = doc(firestore, 'products', product.id);
      await updateDoc(productDocRef, {
        ...data,
        price: Number(data.price),
      });
      toast({
        title: 'Product Updated!',
        description: `${data.name} has been successfully updated.`,
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating product:', err);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to update product. Please try again.',
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to &quot;{product.name}&quot;. Click save when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
           <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="space-y-2">
                {imageUrls.map((field, index) => (
                     <div key={field.id} className="flex items-center gap-2">
                         <Input {...register(`imageUrls.${index}`)} readOnly />
                         <Button type="button" variant="destructive" size="icon" onClick={() => removeImageUrl(index)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                ))}
            </div>
            <ImageUploadForm onUploadSuccess={(url) => appendImageUrl(url)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input id="imageHint" {...register('imageHint')} placeholder="e.g. 'wireless earbuds'" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (in NGN)</Label>
            <Input id="price" type="number" {...register('price', { required: true, valueAsNumber: true })} />
          </div>
          <div className="space-y-4 rounded-lg border p-4">
            <Label>Variants (e.g., Colors)</Label>
            <div className="space-y-3">
                {variants.map((field, index) => (
                     <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                         <div className="space-y-1">
                             <Label className='text-xs'>Color Name</Label>
                             <Input {...register(`variants.${index}.colorName`)} placeholder="e.g., Midnight Black"/>
                         </div>
                          <div className="space-y-1">
                             <Label className='text-xs'>Color Hex</Label>
                             <div className='flex items-center gap-2'>
                                <Input {...register(`variants.${index}.colorHex`)} placeholder="#000000"/>
                                <div className='h-8 w-8 rounded border' style={{backgroundColor: field.colorHex}}></div>
                             </div>
                         </div>
                         <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}><X className="h-4 w-4" /></Button>
                     </div>
                ))}
            </div>
             <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ colorName: '', colorHex: '#ffffff'})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
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

function AddProductForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<ProductFormData>({
      defaultValues: {
        imageUrls: [],
        variants: [],
      }
  });

  const { fields: imageUrls, append: appendImageUrl, remove: removeImageUrl } = useFieldArray({ control, name: 'imageUrls' });
  const { fields: variants, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });
  const watchedVariants = watch('variants');

  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setError(null);
    if (!data.imageUrls || data.imageUrls.length === 0) {
      setError('Please upload at least one image for the product.');
      return;
    }
    try {
      const productsCollection = collection(firestore, 'products');
      await addDoc(productsCollection, {
        ...data,
        price: Number(data.price),
      });
      toast({
        title: 'Product Added!',
        description: `${data.name} has been added to the shop.`,
      });
      reset();
    } catch (err: any) {
      console.error(err);
      setError('Failed to add product. Please check the console for errors.');
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
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>
          Fill out the form below to add a new product to the shop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Product Images</Label>
             <div className="space-y-2">
                {imageUrls.map((field, index) => (
                     <div key={field.id} className="flex items-center gap-2">
                         <Input {...register(`imageUrls.${index}`)} readOnly />
                         <Button type="button" variant="destructive" size="icon" onClick={() => removeImageUrl(index)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                ))}
            </div>
            <ImageUploadForm onUploadSuccess={(url) => appendImageUrl(url)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input
              id="imageHint"
              {...register('imageHint')}
              placeholder="e.g. 'wireless earbuds'"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (in NGN)</Label>
            <Input
              id="price"
              type="number"
              {...register('price', { required: true, valueAsNumber: true })}
              defaultValue={10000}
            />
          </div>
          <div className="space-y-4 rounded-lg border p-4">
            <Label>Variants (e.g., Colors)</Label>
            <div className="space-y-3">
                {variants.map((field, index) => (
                     <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                         <div className="space-y-1">
                             <Label className='text-xs'>Color Name</Label>
                             <Input {...register(`variants.${index}.colorName`)} placeholder="e.g., Midnight Black"/>
                         </div>
                          <div className="space-y-1">
                             <Label className='text-xs'>Color Hex</Label>
                              <div className='flex items-center gap-2'>
                                <Input {...register(`variants.${index}.colorHex`)} placeholder="#000000"/>
                                <div className='h-8 w-8 rounded border' style={{backgroundColor: watchedVariants?.[index]?.colorHex}}></div>
                             </div>
                         </div>
                         <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}><X className="h-4 w-4" /></Button>
                     </div>
                ))}
            </div>
             <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ colorName: '', colorHex: '#ffffff' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
            </Button>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Product
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ProductList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const productsCollection = useMemo(
    () => collection(firestore, 'products'),
    [firestore]
  );
  const { data: products, isLoading } = useCollection<ProductWithId>(
    productsCollection
  );

  const handleDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(firestore, 'products', productId));
      toast({
        title: 'Product Deleted',
        description: 'The product has been removed.',
      });
    } catch (error: any) {
      console.error('Error deleting product: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the product.',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  if (isLoading) {
    return <p>Loading products...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Products</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="group relative">
            <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
              <Image
                src={product.imageUrls?.[0] || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatPrice(product.price)}
              </p>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <EditProductForm product={product} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the product &quot;{product.name}
                      &quot;. This action cannot be undone.
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
            </div>
          </Card>
        ))}
        {products?.length === 0 && (
          <p className="text-muted-foreground">No products found.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminShopPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Manage Shop"
        description="Add, edit, or delete products available in the shop."
      />
      <div className="space-y-8">
        <AddProductForm />
        <ProductList />
      </div>
    </AdminAuthWrapper>
  );
}
