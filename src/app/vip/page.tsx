'use client';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateDva } from '@/ai/flows/vip-flow';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Sparkles, ShieldOff, Crown, Landmark, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function VipPage() {
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDva = async () => {
    if (!user || !profile) return;
    setIsGenerating(true);
    try {
      const result = await generateDva({ userId: user.uid });
      if (result.success && result.bankName && result.accountNumber) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          dvaBankName: result.bankName,
          dvaAccountNumber: result.accountNumber,
        });
        toast({
          title: 'Account Generated!',
          description: 'Your unique payment account is ready.',
        });
      } else {
        throw new Error(result.message || 'Failed to generate account.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not generate payment account.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${field} copied to clipboard.` });
  };

  const hasDva = !!profile?.dvaAccountNumber;

  const isLoading = isUserLoading;

  return (
    <>
      <PageHeader
        title="VIP Membership"
        description="Unlock exclusive benefits and maximize your earnings."
      />
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-primary/10 border border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">VIP Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">2x Earnings</h3>
                <p className="text-muted-foreground text-sm">Double the coins from games, offers, and all other activities.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <ShieldOff className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Ad-Free Experience</h3>
                <p className="text-muted-foreground text-sm">Enjoy the entire app without any interruptions from ads.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Exclusive Rewards</h3>
                <p className="text-muted-foreground text-sm">Access a special selection of premium gift cards and products.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activate Your VIP Status</CardTitle>
            <CardDescription>
              {hasDva
                ? 'Transfer the fee to your dedicated account to activate VIP.'
                : 'Generate a dedicated account to pay your VIP subscription fee.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Monthly Fee</p>
              <p className="text-4xl font-bold">₦5,000</p>
            </div>

            {isLoading && <Skeleton className="h-28 w-full" />}
            
            {!isLoading && hasDva && profile && (
              <div className="space-y-4 rounded-lg border bg-muted/50 p-4 text-center">
                 <div className="flex items-center justify-center gap-2 font-semibold">
                    <Landmark className="h-5 w-5 text-muted-foreground" />
                    <h3>Your Payment Account</h3>
                 </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg font-mono font-semibold">{profile.dvaBankName}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(profile.dvaBankName!, 'Bank Name')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                 <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg font-mono font-semibold">{profile.dvaAccountNumber}</p>
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(profile.dvaAccountNumber!, 'Account Number')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                 <p className="text-xs text-muted-foreground pt-2">
                    Transfer exactly ₦5,000 to this account. Your VIP status will be activated automatically upon confirmation.
                </p>
              </div>
            )}

            {!isLoading && !hasDva && (
              <Button onClick={handleGenerateDva} disabled={isGenerating} className="w-full" size="lg">
                {isGenerating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Generate Payment Account
              </Button>
            )}

          </CardContent>
        </Card>
      </div>
    </>
  );
}
