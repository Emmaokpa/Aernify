import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { leaderboard, currentUser } from "@/lib/data";
import { Crown, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  // Assuming the leaderboard data is sorted by rank
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Function to determine placement and styling for top 3
  const getTopPlayerCard = (entry: (typeof leaderboard)[0], index: number) => {
    const isFirst = index === 0;
    const isSecond = index === 1;
    const isThird = index === 2;

    return (
      <div key={entry.rank} className={cn(
        "flex flex-col items-center",
        isFirst && "md:row-start-1 md:row-end-3",
        isSecond && "md:row-start-2",
        isThird && "md:row-start-2"
      )}>
        <p className={cn(
          "font-bold text-4xl mb-2",
          isFirst && "text-primary",
          isSecond && "text-yellow-500",
          isThird && "text-orange-400"
        )}>
          #{entry.rank}
        </p>
        <Card className={cn(
          "w-full text-center p-6 relative overflow-visible",
           isFirst && "bg-primary/20 border-primary/40 -translate-y-4"
        )}>
          {isFirst && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary">
              <Crown className="w-12 h-12 fill-primary" />
            </div>
          )}
          <Avatar className={cn(
            "w-24 h-24 mx-auto mb-4 border-4",
            isFirst && "border-primary",
            isSecond && "border-yellow-500",
            isThird && "border-orange-400"
          )}>
            <AvatarImage src={entry.user.avatarUrl} alt={entry.user.name} />
            <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-xl font-bold">{entry.user.name === 'CurrentUser' ? currentUser.name : entry.user.name}</p>
          <p className="text-2xl font-bold text-primary mt-2 flex items-center justify-center gap-2">
            <Coins className="w-6 h-6" /> {entry.score.toLocaleString()}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="See who's on top this week. Top players win weekly prizes!"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8 mb-8 items-end">
        {getTopPlayerCard(topThree[1], 1)} 
        {getTopPlayerCard(topThree[0], 0)} 
        {getTopPlayerCard(topThree[2], 2)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>All players ranked by coins earned this week.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rest.map((entry) => (
              <div key={entry.rank} className={cn(
                "flex items-center p-3 rounded-lg transition-colors", 
                entry.user.name === 'CurrentUser' ? "bg-primary/20 border-primary/40 border" : "bg-card hover:bg-muted"
              )}>
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
