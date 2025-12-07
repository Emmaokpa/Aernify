import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/lib/data";
import { Crown, Users, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AccountPage() {
  const referralCode = "EARN123XYZ";
  return (
    <>
      <PageHeader
        title="My Account"
        description="Manage your profile, subscription, and referrals."
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="text-center p-6">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
            {currentUser.isVip && (
              <Badge variant="default" className="mt-2 bg-primary text-primary-foreground">
                <Crown className="w-4 h-4 mr-1.5" /> VIP Member
              </Badge>
            )}
            <p className="text-muted-foreground mt-1">Joined March 2024</p>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown /> VIP Subscription</CardTitle>
              <CardDescription>
                {currentUser.isVip
                  ? "You have access to all VIP perks."
                  : "Upgrade to earn 2x rewards and get exclusive benefits."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentUser.isVip ? (
                <div>
                  <p className="font-semibold text-lg">Your VIP plan is active.</p>
                  <p className="text-muted-foreground text-sm">Renews on July 30, 2024</p>
                  <Button variant="outline" className="mt-4">Manage Subscription</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div>
                    <p className="font-bold text-lg">Get 2x Earnings</p>
                    <p className="text-sm">Only $9.99/month</p>
                  </div>
                  <Button>Upgrade Now</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> Referral Program</CardTitle>
              <CardDescription>Share your code with friends. You both get 1000 coins when they sign up!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input readOnly value={referralCode} className="font-mono" />
                <Button>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
