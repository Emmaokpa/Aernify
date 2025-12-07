import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { offers } from "@/lib/data";
import Image from "next/image";
import { Coins } from "lucide-react";

export default function AffiliatePage() {
  return (
    <>
      <PageHeader
        title="Affiliate Offers"
        description="Earn big rewards by completing offers from our partners."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} className="overflow-hidden flex flex-col group">
            <CardHeader className="p-0">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={offer.imageUrl}
                  alt={offer.title}
                  fill
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={offer.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <h3 className="text-lg font-semibold truncate">{offer.title}</h3>
              <p className="text-sm text-muted-foreground">{offer.company}</p>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start gap-3 bg-muted/30">
              <div className="font-bold text-primary flex items-center gap-1.5 text-lg">
                <Coins className="w-5 h-5" />
                <span>{offer.reward.toLocaleString()}</span>
              </div>
              <Button className="w-full">Start Offer</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
