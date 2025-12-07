import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { leaderboard, currentUser } from "@/lib/data";
import { Crown, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="See who's on top this week. Top players win weekly prizes!"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {topThree.map((entry, index) => (
          <Card key={entry.rank} className={cn("relative text-center p-6", index === 0 && "md:col-span-1 md:row-span-2 md:scale-105 bg-gradient-to-b from-primary/80 to-primary/40", index === 1 && "md:mt-8", index === 2 && "md:mt-8")}>
            <div className="absolute top-2 right-2 text-primary">
              {index === 0 && <Crown className="w-8 h-8 fill-primary" />}
            </div>
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
              <AvatarImage src={entry.user.avatarUrl} alt={entry.user.name} />
              <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-xl font-bold">{entry.user.name === 'CurrentUser' ? currentUser.name : entry.user.name}</p>
            <p className="text-muted-foreground">Rank #{entry.rank}</p>
            <p className="text-2xl font-bold text-primary mt-2 flex items-center justify-center gap-2">
              <Coins className="w-6 h-6" /> {entry.score.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>All players ranked by coins earned this week.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rest.map((entry) => (
              <div key={entry.rank} className={cn("flex items-center p-3 rounded-lg", entry.user.name === 'CurrentUser' ? "bg-primary/20" : "bg-card")}>
                <div className="w-12 text-center text-lg font-bold text-muted-foreground">#{entry.rank}</div>
                <Avatar className="w-10 h-10 mx-4">
                  <AvatarImage src={entry.user.avatarUrl} alt={entry.user.name} />
                  <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold flex-grow">{entry.user.name === 'CurrentUser' ? currentUser.name : entry.user.name}</p>
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> {entry.score.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
