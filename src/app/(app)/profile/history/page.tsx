'use client';
import { useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useFirestore, useSafeCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { WithdrawalRequest } from '@/lib/types';
import { Loader2, CheckCircle, Clock, Ban, ChevronLeft, FileQuestion } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusMap = {
    pending: {
        icon: <Clock className="w-4 h-4" />,
        text: 'Pending',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    processed: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Processed',
        className: 'bg-green-600/20 text-green-400 border-green-600/30'
    },
    rejected: {
        icon: <Ban className="w-4 h-4" />,
        text: 'Rejected',
        className: 'bg-red-600/20 text-red-400 border-red-600/30'
    }
}

export default function WithdrawalHistoryPage() {
    const firestore = useFirestore();

    const { data: requests, isLoading } = useSafeCollection<WithdrawalRequest>(
        (uid) => uid ? query(
            collection(firestore, 'withdrawal_requests'),
            where('userId', '==', uid),
            orderBy('requestedAt', 'desc')
        ) : null
    );
    
    const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    return (
        <>
            <div className='flex justify-between items-center mb-6'>
                <PageHeader title="Withdrawal History" description="A record of all your withdrawal requests." />
                 <Button asChild variant="outline">
                    <Link href="/profile"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Profile</Link>
                </Button>
            </div>
            
            <div className="space-y-4">
                {isLoading && Array.from({length: 3}).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                                <div className='space-y-2'>
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                {!isLoading && requests?.map(req => {
                    const statusInfo = statusMap[req.status];
                    return (
                        <Card key={req.id}>
                            <CardContent className="p-4">
                               <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-bold text-primary">{formatToNaira(req.nairaAmount)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {req.requestedAt ? format(req.requestedAt.toDate(), 'PPP p') : 'Date not available'}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={cn('flex items-center gap-1.5', statusInfo.className)}>
                                        {statusInfo.icon}
                                        {statusInfo.text}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {!isLoading && requests?.length === 0 && (
                     <div className="text-center py-20 rounded-lg bg-card border">
                        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">No History Found</h3>
                        <p className="mt-2 text-muted-foreground">You haven't made any withdrawal requests yet.</p>
                     </div>
                )}
            </div>
        </>
    );
}
