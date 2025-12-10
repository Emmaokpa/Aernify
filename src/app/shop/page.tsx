'use client';
import { useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { Coins } from "lucide-react";
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
            <CardFooter className="p-4 bg-muted/30">
                <Skeleton className="h-7 w-1/3" />
            </CardFooter>
        </Card>
    );
}


export default function ShopPage() {
  const firestore = useFirestore();
  const productsCollection = useMemo(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsCollection);

  return (
    <>
      <PageHeader
        title="Shop"
        description="Spend your coins on real tech gadgets and watches."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        {products?.map((product) => (
          <Link href={`/shop/${product.id}`} key={product.id}>
            <Card className="overflow-hidden flex flex-col rounded-2xl group h-full">
              <CardHeader className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    data-ai-hint={product.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
                <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                  <Coins className="w-5 h-5" />
                  <span>{product.price.toLocaleString()}</span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
         {!isLoading && products?.length === 0 && (
          <p className="text-muted-foreground col-span-full">No products available right now. Check back later!</p>
        )}
      </div>
    </>
  );
}
