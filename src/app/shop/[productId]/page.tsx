
'use client';

import { products } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const product = products.find((p) => p.id === params.productId);

  if (!product) {
    notFound();
  }

  return (
    <div>
       <Button asChild variant="outline" className='mb-4'>
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
