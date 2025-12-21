
'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Loader2, PackageCheck, FileQuestion, Truck, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/firebase/auth-provider';

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);


function OrderList({ status }: { status: OrderStatus }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { isUserLoading, isAdmin } = useAuthContext();

  const ordersQuery = useMemo(() => {
    // Only construct the query if the user is a loaded admin
    if (isUserLoading || !isAdmin) return null;

    return query(
      collection(firestore, 'orders'),
      where('status', '==', status),
      orderBy('orderedAt', 'desc')
    );
  }, [firestore, status, isAdmin, isUserLoading]);

  const { data: orders, isLoading: isCollectionLoading } = useCollection<Order>(ordersQuery);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setProcessingId(orderId);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      toast({
        title: 'Order Status Updated',
        description: `The order has been marked as ${newStatus}.`,
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
  };

  const isLoading = isUserLoading || isCollectionLoading;

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (orders?.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg bg-card border">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Orders Found</h3>
        <p className="mt-2 text-muted-foreground">
          There are no orders with the status &quot;{status}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
      {orders?.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{order.productName}</CardTitle>
                <CardDescription>
                  Ordered by {order.userDisplayName}
                </CardDescription>
              </div>
              <div className="relative aspect-square w-20 rounded-md overflow-hidden border">
                <Image src={order.productImageUrl} alt={order.productName} fill className="object-cover" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="text-sm border-t pt-4">
                <h4 className="font-semibold mb-2">Shipping Information</h4>
                <p><strong>{order.shippingInfo.fullName}</strong></p>
                <p>{order.shippingInfo.addressLine1}</p>
                {order.shippingInfo.addressLine2 && <p>{order.shippingInfo.addressLine2}</p>}
                <p>{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.postalCode}</p>
                <p>{order.shippingInfo.country}</p>
                <p className='mt-2'>Email: {order.shippingInfo.email}</p>
                <p>Phone: {order.shippingInfo.phoneNumber}</p>
             </div>
             <p className="text-xs text-muted-foreground text-right">
              Ordered {order.orderedAt ? formatDistanceToNow(order.orderedAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-primary font-bold">
                <span>{formatToNaira(order.amountPaid)}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={processingId === order.id}>
                 {processingId === order.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                     {order.status === 'pending' && <PackageCheck className="mr-2 h-4 w-4" />}
                     {order.status === 'shipped' && <Truck className="mr-2 h-4 w-4" />}
                     {order.status === 'delivered' && <CheckCircle className="mr-2 h-4 w-4" />}
                    </>
                  )}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'pending')} disabled={order.status === 'pending'}>
                    <PackageCheck className="mr-2 h-4 w-4" /> Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')} disabled={order.status === 'shipped'}>
                    <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')} disabled={order.status === 'delivered'}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Delivered
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    Mark as Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Fulfill Orders"
        description="View and manage customer orders for physical products."
      />
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <OrderList status="pending" />
        </TabsContent>
        <TabsContent value="shipped">
          <OrderList status="shipped" />
        </TabsContent>
        <TabsContent value="delivered">
          <OrderList status="delivered" />
        </TabsContent>
        <TabsContent value="cancelled">
          <OrderList status="cancelled" />
        </TabsContent>
      </Tabs>
    </AdminAuthWrapper>
  );
}
