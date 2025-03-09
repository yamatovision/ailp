import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getLPFromDB, updateLPInDB, deleteLPFromDB, duplicateLPInDB } from '@/server/db/lp';
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

// 特定のLP取得API
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // データベースからLPを取得
    const lp = await getLPFromDB(id);

    // アクセス権限の確認 (ユーザーが所有者かどうか)
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    return NextResponse.json({ lp });
  } catch (error) {
    console.error(`LP取得エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'LPの取得に失敗しました' }, { status: 500 });
  }
}

// LP更新API
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { title, description, status, thumbnail } = await req.json();

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // 現在のLPを取得して所有権を確認
    const currentLP = await getLPFromDB(id);
    if (currentLP.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // LPを更新
    const updatedLP = await updateLPInDB(id, {
      title,
      description,
      status,
      thumbnail,
    });

    return NextResponse.json({ lp: updatedLP });
  } catch (error) {
    console.error(`LP更新エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'LPの更新に失敗しました' }, { status: 500 });
  }
}

// LP削除API
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // 現在のLPを取得して所有権を確認
    const currentLP = await getLPFromDB(id);
    if (currentLP.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // LPを削除
    await deleteLPFromDB(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`LP削除エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'LPの削除に失敗しました' }, { status: 500 });
  }
}

// LP複製API
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // 操作の種類をチェック
    if (action !== 'duplicate') {
      return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
    }

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    const userId = session.user.id;

    // 現在のLPを取得して所有権を確認
    const currentLP = await getLPFromDB(id);
    if (currentLP.userId !== userId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // LPを複製
    const duplicatedLP = await duplicateLPInDB(id, userId);

    return NextResponse.json({ lp: duplicatedLP });
  } catch (error) {
    console.error(`LP複製エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'LPの複製に失敗しました' }, { status: 500 });
  }
}