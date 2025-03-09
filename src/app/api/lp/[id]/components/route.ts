import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getLPFromDB } from '@/server/db/lp';
import { getComponentsFromDB, createComponentInDB, updateComponentPositionsInDB } from '@/server/db/lp-components';
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

// コンポーネント一覧取得API
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // コンポーネント一覧を取得
    const components = await getComponentsFromDB(projectId);

    return NextResponse.json({ components });
  } catch (error) {
    console.error(`コンポーネント一覧取得エラー (プロジェクトID: ${params.id}):`, error);
    return NextResponse.json({ error: 'コンポーネントの取得に失敗しました' }, { status: 500 });
  }
}

// コンポーネント作成API
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const { componentType, position, aiPrompt, aiParameters } = await req.json();

    // バリデーション
    if (!componentType) {
      return NextResponse.json({ error: 'コンポーネントタイプは必須です' }, { status: 400 });
    }

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // 新しいコンポーネントを作成
    const component = await createComponentInDB({
      projectId,
      componentType,
      position,
      aiPrompt,
      aiParameters,
    });

    return NextResponse.json({ component });
  } catch (error) {
    console.error(`コンポーネント作成エラー (プロジェクトID: ${params.id}):`, error);
    return NextResponse.json({ error: 'コンポーネントの作成に失敗しました' }, { status: 500 });
  }
}

// コンポーネント位置の一括更新API
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const { components } = await req.json();

    // バリデーション
    if (!components || !Array.isArray(components)) {
      return NextResponse.json({ error: 'コンポーネント配列は必須です' }, { status: 400 });
    }

    // 認証セッションを取得
    const session = await getUserSession(req);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // コンポーネント位置を一括更新
    await updateComponentPositionsInDB(components);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`コンポーネント位置更新エラー (プロジェクトID: ${params.id}):`, error);
    return NextResponse.json({ error: 'コンポーネント位置の更新に失敗しました' }, { status: 500 });
  }
}