import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getComponentFromDB } from '@/server/db/lp-components';
import { getLPFromDB } from '@/server/db/lp';
import { getVariantsFromDB, createVariantInDB, deleteAllVariantsFromDB } from '@/server/db/variants';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// バリアント一覧取得API
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const componentId = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // コンポーネントを取得
    const component = await getComponentFromDB(componentId);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // バリアント一覧を取得
    const variants = await getVariantsFromDB(componentId);

    return NextResponse.json({ variants });
  } catch (error) {
    console.error(`バリアント一覧取得エラー (コンポーネントID: ${params.id}):`, error);
    return NextResponse.json({ error: 'バリアントの取得に失敗しました' }, { status: 500 });
  }
}

// バリアント作成API
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const componentId = params.id;
    const { variantType, htmlContent, cssContent, jsContent, reactComponent, metadata } = await req.json();

    // バリデーション
    if (!variantType) {
      return NextResponse.json({ error: 'バリアントタイプは必須です' }, { status: 400 });
    }

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // コンポーネントを取得
    const component = await getComponentFromDB(componentId);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // 新しいバリアントを作成
    const variant = await createVariantInDB({
      componentId,
      variantType,
      htmlContent,
      cssContent,
      jsContent,
      reactComponent,
      metadata,
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error(`バリアント作成エラー (コンポーネントID: ${params.id}):`, error);
    return NextResponse.json({ error: 'バリアントの作成に失敗しました' }, { status: 500 });
  }
}

// 全バリアント削除API
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const componentId = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // コンポーネントを取得
    const component = await getComponentFromDB(componentId);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // 全バリアントを削除
    await deleteAllVariantsFromDB(componentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`全バリアント削除エラー (コンポーネントID: ${params.id}):`, error);
    return NextResponse.json({ error: 'バリアントの削除に失敗しました' }, { status: 500 });
  }
}