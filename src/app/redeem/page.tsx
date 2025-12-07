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
          <Card key={card.id} className="overflow-hidden flex flex-col text-center">
            <CardHeader className="p-0 items-center justify-center">
              <div className="relative aspect-[1.6] w-full">
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  className="object-cover"
                  data-ai-hint={card.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold">{card.name}</h3>
              <p className="text-xl font-bold text-foreground">${card.value}</p>
            </CardContent>
            <CardFooter className="p-4 flex-col gap-2">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> {card.price.toLocaleString()}
              </div>
              <Button className="w-full">Redeem</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
