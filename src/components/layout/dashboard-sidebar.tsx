'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  PieChart,
  Users,
  Settings,
  PenLine,
} from 'lucide-react';

const items = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'LP管理',
    href: '/lp',
    icon: FileText,
  },
  {
    title: '文章作成',
    href: '/writing',
    icon: PenLine,
  },
  {
    title: 'テスト結果',
    href: '/tests',
    icon: PieChart,
  },
  {
    title: '会員管理',
    href: '/members',
    icon: Users,
  },
  {
    title: '設定',
    href: '/settings',
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  isOpen: boolean;
}

export function DashboardSidebar({ isOpen }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <nav 
      className={cn(
        "fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out border-r bg-white shadow-lg", 
        isOpen ? "translate-x-0" : "-translate-x-full",
        "w-64"
      )}
    >
      <div className="flex h-full flex-col gap-2 p-4 pt-20 md:pt-4">
        <div className="py-2">
          <h2 className="px-4 text-lg font-semibold tracking-tight text-gray-800">
            メニュー
          </h2>
        </div>
        <div className="flex-1 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => document.dispatchEvent(new Event('closeSidebar'))}
              className={cn(
                'group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5",
                pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-blue-600'
              )} />
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1]"
          onClick={() => document.dispatchEvent(new Event('closeSidebar'))}
        />
      )}
    </nav>
  );
}