
'use client';
import { useMemo, useState } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { Coins } from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ProductDetailModal({ product, isOpen, onOpenChange }: { product: Product | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!product) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="sr-only">{product.name}</DialogTitle>
                    <DialogDescription className="sr-only">Product details for {product.name}</DialogDescription>
                </DialogHeader>
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
                    <div className="space-y-6 flex flex-col justify-center">
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
                    <Button size="lg" className="w-full text-lg" asChild>
                       <Link href={`/checkout/${product.id}`}>Checkout</Link>
                    </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


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

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  }

  const handleModalClose = () => {
    setSelectedProduct(null);
  }

  return (
    <>
      <PageHeader
        title="Shop"
        description="Spend your coins on real tech gadgets and watches."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        {products?.map((product) => (
          <button onClick={() => handleProductClick(product)} key={product.id} className="text-left">
            <Card className="overflow-hidden flex flex-col rounded-2xl group h-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
              <CardHeader className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
                <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                  <Coins className="w-5 h-5" />
                  <span>{product.price.toLocaleString()}</span>
                </div>
              </CardFooter>
            </Card>
          </button>
        ))}
         {!isLoading && products?.length === 0 && (
          <p className="text-muted-foreground col-span-full">No products available right now. Check back later!</p>
        )}
      </div>
      <ProductDetailModal product={selectedProduct} isOpen={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && handleModalClose()} />
    </>
  );
}
