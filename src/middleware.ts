import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// 認証が不要なパス
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

// 開発環境で認証をスキップするAPI
const publicApiPaths = ['/api/chat'];

// デバッグモード - 開発中はミドルウェアを単純化
const isDevMode = process.env.NODE_ENV === 'development';

export async function middleware(request: NextRequest) {
  try {
    // リクエストURLの検証
    let requestUrl;
    try {
      requestUrl = new URL(request.url);
    } catch (err) {
      console.error('Invalid URL in middleware:', request.url);
      return NextResponse.next();
    }

    // 開発モードでデバッグ用の特別なクエリパラメータがある場合はミドルウェアをスキップ
    if (isDevMode && requestUrl.searchParams.get('skip_auth') === 'true') {
      console.log('開発モード: 認証チェックをスキップします');
      return NextResponse.next();
    }

    // 初期レスポンスを生成
    const response = NextResponse.next();

    // 環境変数チェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('環境変数が不足しています: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return response;
    }

    // 現在のパスがpublicPaths配列に含まれているか確認
    const isPublicPath = publicPaths.some((path) => 
      requestUrl.pathname === path || 
      requestUrl.pathname.startsWith(`${path}/`) ||
      // supabase auth callbackのパスを許可
      requestUrl.pathname.startsWith('/api/auth')
    ) || (
      // 開発環境で特定のAPIを認証なしで許可
      isDevMode && publicApiPaths.some(path => 
        requestUrl.pathname === path || 
        requestUrl.pathname.startsWith(`${path}/`)
      )
    );

    // 開発モードでダッシュボードへの直接アクセスを許可
    if (isDevMode && requestUrl.pathname.startsWith('/dashboard')) {
      console.log('開発モード: ダッシュボードへの直接アクセスを許可します');
      return response;
    }

    // Supabaseミドルウェアクライアントを生成
    let supabase;
    try {
      supabase = createMiddlewareClient({ req: request, res: response });
    } catch (err) {
      console.error('Supabaseクライアント生成エラー:', err);
      return response;
    }

    // セッションを取得
    let session;
    try {
      // 開発モードではセッションチェックを簡略化
      if (isDevMode && requestUrl.pathname.startsWith('/dashboard')) {
        // 開発中はダッシュボードアクセスを常に許可
        session = { user: { id: 'dev-user-id' } };
      } else {
        // 通常のセッション取得
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }
    } catch (err) {
      console.error('セッション取得エラー:', err);
      return response;
    }

    // 安全なURLの構築
    const safeBaseUrl = request.nextUrl.origin;

    // 認証されていないユーザーがpublic以外にアクセスした場合はログインページにリダイレクト
    if (!session && !isPublicPath) {
      return NextResponse.redirect(new URL('/login', safeBaseUrl));
    }

    // 認証済みユーザーがpublicPathsにアクセスした場合はダッシュボードにリダイレクト
    // ただし、ルートパス(/)へのアクセスはリダイレクトしない
    if (session && isPublicPath && requestUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/dashboard', safeBaseUrl));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // エラーが発生した場合は、処理を続行
    return NextResponse.next();
  }
}

// パスに基づいてミドルウェアを適用
export const config = {
  matcher: [
    /*
     * 以下のパスにマッチ:
     * - /dashboard, /dashboard/... など
     * - /api/dashboard, /api/dashboard/... など
     * - /login, /register など認証関連ページ
     * - / (ルートページ)
     */
    '/dashboard/:path*',
    '/api/:path*',
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};