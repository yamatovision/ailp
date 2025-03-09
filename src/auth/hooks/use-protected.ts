'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/auth/hooks/use-auth';

// 認証が不要なパス
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function useProtected() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // ローディング中は何もしない - 初期化中のリダイレクトを防止
    if (isLoading) {
      return;
    }

    // 現在のパスがパブリックかどうか確認
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // 認証済みユーザーがログインページなどにアクセスした場合、ダッシュボードにリダイレクト
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      // リダイレクトクエリパラメータがある場合はそこにリダイレクト
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectTo);
      return;
    }
    
    // 非認証ユーザーが保護されたページにアクセスした場合
    // ミドルウェアで既に処理されているので、通常は不要
    // クライアントサイドのバックアップとして実装
    // window.location.href を使用してリダイレクトすると無限ループになるので注意
    if (!isAuthenticated && !isPublicPath) {
      console.log('保護されたページに未認証アクセス - クライアントサイドリダイレクト');
      const redirectTo = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  return { isLoading };
}