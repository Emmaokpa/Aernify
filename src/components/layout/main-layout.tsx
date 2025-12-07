'use client';

import React, { useState } from 'react';
import Sidebar from './sidebar';
import Header from './header';
import BottomNav from './bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-grow p-4 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
