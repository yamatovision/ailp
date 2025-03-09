import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getComponentFromDB, updateComponentInDB, deleteComponentFromDB } from '@/server/db/lp-components';
import { getLPFromDB } from '@/server/db/lp';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// 特定のコンポーネント取得API
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // コンポーネントを取得
    const component = await getComponentFromDB(id);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    return NextResponse.json({ component });
  } catch (error) {
    console.error(`コンポーネント取得エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'コンポーネントの取得に失敗しました' }, { status: 500 });
  }
}

// コンポーネント更新API
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { componentType, position, aiPrompt, aiParameters } = await req.json();

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // コンポーネントを取得
    const component = await getComponentFromDB(id);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // コンポーネントを更新
    const updatedComponent = await updateComponentInDB(id, {
      componentType,
      position,
      aiPrompt,
      aiParameters,
    });

    return NextResponse.json({ component: updatedComponent });
  } catch (error) {
    console.error(`コンポーネント更新エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'コンポーネントの更新に失敗しました' }, { status: 500 });
  }
}

// コンポーネント削除API
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // コンポーネントを取得
    const component = await getComponentFromDB(id);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // コンポーネントを削除
    await deleteComponentFromDB(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`コンポーネント削除エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'コンポーネントの削除に失敗しました' }, { status: 500 });
  }
}