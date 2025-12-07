import PageHeader from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { games } from "@/lib/data";
import Image from "next/image";
import Link from 'next/link';

export default function PlayPage() {
  return (
    <>
      <PageHeader
        title="Play Games"
        description="Choose a game to play and earn coins. The more you play, the more you earn!"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {games.map((game) => (
          <Link href={`/play`} key={game.id}>
            <Card className="overflow-hidden aspect-[3/4] relative group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 rounded-2xl">
              <Image
                src={game.imageUrl}
                alt={game.title}
                fill
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                data-ai-hint={game.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
