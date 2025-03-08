'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

// 認証が不要なパス
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ローディング中は何もしない
    if (isLoading) return;

    // 現在のパスがpublicPathsに含まれているか確認
    const isPublicPath = publicPaths.some(path => 
      pathname === path || 
      pathname.startsWith(`${path}/`) ||
      pathname.startsWith('/api/auth')
    );

    // 認証されていないユーザーがpublic以外にアクセスした場合はログインページにリダイレクト
    if (!isAuthenticated && !isPublicPath) {
      router.push('/login');
      return;
    }

    // 認証済みユーザーがpublicPathsにアクセスした場合はダッシュボードにリダイレクト
    // ただし、ルートパス(/)へのアクセスはリダイレクトしない
    if (isAuthenticated && isPublicPath && pathname !== '/') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return { isLoading };
}