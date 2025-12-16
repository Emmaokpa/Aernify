'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

function ProductPageSkeleton() {
  return (
    <div>
      <Skeleton className="h-10 w-32 mb-8" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl mb-4" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <Card>
            <CardContent className="p-6 space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const productId = params.productId as string;

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const productDocRef = useMemo(() => {
    if (!productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading } = useDoc<Product>(productDocRef);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };
  
  const mainImage = product?.imageUrls?.[selectedVariantIndex] || product?.imageUrls?.[0] || '/placeholder.png';


  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Button asChild variant="link">
          <Link href="/shop">Go back to shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
        <Button asChild variant="ghost" className='mb-4'>
            <Link href="/shop">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Shop
            </Link>
        </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="grid gap-4">
           <div className="relative aspect-square w-full overflow-hidden rounded-2xl border">
             <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
             />
           </div>
           <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
           >
             <CarouselContent className="-ml-2">
                {product.imageUrls?.map((url, index) => (
                   <CarouselItem key={index} className="basis-1/4 md:basis-1/5 pl-2">
                     <button
                        onClick={() => setSelectedVariantIndex(index)}
                        className={cn(
                            "block aspect-square w-full rounded-lg overflow-hidden border-2",
                            selectedVariantIndex === index ? "border-primary" : "border-transparent"
                        )}
                     >
                        <Image src={url} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
                     </button>
                   </CarouselItem>
                ))}
             </CarouselContent>
             <CarouselPrevious className='-left-4'/>
             <CarouselNext className='-right-4' />
           </Carousel>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
            <div className="font-bold text-primary text-2xl mt-2">
              <span>{formatPrice(product.price)}</span>
            </div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Color: <span className='font-bold text-foreground'>{product.variants[selectedVariantIndex]?.colorName}</span></h3>
              <div className="flex gap-2">
                {product.variants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVariantIndex(index)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 p-0.5',
                      selectedVariantIndex === index
                        ? 'border-primary'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: variant.colorHex }}
                    aria-label={`Select color ${variant.colorName}`}
                  >
                    {selectedVariantIndex === index && (
                       <div className="w-full h-full rounded-full flex items-center justify-center">
                           <Check className='h-5 w-5' style={{ color: 'white' }} />
                       </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}


          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>
          <Button size="lg" className="w-full text-lg" asChild>
            <Link href={`/checkout/${product.id}?variant=${selectedVariantIndex}`}>Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
