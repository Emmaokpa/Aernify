import PageHeader from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { games } from "@/lib/data";
import Image from "next/image";
import { Coins } from "lucide-react";

export default function PlayPage() {
  return (
    <>
      <PageHeader
        title="Play Games"
        description="Choose a game to play and earn coins. The more you play, the more you earn!"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
              <div className="relative aspect-video">
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="object-cover"
                  data-ai-hint={game.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-lg">{game.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{game.provider}</p>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center bg-muted/50">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> +{game.reward}
              </div>
              <Button>Play Now</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
