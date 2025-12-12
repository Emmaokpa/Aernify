'use client';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, writeBatch, doc, increment, serverTimestamp } from 'firebase/firestore';
import { Loader2, Coins, Banknote, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const COIN_TO_NAIRA_RATE = 0.5; // 1 coin = 0.5 Naira
const MINIMUM_WITHDRAWAL_COINS = 1000;

const withdrawalSchema = z.object({
  coinsToWithdraw: z.coerce.number()
    .min(MINIMUM_WITHDRAWAL_COINS, `Minimum withdrawal is ${MINIMUM_WITHDRAWAL_COINS} coins.`),
  bankName: z.string().min(2, 'Bank name is required.'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  accountName: z.string().min(3, 'Account holder name is required.'),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function WithdrawPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, profile, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
        coinsToWithdraw: MINIMUM_WITHDRAWAL_COINS,
    }
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const coinsToWithdraw = watch('coinsToWithdraw', MINIMUM_WITHDRAWAL_COINS);
  const nairaAmount = coinsToWithdraw * COIN_TO_NAIRA_RATE;
  
  const hasSufficientCoins = profile ? profile.coins >= coinsToWithdraw : false;

  const onSubmit: SubmitHandler<WithdrawalFormData> = async (data) => {
    if (!user || !profile) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to make a withdrawal.' });
        return;
    }
    if (!hasSufficientCoins) {
        toast({ variant: 'destructive', title: 'Insufficient Coins', description: `You do not have enough coins to withdraw ${data.coinsToWithdraw}.` });
        return;
    }

    setIsSubmitting(true);
    
    const batch = writeBatch(firestore);
    const userRef = doc(firestore, 'users', user.uid);
    const withdrawalRef = doc(collection(firestore, 'withdrawal_requests'));

    // 1. Deduct coins from user's balance
    batch.update(userRef, { coins: increment(-data.coinsToWithdraw) });

    // 2. Create the withdrawal request document
    batch.set(withdrawalRef, {
        userId: user.uid,
        userDisplayName: profile.displayName || 'Anonymous',
        coinsToWithdraw: data.coinsToWithdraw,
        nairaAmount: data.coinsToWithdraw * COIN_TO_NAIRA_RATE,
        bankDetails: {
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
        },
        status: 'pending',
        requestedAt: serverTimestamp(),
    });

    try {
        await batch.commit();
        toast({
            title: 'Request Submitted!',
            description: 'Your withdrawal request is pending review. It may take up to 3 business days to process.',
        });
        form.reset();
    } catch (error) {
        console.error("Error submitting withdrawal request:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Withdraw Earnings"
        description="Convert your coins into real cash. Withdrawals are sent to your Nigerian bank account."
      />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>New Withdrawal Request</CardTitle>
                    <CardDescription>Enter the amount and your bank details below. Please double-check all information before submitting.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label htmlFor="coinsToWithdraw">Coins to Withdraw</Label>
                            <Input id="coinsToWithdraw" type="number" {...register('coinsToWithdraw')} />
                            {errors.coinsToWithdraw && <p className="text-sm text-destructive mt-1">{errors.coinsToWithdraw.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input id="bankName" {...register('bankName')} placeholder="e.g., Kuda Bank"/>
                            {errors.bankName && <p className="text-sm text-destructive mt-1">{errors.bankName.message}</p>}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="accountNumber">Account Number (10 digits)</Label>
                                <Input id="accountNumber" {...register('accountNumber')} />
                                {errors.accountNumber && <p className="text-sm text-destructive mt-1">{errors.accountNumber.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="accountName">Account Name</Label>
                                <Input id="accountName" {...register('accountName')} />
                                {errors.accountName && <p className="text-sm text-destructive mt-1">{errors.accountName.message}</p>}
                            </div>
                        </div>

                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full" size="lg" disabled={isSubmitting || !hasSufficientCoins || !!Object.keys(errors).length}>
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Banknote className="mr-2 h-4 w-4" />
                                    )}
                                    Submit Request
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are about to withdraw <span className="font-bold text-primary">{coinsToWithdraw.toLocaleString()} coins</span> for <span className="font-bold text-primary">₦{nairaAmount.toLocaleString()}</span>. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSubmit(onSubmit)}>
                                    Confirm & Proceed
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </form>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle className='text-lg'>Your Balance</CardTitle>
                </CardHeader>
                <CardContent>
                     {isUserLoading ? (
                        <Skeleton className="h-12 w-3/4" />
                     ) : (
                        <p className="text-4xl font-bold text-primary flex items-center gap-2">
                            <Coins className="w-9 h-9" />
                            <span>{profile?.coins?.toLocaleString() ?? 0}</span>
                        </p>
                     )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className='text-lg'>Summary</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>You Withdraw:</span>
                        <span className='font-semibold'>{coinsToWithdraw.toLocaleString()} coins</span>
                    </div>
                     <div className='flex justify-between'>
                        <span className='text-muted-foreground'>You Receive:</span>
                        <span className='font-semibold text-green-500'>₦{nairaAmount.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
             <div className="flex items-start p-4 rounded-lg bg-yellow-600/10 border border-yellow-600/20 text-yellow-400">
              <AlertTriangle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Please Note</h4>
                <p className="text-sm">
                  The current conversion rate is {COIN_TO_NAIRA_RATE} Naira per coin. The minimum withdrawal is {MINIMUM_WITHDRAWAL_COINS} coins.
                </p>
              </div>
            </div>
        </div>
      </div>
    </>
  );
}

    