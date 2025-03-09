import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getLPsFromDB, createLPInDB } from '@/server/db/lp';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// ユーザーセッションを取得する共通関数
async function getUserSession(req: Request) {
  // Cookie経由でセッションを取得
  const supabaseServerClient = createRouteHandlerClient({ cookies });
  const { data, error } = await supabaseServerClient.auth.getSession();
  
  if (error || !data.session) {
    // 認証ヘッダーから取得を試みる
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && userData.user) {
        return { user: userData.user };
      }
    }
    return null;
  }
  
  return data.session;
}

// LP一覧取得API
export async function GET(req: Request) {
  try {
    // クエリパラメータの取得
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const searchQuery = url.searchParams.get('search') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt_desc';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 10;
    const skip = url.searchParams.get('skip') ? parseInt(url.searchParams.get('skip')!) : 0;

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }
    
    // データベースからLPを取得
    const { lps, totalCount } = await getLPsFromDB({
      userId: session.user.id,
      status,
      searchQuery,
      sortBy,
      limit,
      skip,
    });

    return NextResponse.json({
      lps,
      pagination: {
        total: totalCount,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('LP一覧取得エラー:', error);
    return NextResponse.json({ error: 'LPの取得に失敗しました' }, { status: 500 });
  }
}

// LP作成API
export async function POST(req: Request) {
  try {
    const { title, description, status, thumbnail } = await req.json();

    // バリデーション
    if (!title) {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // 新しいLPをデータベースに作成
    const lp = await createLPInDB({
      userId: session.user.id,
      title,
      description,
      status,
      thumbnail,
    });

    return NextResponse.json({ lp });
  } catch (error) {
    console.error('LP作成エラー:', error);
    return NextResponse.json({ error: 'LPの作成に失敗しました' }, { status: 500 });
  }
}