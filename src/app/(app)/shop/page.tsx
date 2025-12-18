'use client';
import { useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';

function ProductSkeleton() {
  return (
    <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border shadow-lg shadow-background/20 w-full">
       <div className="relative p-2 sm:p-2.5">
        <Skeleton className="w-full object-cover aspect-square rounded-xl sm:rounded-2xl" />
        <div className="mt-3 sm:mt-4 px-1 sm:px-1.5 pb-2 sm:pb-3 pt-1 sm:pt-2">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-3 sm:mt-4 flex justify-between items-center">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>
        </div>
       </div>
    </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)}
        
        {products?.map((product) => {
          return (
             <Link href={`/shop/${product.id}`} key={product.id} className="block">
                <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border shadow-lg shadow-background/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:border-border/80 w-full">
                    <div className="relative p-2 sm:p-2.5">
                        {/* Card Image Section */}
                        <div className="relative">
                            <Image
                                src={product.imageUrls?.[0] || '/placeholder.png'}
                                alt={product.name}
                                width={400}
                                height={400}
                                className="w-full h-auto rounded-xl sm:rounded-2xl object-cover aspect-square"
                            />
                        </div>

                        {/* Card Content Section */}
                        <div className="mt-3 sm:mt-4 px-1 sm:px-1.5 pb-2 sm:pb-3 pt-1 sm:pt-2">
                            <h3 className="text-base sm:text-lg font-bold text-foreground truncate pr-2" title={product.name}>
                                {product.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{product.description}</p>
                            <div className="mt-3 sm:mt-4 flex justify-between items-center">
                                <p className="text-xs sm:text-sm font-bold text-muted-foreground">Price</p>
                                <p className="text-sm sm:text-lg font-bold text-primary">{formatToNaira(product.price)}</p>
                            </div>
                        </div>
                    </div>
                </div>
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
