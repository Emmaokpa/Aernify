
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
    <div className="relative group overflow-hidden rounded-xl bg-card border border-border shadow-sm w-full">
       <div className="relative p-2">
        <Skeleton className="w-full object-cover aspect-square rounded-lg" />
        <div className="mt-2 px-1 pb-2">
            <Skeleton className="h-5 w-3/4 mb-1.5" />
            <Skeleton className="h-3 w-full mb-2" />
            <div className="mt-2 flex justify-end items-center">
              <Skeleton className="h-5 w-1/3" />
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
          Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
        
        {products?.map((product) => {
          return (
             <Link href={`/shop/${product.id}`} key={product.id} className="block">
                <div className="relative group overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-1 w-full">
                    <div className="relative p-2">
                        {/* Card Image Section */}
                        <div className="relative">
                            <Image
                                src={product.imageUrls?.[0] || '/placeholder.png'}
                                alt={product.name}
                                width={400}
                                height={400}
                                className="w-full h-auto rounded-lg object-cover aspect-square"
                            />
                        </div>

                        {/* Card Content Section */}
                        <div className="mt-2 px-1 pb-2">
                            <h3 className="text-xs font-bold text-foreground truncate" title={product.name}>
                                {product.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{product.description}</p>
                            <div className="mt-2 flex justify-end items-center">
                                <p className="text-sm font-bold text-primary">{formatToNaira(product.price)}</p>
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
