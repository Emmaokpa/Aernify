
'use client';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Construction } from 'lucide-react';
import Link from 'next/link';

export default function WithdrawalHistoryPage() {
    return (
        <>
            <div className='flex justify-between items-center mb-6'>
                <PageHeader title="Withdrawal History" description="A record of all your withdrawal requests." />
                 <Button asChild variant="outline">
                    <Link href="/profile"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Profile</Link>
                </Button>
            </div>
            
            <div className="text-center py-20 rounded-lg bg-card border">
                <Construction className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Coming Soon!</h3>
                <p className="mt-2 text-muted-foreground">
                    This feature is currently under development.
                    <br />
                    Check back later to see your withdrawal history.
                </p>
            </div>
        </>
    );
}
