
'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useSafeCollection } from '@/firebase';
import { useAuthContext } from '@/firebase/auth-provider';
import { collection, doc, updateDoc, query, where, orderBy, collectionGroup } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Loader2, PackageCheck, Truck, CheckCircle, FileQuestion, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';
const formatToNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const statusIcons = {
    pending: <PackageCheck className="mr-2 h-4 w-4" />,
    shipped: <Truck className="mr-2 h-4 w-4" />,
    delivered: <CheckCircle className="mr-2 h-4 w-4" />,
    cancelled: <Ban className="mr-2 h-4 w-4" />
}

function OrderList({ status }: { status: OrderStatus }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { data: orders, isLoading } = useSafeCollection<Order>(
    (uid) => {
      // The admin needs to query all orders, so we use a collectionGroup query.
      // The security rules will enforce that only admins can perform this query.
      return query(
        collectionGroup(firestore, 'orders'),
        where('status', '==', status),
        orderBy('orderedAt', 'desc')
      );
    }
  );

  const handleStatusChange = async (orderId: string, userId: string, newStatus: OrderStatus) => {
    setProcessingId(orderId);
    try {
        // The path to the order is now inside a user's subcollection
        const orderRef = doc(firestore, 'users', userId, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        toast({
            title: 'Order Updated',
            description: `The order has been marked as ${newStatus}.`
        });
    } catch (error) {
        console.error("Error updating order status: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update order status.'
        });
    } finally {
        setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg bg-card border">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Orders Found</h3>
        <p className="mt-2 text-muted-foreground">There are no orders with the status "{status}".</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
      {orders.map((order) => (
        <Card key={order.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="text-lg">{order.productName}</CardTitle>
                    <CardDescription>Order from: {order.shippingInfo.fullName}</CardDescription>
                </div>
                <div className="text-lg font-bold text-primary">{formatToNaira(order.amountPaid)}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className='flex gap-4'>
                <Link href={`/shop/${order.productId}`} className="block">
                  <div className='relative w-24 h-24 rounded-md overflow-hidden border hover:opacity-80 transition-opacity'>
                      <Image src={order.productImageUrl} alt={order.productName} fill className='object-cover'/>
                  </div>
                </Link>
                <div className='text-sm'>
                    <h4 className='font-semibold'>Shipping Address</h4>
                    <p className='text-muted-foreground'>
                        {order.shippingInfo.addressLine1}, {order.shippingInfo.city}, {order.shippingInfo.state}, {order.shippingInfo.country}
                    </p>
                    <p className='text-muted-foreground font-medium'>{order.shippingInfo.phoneNumber}</p>
                </div>
            </div>
             {order.selectedVariant && (
                <div className="text-sm">
                    <span className="text-muted-foreground">Variant: </span>
                    <span className="font-semibold">{order.selectedVariant.color}</span>
                </div>
             )}
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/30 p-4">
             <p className="text-xs text-muted-foreground">
               {order.orderedAt ? formatDistanceToNow(order.orderedAt.toDate(), { addSuffix: true }) : ''}
             </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={processingId === order.id} className="capitalize w-36">
                 {processingId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : statusIcons[order.status]}
                  {order.status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['pending', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                    <DropdownMenuItem 
                        key={s}
                        onClick={() => handleStatusChange(order.id, order.userId, s)}
                        disabled={order.status === s}
                    >
                       {statusIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                    </DropdownMenuItem>
                ))}
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
        description="Review and manage customer orders for physical products."
      />
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><OrderList status="pending" /></TabsContent>
        <TabsContent value="shipped"><OrderList status="shipped" /></TabsContent>
        <TabsContent value="delivered"><OrderList status="delivered" /></TabsContent>
        <TabsContent value="cancelled"><OrderList status="cancelled" /></TabsContent>
      </Tabs>
    </AdminAuthWrapper>
  );
}
