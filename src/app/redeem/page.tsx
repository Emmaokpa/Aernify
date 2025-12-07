import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { giftCards } from "@/lib/data";
import Image from "next/image";
import { Coins } from "lucide-react";

export default function RedeemPage() {
  return (
    <>
      <PageHeader
        title="Redeem Gift Cards"
        description="Exchange your coins for real-world value. Choose from a variety of gift cards."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {giftCards.map((card) => (
          <Card key={card.id} className="overflow-hidden flex flex-col rounded-2xl group">
            <CardHeader className="p-0">
              <div className="relative aspect-[1.6]">
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={card.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <h3 className="text-lg font-semibold">{card.name}</h3>
              <p className="text-xl font-bold text-foreground mt-1">${card.value}</p>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
              <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                <Coins className="w-5 h-5" />
                <span>{card.price.toLocaleString()}</span>
              </div>
              <Button className="w-full">Redeem</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
