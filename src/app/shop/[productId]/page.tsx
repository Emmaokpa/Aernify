'use client';

import { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function ProductDetailSkeleton() {
  return (
     <div>
      <Skeleton className="h-10 w-40 mb-4" />
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="relative aspect-square" />
          <div className="p-8 flex flex-col space-y-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex-grow" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function ProductPage() {
  const params = useParams();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const firestore = useFirestore();

  const productDocRef = useMemo(() => {
    if (!productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: productData, isLoading } = useDoc<Omit<Product, 'id'>>(productDocRef);
  
  const product = useMemo(() => {
      if (!productData || !productId) return null;
      return { ...productData, id: productId };
  }, [productData, productId]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Button asChild variant="outline" className="mb-4">
        <Link href="/shop">
          <ChevronLeft className="mr-2" />
          Back to Shop
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-square">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint={product.imageHint}
            />
          </div>
          <div className="p-8 flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <p className="text-lg text-muted-foreground mt-2">{product.description}</p>

            <div className="mt-6 flex-grow">
              {/* Could add more details here in the future */}
            </div>

            <div className="flex flex-col gap-4">
              <div className="font-bold text-primary flex items-center gap-2 text-3xl">
                <Coins className="w-8 h-8" />
                <span>{product.price.toLocaleString()}</span>
              </div>
              <Button asChild size="lg">
                <Link href={`/checkout/${product.id}`}>Buy Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
