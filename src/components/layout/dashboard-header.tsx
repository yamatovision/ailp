'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { UserNav } from './user-nav';

interface DashboardHeaderProps {
  toggleSidebar: () => void;
}

export function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-[#3f51b5] text-white">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#4a5dc7] mr-2 flex-shrink-0" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">メニュー切替</span>
          </Button>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold">多変量テストLP作成システム</span>
          </Link>
        </div>
        <div className="flex items-center">
          <UserNav />
        </div>
      </div>
    </header>
  );
}