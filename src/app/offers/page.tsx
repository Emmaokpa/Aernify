import PageHeader from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { offers } from "@/lib/data";
import Image from "next/image";
import { Coins } from "lucide-react";

export default function OffersPage() {
  return (
    <>
      <PageHeader
        title="Complete Offers"
        description="Earn big rewards by completing offers from our partners."
      />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Image
                    src={offer.imageUrl}
                    alt={offer.company}
                    width={56}
                    height={56}
                    className="rounded-lg object-cover"
                    data-ai-hint={offer.imageHint}
                  />
                  <div>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary flex items-center justify-end gap-1.5">
                    <Coins className="w-4 h-4" /> {offer.reward.toLocaleString()}
                  </p>
                  <Button size="sm" className="mt-1">Start Offer</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
