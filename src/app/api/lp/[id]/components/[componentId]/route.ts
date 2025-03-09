import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getLPFromDB } from '@/server/db/lp';
import { getComponentFromDB } from '@/server/db/lp-components';
import { getVariantsFromDB, createVariantInDB } from '@/server/db/variants';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';
import { SectionGenerator } from '@/lib/ai/section-generator';

// ユーザーセッションを取得する共通関数
async function getUserSessionFromRequest(req: Request) {
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

export async function GET(
  req: Request,
  { params }: { params: { id: string; componentId: string } }
) {
  try {
    const { id: projectId, componentId } = params;

    // 認証セッションを取得
    const session = await getUserSessionFromRequest(req);
    
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

    // HTMLがないか空の場合は生成
    let html = '';
    if (variants.length > 0 && variants[0].htmlContent) {
      html = variants[0].htmlContent;
    } else {
      // デフォルトHTMLを生成
      const result = await SectionGenerator.generateSection({
        type: component.componentType,
        content: component.aiParameters?.content || '',
      });
      
      // バリアントとして保存
      await createVariantInDB({
        componentId,
        variantType: 'default',
        htmlContent: result.html,
        metadata: result.metadata
      });
      
      html = result.html;
    }

    return NextResponse.json({ component, variants, html });
  } catch (error) {
    console.error(`コンポーネント取得エラー (ID: ${params.componentId}):`, error);
    return NextResponse.json({ error: 'コンポーネントの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; componentId: string } }
) {
  try {
    const { id: projectId, componentId } = params;
    const { sectionType, content, customPrompt, styleOptions } = await req.json();

    // 認証セッションを取得
    const session = await getUserSessionFromRequest(req);
    
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

    // AIを使用してHTMLを生成
    const result = await SectionGenerator.generateSection({
      type: sectionType || component.componentType,
      content: content || (component.aiParameters?.content || ''),
      customPrompt,
      styleOptions
    });

    // 生成したHTMLをバリアントとして保存
    const variant = await createVariantInDB({
      componentId,
      variantType: 'default',
      htmlContent: result.html,
      metadata: result.metadata
    });

    return NextResponse.json({ variant, html: result.html });
  } catch (error) {
    console.error(`コンポーネントHTML生成エラー (ID: ${params.componentId}):`, error);
    return NextResponse.json({ error: 'コンポーネントHTMLの生成に失敗しました' }, { status: 500 });
  }
}