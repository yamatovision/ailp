import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// 認証が不要なパス
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

// 認証をスキップするAPI
const publicApiPaths = [
  '/api/auth',
  '/api/public',
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // URLの検証
    const url = new URL(request.url);
    
    // パブリックパス判定のシンプル化
    const isPublicPath = publicPaths.some(path => 
      url.pathname === path || 
      url.pathname.startsWith(`${path}/`)
    ) || publicApiPaths.some(path => 
      url.pathname.startsWith(path)
    );
    
    // パブリックパスは通過
    if (isPublicPath) {
      return response;
    }
    
    // Supabaseミドルウェアクライアントの生成
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    // セッションの確認
    const { data } = await supabase.auth.getSession();
    
    // 開発環境のみログ出力
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Middleware] ${url.pathname} - 認証状態:`, {
        hasSession: !!data.session,
        userId: data.session?.user?.id ?? 'なし',
      });
    }
    
    // 認証されているユーザーのログを出力（開発環境のみ）
    if (data.session?.user && process.env.NODE_ENV !== 'production') {
      console.log(`[Middleware] 認証済みユーザー: ${data.session.user.email} (${data.session.user.id})`);
    }
    
    // 認証されていない場合はログインページにリダイレクト
    if (!data.session) {
      // リダイレクト先のURLを記録（ログイン後に戻るため）
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', url.pathname);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Middleware] 未認証アクセス: ${url.pathname} -> ${redirectUrl.pathname} へリダイレクト`);
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

// パスに基づいてミドルウェアを適用
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/lp/:path*',
    '/members/:path*',
    '/tests/:path*',
    '/api/:path*',
  ],
};