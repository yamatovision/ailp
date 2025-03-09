import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getLPFromDB, updateLPInDB } from '@/server/db/lp';

// デザインシステム保存API
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { designSystem, designStyle } = await req.json();

    // 認証セッションを取得
    const supabaseServerClient = createRouteHandlerClient({ cookies });
    const { data, error } = await supabaseServerClient.auth.getSession();

    // 認証がない場合はエラー
    if (error || !data.session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    const userId = data.session.user.id;

    // 現在のLPを取得して所有権を確認
    const currentLP = await getLPFromDB(id);
    if (currentLP.userId !== userId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // デザインシステムをデータベースに保存
    const updatedLP = await updateLPInDB(id, {
      designSystem,
      designStyle
    });

    return NextResponse.json({ 
      success: true, 
      message: 'デザインシステムを保存しました',
      lp: updatedLP
    });
  } catch (error) {
    console.error(`デザインシステム保存エラー (LP ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'デザインシステムの保存に失敗しました' }, { status: 500 });
  }
}

// デザインシステム取得API
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 認証セッションを取得
    const supabaseServerClient = createRouteHandlerClient({ cookies });
    const { data, error } = await supabaseServerClient.auth.getSession();

    // 認証がない場合はエラー
    if (error || !data.session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    const userId = data.session.user.id;

    // LPを取得して所有権を確認
    const lp = await getLPFromDB(id);
    if (lp.userId !== userId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // デザインシステム情報がない場合
    if (!lp.designSystem) {
      return NextResponse.json({ 
        designStyle: lp.designStyle || null,
        designSystem: null 
      });
    }

    return NextResponse.json({ 
      designStyle: lp.designStyle,
      designSystem: lp.designSystem 
    });
  } catch (error) {
    console.error(`デザインシステム取得エラー (LP ID: ${params.id}):`, error);
    return NextResponse.json({ error: 'デザインシステムの取得に失敗しました' }, { status: 500 });
  }
}