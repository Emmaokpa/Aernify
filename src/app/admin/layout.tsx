'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';
import AdminAuthWrapper from './AdminAuthWrapper';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-grow p-4 md:p-8 pb-32 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthWrapper>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminAuthWrapper>
  );
}
