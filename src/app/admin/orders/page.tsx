'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, where, WriteBatch, writeBatch } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Loader2, Package, PackageCheck, User, Coins, Truck, Home, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
        case 'pending':
            return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
        case 'shipped':
            return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
        case 'delivered':
            return 'bg-green-500/20 text-green-500 border-green-500/30';
        case 'cancelled':
            return 'bg-red-500/20 text-red-500 border-red-500/30';
        default:
            return 'bg-muted';
    }
}


function OrderList({ status }: { status: Order['status'] }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const ordersQuery = useMemo(() => {
    return query(
        collection(firestore, 'orders'), 
        where('status', '==', status),
        orderBy('orderedAt', 'desc')
    );
  }, [firestore, status]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setProcessingId(orderId);
    try {
        const orderRef = doc(firestore, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        toast({
            title: 'Order Updated',
            description: `Order status changed to ${newStatus}.`
        });
    } catch (error: any) {
        console.error('Error updating order status:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update the order status.',
        });
    } finally {
        setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
           <Card key={i}><CardContent className='p-6'><Skeleton className="h-64 w-full" /></CardContent></Card>
        ))}
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg bg-card border-dashed border-2">
        <Package className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No {status} orders</h3>
        <p className="mt-2 text-muted-foreground">
          There are currently no orders with this status.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {orders.map((order) => {
        const isProcessing = processingId === order.id;
        return (
            <Card key={order.id}>
                <CardHeader>
                     <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="text-lg">{order.productName}</CardTitle>
                             <p className="text-sm text-muted-foreground">
                                Ordered {order.orderedAt ? formatDistanceToNow(order.orderedAt.toDate(), { addSuffix: true }) : 'just now'}
                            </p>
                        </div>
                        <Badge variant="outline" className={cn(getStatusBadgeVariant(order.status), "capitalize")}>{order.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                         <div className="relative w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0">
                            <Image src={order.productImageUrl} alt={order.productName} fill className="object-cover" />
                        </div>
                        <div className="text-sm space-y-1">
                            <p className="flex items-center gap-2"><User className="w-4 h-4"/>{order.userDisplayName}</p>
                            <p className="flex items-center gap-2"><Coins className="w-4 h-4 text-primary"/>{order.coinsSpent.toLocaleString()} Coins</p>
                        </div>
                    </div>
                    <div className="text-sm space-y-2 border-t pt-4">
                        <h4 className='font-semibold mb-2'>Shipping Address</h4>
                        <p className="flex items-start gap-2"><Home className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                            <span>
                            {order.shippingInfo.fullName}<br />
                            {order.shippingInfo.addressLine1}<br />
                            {order.shippingInfo.addressLine2 && <>{order.shippingInfo.addressLine2}<br /></>}
                            {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.postalCode}<br/>
                            {order.shippingInfo.country}
                            </span>
                        </p>
                        <p className="flex items-center gap-2"><Phone className="w-4 h-4"/>{order.shippingInfo.phoneNumber}</p>
                    </div>
                </CardContent>
                {order.status === 'pending' && (
                    <CardFooter className="flex justify-end gap-2">
                        <Button
                        size="sm"
                        onClick={() => handleStatusChange(order.id, 'shipped')}
                        disabled={isProcessing}
                        >
                        {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Truck className="mr-1 h-4 w-4" />
                        )}
                        Mark as Shipped
                        </Button>
                    </CardFooter>
                )}
                 {order.status === 'shipped' && (
                    <CardFooter className="flex justify-end gap-2">
                        <Button
                        size="sm"
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        disabled={isProcessing}
                        className='bg-green-600 hover:bg-green-700'
                        >
                        {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <PackageCheck className="mr-1 h-4 w-4" />
                        )}
                        Mark as Delivered
                        </Button>
                    </CardFooter>
                )}
            </Card>
        )
      })}
    </div>
  );
}

export default function AdminFulfillOrdersPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Fulfill Orders"
        description="View and manage customer orders for physical products."
      />
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
            <OrderList status="pending" />
        </TabsContent>
        <TabsContent value="shipped">
            <OrderList status="shipped" />
        </Tabs.Content>
         <TabsContent value="delivered">
            <OrderList status="delivered" />
        </TabsContent>
      </Tabs>
    </AdminAuthWrapper>
  );
}

    