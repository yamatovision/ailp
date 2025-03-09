'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { authService } from '@/lib/auth/auth-service';

export function useAuthRedirect() {
  // このフックはミドルウェアの補助として機能し、
  // ミドルウェアが処理できないクライアントサイドの状態のみを扱う
  
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ローディング中は何もしない
    if (isLoading) {
      return;
    }

    // 現在のパスがパブリックパスか確認
    const isPublicPath = authService.isPublicPath(pathname);
    
    // 認証済みユーザーがログインページにいる場合のみダッシュボードにリダイレクト
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return { isLoading };
}