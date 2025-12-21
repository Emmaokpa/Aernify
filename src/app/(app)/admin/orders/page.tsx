'use client';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Construction } from 'lucide-react';

export default function AdminOrdersPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Fulfill Orders"
        description="Manage customer orders."
      />
      <div className="text-center py-20 rounded-lg bg-card border">
        <Construction className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">Coming Soon</h3>
        <p className="mt-2 text-muted-foreground">
          The order management feature is currently being improved.
          <br />
          Please check back later.
        </p>
      </div>
    </AdminAuthWrapper>
  );
}
