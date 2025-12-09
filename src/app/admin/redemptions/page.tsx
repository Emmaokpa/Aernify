'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WithId } from '@/lib/types';

// Define the shape of a Redemption document
export type Redemption = {
  userId: string;
  userEmail: string;
  giftCardId: string;
  giftCardName: string;
  giftCardValue: number;
  coinCost: number;
  status: 'pending' | 'fulfilled';
  redemptionDate: Date;
};

const staticRedemptions: WithId<Redemption>[] = [
    {
        id: 'r1',
        userId: 'u1',
        userEmail: 'user1@example.com',
        giftCardId: 'gc1',
        giftCardName: 'Amazon Gift Card',
        giftCardValue: 10,
        coinCost: 10000,
        status: 'pending',
        redemptionDate: new Date('2024-07-25T10:00:00Z'),
    },
    {
        id: 'r2',
        userId: 'u2',
        userEmail: 'user2@example.com',
        giftCardId: 'gc2',
        giftCardName: 'Google Play Gift Card',
        giftCardValue: 15,
        coinCost: 15000,
        status: 'pending',
        redemptionDate: new Date('2024-07-25T11:30:00Z'),
    },
    {
        id: 'r3',
        userId: 'u3',
        userEmail: 'user3@example.com',
        giftCardId: 'gc3',
        giftCardName: 'Apple Gift Card',
        giftCardValue: 25,
        coinCost: 25000,
        status: 'fulfilled',
        redemptionDate: new Date('2024-07-24T14:00:00Z'),
    }
]

function RedemptionList({ 
  redemptions, 
  onFulfill,
  fulfillingId 
}: { 
  redemptions: WithId<Redemption>[] | null, 
  onFulfill: (id: string) => void,
  fulfillingId: string | null,
}) {
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
        {format(redemption.redemptionDate, 'MMM d, yyyy, h:mm a')}
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
  const [redemptions, setRedemptions] = useState(staticRedemptions);
  const [activeTab, setActiveTab] = useState<'pending' | 'fulfilled'>('pending');
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  const fulfilledRedemptions = redemptions.filter(r => r.status === 'fulfilled');

  const handleFulfill = (id: string) => {
    setFulfillingId(id);
    setTimeout(() => {
        setRedemptions(redemptions.map(r => r.id === id ? { ...r, status: 'fulfilled' } : r));
        setFulfillingId(null);
    }, 1000);
  };

  return (
    <>
      <PageHeader
        title="Manage Redemptions"
        description="View and fulfill gift card redemption requests from users."
      />

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
