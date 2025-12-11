'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/page-header';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Coins, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function ProductDetailSkeleton() {
  return (
    <div>
       <Skeleton className="h-10 w-40 mb-8" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-20 w-full" />
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

  const productDocRef = useMemo(() => {
    if (!productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading } = useDoc<Product>(productDocRef);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    notFound();
  }

  return (
     <div>
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ChevronLeft className="mr-2" />
        Back to Shop
      </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <Card className="overflow-hidden rounded-2xl">
          <div className="relative aspect-square">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint={product.imageHint}
            />
          </div>
        </Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
            <div className="font-bold text-primary flex items-center gap-1.5 text-2xl mt-2">
                <Coins className="w-6 h-6" />
                <span>{product.price.toLocaleString()}</span>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>
          <Button size="lg" className="w-full text-lg" disabled>
            (Checkout Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
