import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/data";
import Image from "next/image";
import { Coins } from "lucide-react";

export default function ShopPage() {
  return (
    <>
      <PageHeader
        title="Shop"
        description="Spend your coins on real tech gadgets and watches."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden flex flex-col">
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
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription className="text-sm mt-1">{product.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center bg-muted/50">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> {product.price.toLocaleString()}
              </div>
              <Button>Buy</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
