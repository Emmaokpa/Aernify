'use client';
import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { Product, ProductVariant } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Label } from '@/components/ui/label';


function ProductDetailSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      <div>
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="w-20 h-20 rounded-lg" />
          <Skeleton className="w-20 h-20 rounded-lg" />
          <Skeleton className="w-20 h-20 rounded-lg" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const productId = params.productId as string;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [mainImage, setMainImage] = useState<string>('');

  const productDocRef = useMemo(() => {
    if (!productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading: isProductLoading } = useDoc<Product>(productDocRef);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
        setMainImage(product.variants[0].imageUrl);
      } else if (product.imageUrls && product.imageUrls.length > 0) {
        setMainImage(product.imageUrls[0]);
      }
    }
  }, [product]);


  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setMainImage(variant.imageUrl);
  }
  
  const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);


  const isLoading = isUserLoading || isProductLoading;

  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;
  
  const allImages = [...(product.imageUrls || []), ...(product.variants?.map(v => v.imageUrl) || [])];
  const uniqueImages = [...new Set(allImages)];

  return (
    <div className="max-w-6xl mx-auto">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/shop"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Shop</Link>
        </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side: Image Gallery */}
        <div>
          <Card className="overflow-hidden">
            <AspectRatio ratio={1 / 1}>
                <Image
                src={mainImage || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover"
                priority
                />
            </AspectRatio>
          </Card>
          
          <Carousel className="mt-4" opts={{ align: "start" }}>
            <CarouselContent className="-ml-2">
              {uniqueImages.map((imgUrl, index) => (
                 <CarouselItem key={index} className="basis-1/4 pl-2">
                    <button onClick={() => setMainImage(imgUrl)} className={cn(
                        "block border-2 rounded-lg overflow-hidden transition-all",
                        mainImage === imgUrl ? 'border-primary' : 'border-transparent'
                    )}>
                        <AspectRatio ratio={1/1}>
                             <Image src={imgUrl} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
                        </AspectRatio>
                    </button>
                 </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-3 bg-background/60 hover:bg-background"/>
            <CarouselNext className="right-3 bg-background/60 hover:bg-background"/>
          </Carousel>
        </div>

        {/* Right Side: Product Details */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold text-primary flex items-center gap-2">
            <span>{formatToNaira(product.price)}</span>
          </p>
          <div className="text-muted-foreground prose prose-invert">
            <p>{product.description}</p>
          </div>
          
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">Color: <span className="text-muted-foreground">{selectedVariant?.color}</span></Label>
              <div className="flex items-center gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.color}
                    type="button"
                    onClick={() => handleVariantSelect(variant)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      selectedVariant?.color === variant.color ? 'border-primary scale-110' : 'border-border',
                      variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                    style={{ backgroundColor: variant.colorHex }}
                    title={variant.color}
                    disabled={variant.stock === 0}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedVariant && selectedVariant.stock < 10 && selectedVariant.stock > 0 && (
            <p className="text-sm text-amber-500 font-semibold">Only {selectedVariant.stock} left in stock - order soon!</p>
          )}

          <Button size="lg" className="w-full text-lg" disabled={isOutOfStock} asChild>
            <Link href={`/checkout/${productId}`}>
              {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            </Link>
          </Button>

        </div>
      </div>
    </div>
  );
}
