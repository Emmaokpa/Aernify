'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
