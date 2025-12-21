
'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Loader2, PackageCheck, Truck, CheckCircle, FileQuestion } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';
const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

function OrderList({ status }: { status: OrderStatus }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { isUserLoading, isAdmin, profile } = useUser();

  const ordersQuery = useMemo(() => {
    // CRITICAL FIX: Only build the query if the user is NOT loading AND is a confirmed admin.
    // If not, this returns null, and useCollection will not execute.
    if (isUserLoading || !isAdmin) {
      return null;
    }

    return query(
      collection(firestore, 'orders'),
      where('status', '==', status),
      orderBy('orderedAt', 'desc')
    );
  }, [firestore, status, isUserLoading, isAdmin]);

  const { data: orders, isLoading: isCollectionLoading } = useCollection<Order>(ordersQuery);
  
  // Combine both loading states for a clearer UI
  const isLoading = isUserLoading || isCollectionLoading;

  if (isLoading) {
    return (
        <div className="text-center py-20 border rounded-lg">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
            <p className="mt-4 text-muted-foreground">Verifying admin permissions...</p>
        </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-20 border rounded-lg">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">No orders found with status "{status}".</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <CardTitle>{order.productName}</CardTitle>
            <CardDescription>Customer: {order.userDisplayName}</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm">Address: {order.shippingInfo.addressLine1}, {order.shippingInfo.city}</p>
             <p className="text-xs text-muted-foreground mt-2">
               {order.orderedAt ? formatDistanceToNow(order.orderedAt.toDate(), { addSuffix: true }) : ''}
             </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <span className="font-bold">{formatToNaira(order.amountPaid)}</span>
            <Button variant="outline">{order.status}</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader title="Admin: Fulfill Orders" description="Manage customer orders." />
      <Tabs defaultValue="pending">
        <TabsList><TabsTrigger value="pending">Pending</TabsTrigger></TabsList>
        <TabsContent value="pending"><OrderList status="pending" /></TabsContent>
      </Tabs>
    </AdminAuthWrapper>
  );
}
