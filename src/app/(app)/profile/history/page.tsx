
'use client';
import { useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileQuestion, Loader2, Coins, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSafeCollection, useFirestore } from '@/firebase';
import type { WithdrawalRequest } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500' },
    processed: { icon: CheckCircle, color: 'text-green-500' },
    rejected: { icon: XCircle, color: 'text-destructive' },
};

function HistoryCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardFooter>
                 <Skeleton className="h-5 w-24" />
            </CardFooter>
        </Card>
    )
}

function WithdrawalHistoryList() {
    const firestore = useFirestore();

    const { data: requests, isLoading } = useSafeCollection<WithdrawalRequest>(
        (uid) => uid ? query(
            collection(firestore, 'withdrawal_requests'), 
            where('userId', '==', uid),
            orderBy('requestedAt', 'desc')
        ) : null
    );

    const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    if (isLoading) {
        return (
             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <HistoryCardSkeleton />
                <HistoryCardSkeleton />
                <HistoryCardSkeleton />
            </div>
        )
    }

    if (!requests || requests.length === 0) {
         return (
            <div className="text-center py-20 rounded-lg bg-card border">
                <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No History Found</h3>
                <p className="mt-2 text-muted-foreground">
                    You haven't made any withdrawal requests yet.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => {
                const StatusIcon = statusConfig[req.status].icon;
                return (
                    <Card key={req.id}>
                        <CardHeader>
                            <CardTitle className="text-2xl">{formatToNaira(req.nairaAmount)}</CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-1">
                                <Coins className="w-4 h-4 text-primary"/> 
                                <span>{req.coinsToWithdraw.toLocaleString()} coins</span>
                            </CardDescription>
                        </CardHeader>
                         <CardContent>
                             <div className="text-sm space-y-1 text-muted-foreground">
                                 <p><strong>To:</strong> {req.bankDetails.accountName}</p>
                                 <p><strong>Bank:</strong> {req.bankDetails.bankName}</p>
                                 <p><strong>Acct No:</strong> {req.bankDetails.accountNumber}</p>
                             </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center text-sm">
                           <div className="flex items-center gap-2 text-muted-foreground text-xs">
                             <Calendar className="w-3.5 h-3.5" />
                             <span>{req.requestedAt ? format(req.requestedAt.toDate(), 'MMM d, yyyy') : '...'}</span>
                           </div>
                           <div className={cn("flex items-center gap-1.5 font-semibold capitalize", statusConfig[req.status].color)}>
                            <StatusIcon className="w-4 h-4" />
                            <span>{req.status}</span>
                           </div>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}

export default function WithdrawalHistoryPage() {
    return (
        <>
            <div className='flex justify-between items-center mb-6'>
                <PageHeader title="Withdrawal History" description="A record of all your withdrawal requests." />
                 <Button asChild variant="outline">
                    <Link href="/profile"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Profile</Link>
                </Button>
            </div>
            <WithdrawalHistoryList />
        </>
    );
}
