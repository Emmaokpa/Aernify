import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { products } from "@/lib/data";
import Image from "next/image";
import { Coins } from "lucide-react";
import Link from 'next/link';

export default function ShopPage() {
  return (
    <>
      <PageHeader
        title="Shop"
        description="Spend your coins on real tech gadgets and watches."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
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
      </div>
    </>
  );
}
