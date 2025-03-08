'use client';

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // デフォルトでは閉じた状態
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleCloseSidebar = () => {
      setSidebarOpen(false);
    };

    document.addEventListener('closeSidebar', handleCloseSidebar);
    
    return () => {
      document.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <DashboardHeader toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 relative">
        <DashboardSidebar isOpen={sidebarOpen} />
        <main className="flex-1 p-4 md:p-6 w-full">{children}</main>
      </div>
    </div>
  );
}