'use client';
import { useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Coins } from 'lucide-react';

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col rounded-2xl h-full">
      <CardHeader className="p-0">
        <Skeleton className="aspect-square w-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 bg-card/50">
        <Skeleton className="h-7 w-1/3" />
      </CardFooter>
    </Card>
  );
}

export default function ShopPage() {
  const firestore = useFirestore();
  const { profile, isUserLoading } = useUser();

  const productsCollection = useMemo(
    () => collection(firestore, 'products'),
    [firestore]
  );
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(
    productsCollection
  );

  const isLoading = isLoadingProducts || isUserLoading;

  const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <>
      <PageHeader
        title="Shop"
        description="Purchase real tech gadgets and watches. Shipping available within Nigeria."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        {products?.map((product) => {
          return (
            <Link href={`/shop/${product.id}`} key={product.id}>
              <Card className="overflow-hidden flex flex-col rounded-2xl group h-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <CardHeader className="p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={product.imageUrls?.[0] || '/placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                </CardContent>
                <CardFooter className="p-4 bg-card/50">
                  <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                    <span>{formatToNaira(product.price)}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          )
        })}
        {!isLoading && products?.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No products available right now. Check back later!
          </p>
        )}
      </div>
    </>
  );
}
