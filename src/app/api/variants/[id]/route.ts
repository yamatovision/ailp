import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getVariantFromDB, updateVariantInDB, deleteVariantFromDB } from '@/server/db/variants';
import { getComponentFromDB } from '@/server/db/lp-components';
import { getLPFromDB } from '@/server/db/lp';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// 特定のバリアント取得API
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // バリアントを取得
    const variant = await getVariantFromDB(id);

    // コンポーネントを取得
    const component = await getComponentFromDB(variant.componentId);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    return NextResponse.json({ variant });
  } catch (error) {
    console.error(`バリアント取得エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'バリアントの取得に失敗しました' }, { status: 500 });
  }
}

// バリアント更新API
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { variantType, htmlContent, cssContent, jsContent, reactComponent, metadata } = await req.json();

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // バリアントを取得
    const variant = await getVariantFromDB(id);

    // コンポーネントを取得
    const component = await getComponentFromDB(variant.componentId);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // バリアントを更新
    const updatedVariant = await updateVariantInDB(id, {
      variantType,
      htmlContent,
      cssContent,
      jsContent,
      reactComponent,
      metadata,
    });

    return NextResponse.json({ variant: updatedVariant });
  } catch (error) {
    console.error(`バリアント更新エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'バリアントの更新に失敗しました' }, { status: 500 });
  }
}

// バリアント削除API
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 認証がない場合はエラー
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // バリアントを取得
    const variant = await getVariantFromDB(id);

    // コンポーネントを取得
    const component = await getComponentFromDB(variant.componentId);

    // LPプロジェクトを取得して所有権を確認
    const lp = await getLPFromDB(component.projectId);
    if (lp.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // バリアントを削除
    await deleteVariantFromDB(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`バリアント削除エラー (ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'バリアントの削除に失敗しました' }, { status: 500 });
  }
}