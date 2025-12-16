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
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { Loader2, Trash2, Pencil, PlusCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { Product, ProductVariant } from '@/lib/types';
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

const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

function EditProductForm({ product }: { product: ProductWithId }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ProductFormData>({
    defaultValues: {
      ...product,
      price: Number(product.price),
      variants: product.variants || [],
      imageUrls: product.imageUrls || [],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to &quot;{product.name}&quot;. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          {/* Main Product Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (in Naira ₦)</Label>
              <Input id="price" type="number" {...register('price', { required: true, valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description', { required: true })} />
          </div>

          {/* Image Uploads */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.getValues('imageUrls').map((url, index) => (
                <div key={index} className="relative w-20 h-20">
                  <Image src={url} alt={`Product image ${index + 1}`} fill className="object-cover rounded-md" />
                  <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => {
                      const currentImages = form.getValues('imageUrls');
                      setValue('imageUrls', currentImages.filter((_, i) => i !== index));
                    }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <ImageUploadForm onUploadSuccess={(url) => setValue('imageUrls', [...form.getValues('imageUrls'), url])} />
          </div>

          {/* Variants Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Variants (e.g., Colors)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ color: '', colorHex: '#000000', imageUrl: '', stock: 10 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg relative">
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-2">
                  <Label>Color Name</Label>
                  <Input {...register(`variants.${index}.color`, { required: true })} placeholder="e.g. Space Black" />
                </div>
                <div className="space-y-2">
                  <Label>Color Swatch</Label>
                  <Input type="color" {...register(`variants.${index}.colorHex`)} className="p-1 h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" {...register(`variants.${index}.stock`, { required: true, valueAsNumber: true, min: 0 })} />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label>Variant Image</Label>
                  {form.watch(`variants.${index}.imageUrl`) && (
                    <div className="w-20 h-20 relative"><Image src={form.watch(`variants.${index}.imageUrl`)!} alt="variant" fill className="object-cover rounded-md" /></div>
                  )}
                  <ImageUploadForm onUploadSuccess={(url) => setValue(`variants.${index}.imageUrl`, url)} />
                </div>
              </div>
            ))}
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
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 5000,
      imageUrls: [],
      variants: [],
    },
  });

  const { register, control, handleSubmit, reset, setValue, formState: { isSubmitting } } = form;
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants"
  });

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setError(null);
    if (!data.imageUrls || data.imageUrls.length === 0) {
      setError('Please upload at least one main image for the product.');
      return;
    }
    if (data.variants && data.variants.some(v => !v.imageUrl)) {
      setError('Each variant must have an image uploaded.');
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
          Fill out the form to add a new product to the shop, including images and variants.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (in Naira ₦)</Label>
              <Input id="price" type="number" {...register('price', { required: true, valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Main Product Images</Label>
            <ImageUploadForm onUploadSuccess={(url) => setValue('imageUrls', [...form.getValues('imageUrls'), url])} />
          </div>
          {/* Variants Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Variants (e.g., Colors)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ color: '', colorHex: '#000000', imageUrl: '', stock: 10 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg relative">
                 <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-2">
                  <Label>Color Name</Label>
                  <Input {...register(`variants.${index}.color`, { required: true })} placeholder="e.g. Space Black" />
                </div>
                <div className="space-y-2">
                  <Label>Color Swatch</Label>
                  <Controller
                    name={`variants.${index}.colorHex`}
                    control={control}
                    render={({ field }) => <Input type="color" {...field} className="p-1 h-10" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" {...register(`variants.${index}.stock`, { required: true, valueAsNumber: true, min: 0 })} />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label>Variant Image</Label>
                   {form.watch(`variants.${index}.imageUrl`) && <Image src={form.watch(`variants.${index}.imageUrl`)!} alt="variant" width={80} height={80} className="rounded-md object-cover"/>}
                  <ImageUploadForm onUploadSuccess={(url) => setValue(`variants.${index}.imageUrl`, url)} />
                </div>
              </div>
            ))}
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
              <p className="text-sm text-primary font-semibold">
                {formatToNaira(product.price)}
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
