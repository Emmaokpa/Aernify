
'use client';

import { useState } from 'react';
import { collection, doc, writeBatch, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the shape of a Redemption document
export type Redemption = {
  userId: string;
  userEmail: string;
  giftCardId: string;
  giftCardName: string;
  giftCardValue: number;
  coinCost: number;
  status: 'pending' | 'fulfilled';
  redemptionDate: {
    seconds: number;
    nanoseconds: number;
  };
};

function RedemptionList({ 
  redemptions, 
  isLoading, 
  onFulfill,
  fulfillingId 
}: { 
  redemptions: WithId<Redemption>[] | null, 
  isLoading: boolean, 
  onFulfill: (id: string) => Promise<void>,
  fulfillingId: string | null,
}) {
  if (isLoading) {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
      </TableRow>
    ));
  }

  if (!redemptions || redemptions.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center h-24">
          No redemptions found.
        </TableCell>
      </TableRow>
    );
  }

  return redemptions.map((redemption) => (
    <TableRow key={redemption.id}>
      <TableCell className="font-medium">
        {redemption.redemptionDate ? format(new Date(redemption.redemptionDate.seconds * 1000), 'MMM d, yyyy, h:mm a') : 'Date N/A'}
      </TableCell>
      <TableCell>{redemption.userEmail}</TableCell>
      <TableCell>{redemption.giftCardName} (${redemption.giftCardValue})</TableCell>
      <TableCell>
        <Badge variant={redemption.status === 'pending' ? 'destructive' : 'default'}>
          {redemption.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {redemption.status === 'pending' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onFulfill(redemption.id)}
            disabled={fulfillingId === redemption.id}
          >
            {fulfillingId === redemption.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Fulfilled
          </Button>
        )}
      </TableCell>
    </TableRow>
  ));
}


export default function ManageRedemptionsPage() {
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'fulfilled'>('pending');
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const firestore = useFirestore();
  const redemptionsCollectionRef = useMemoFirebase(() => collection(firestore, 'redemptions'), [firestore]);

  const pendingQuery = useMemoFirebase(() => query(redemptionsCollectionRef, where('status', '==', 'pending'), orderBy('redemptionDate', 'desc')), [redemptionsCollectionRef]);
  const fulfilledQuery = useMemoFirebase(() => query(redemptionsCollectionRef, where('status', '==', 'fulfilled'), orderBy('redemptionDate', 'desc')), [redemptionsCollectionRef]);

  const { data: pendingRedemptions, isLoading: arePendingLoading, error: pendingReadError } = useCollection<Redemption>(pendingQuery);
  const { data: fulfilledRedemptions, isLoading: areFulfilledLoading, error: fulfilledReadError } = useCollection<Redemption>(fulfilledQuery);

  const readError = pendingReadError || fulfilledReadError;

  const handleFulfill = async (id: string) => {
    setFeedbackMessage(null);
    setFulfillingId(id);
    try {
      const redemptionDocRef = doc(firestore, 'redemptions', id);
      const batch = writeBatch(firestore);
      batch.update(redemptionDocRef, { status: 'fulfilled' });
      await batch.commit();
      setFeedbackMessage({ type: 'success', message: 'Redemption marked as fulfilled!' });
    } catch (error: any) {
      console.error("Fulfill failed:", error);
      setFeedbackMessage({ type: 'error', message: `FULFILL FAILED: ${error.code} - ${error.message}` });
    } finally {
      setFulfillingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Manage Redemptions"
        description="View and fulfill gift card redemption requests from users."
      />

      {feedbackMessage && (
        <Alert variant={feedbackMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          {feedbackMessage.type === 'error' 
             ? <XCircle className="h-4 w-4" /> 
             : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{feedbackMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{feedbackMessage.message}</AlertDescription>
        </Alert>
      )}

      {readError && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Read Error</AlertTitle>
            <AlertDescription>
              Could not load redemption requests. Please check your connection and security rules.
              <br />
              Details: {readError.message}
            </AlertDescription>
          </Alert>
        )}

      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'fulfilled')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                <div className="border rounded-md mt-4">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Gift Card</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <RedemptionList
                        redemptions={pendingRedemptions}
                        isLoading={arePendingLoading}
                        onFulfill={handleFulfill}
                        fulfillingId={fulfillingId}
                        />
                    </TableBody>
                    </Table>
                </div>
            </TabsContent>
            <TabsContent value="fulfilled">
                <div className="border rounded-md mt-4">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Gift Card</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <RedemptionList
                        redemptions={fulfilledRedemptions}
                        isLoading={areFulfilledLoading}
                        onFulfill={handleFulfill}
                        fulfillingId={fulfillingId}
                        />
                    </TableBody>
                    </Table>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
