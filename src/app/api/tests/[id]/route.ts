import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/db/prisma';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

interface Params {
  params: {
    id: string;
  };
}

// テスト詳細取得
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Supabaseクライアント作成
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 開発環境の場合、認証をバイパス
    if (process.env.NODE_ENV === 'development') {
      try {
        // テスト情報取得
        const test = await prisma.testSetting.findUnique({
          where: { id },
          include: {
            project: {
              select: {
                title: true,
                thumbnail: true,
              },
            },
            testResults: true,
            testSessions: {
              take: 100,
            },
          },
        });
        
        // DB上にデータが存在しない場合はダミーデータを返す
        if (!test) {
          const dummyTest = {
            id,
            name: 'サンプルテスト' + id.charAt(0).toUpperCase(),
            description: 'ヘッダーとCTAボタンのA/Bテスト',
            status: 'completed',
            startDate: new Date('2025-03-01').toISOString(),
            endDate: new Date('2025-03-15').toISOString(),
            visitorCount: 3375,
            conversionCount: 168,
            conversionRate: 0.0498,
            improvementRate: 0.124,
            conversionGoal: 'button_click',
            testedComponents: ['header', 'hero', 'features', 'cta'],
            testResults: [
              {
                id: 'res1',
                componentId: 'header',
                variantAData: { visitors: 1688, conversions: 82 },
                variantBData: { visitors: 1687, conversions: 86 },
                improvement: 4.9,
                confidence: 98.2,
                isSignificant: true,
                winningVariant: 'b',
                appliedToProduction: true
              },
              {
                id: 'res2',
                componentId: 'hero',
                variantAData: { visitors: 1688, conversions: 75 },
                variantBData: { visitors: 1687, conversions: 83 },
                improvement: 10.8,
                confidence: 92.5,
                isSignificant: false,
                winningVariant: 'b',
                appliedToProduction: false
              },
              {
                id: 'res3',
                componentId: 'features',
                variantAData: { visitors: 1688, conversions: 79 },
                variantBData: { visitors: 1687, conversions: 77 },
                improvement: -2.6,
                confidence: 18.4,
                isSignificant: false,
                winningVariant: null,
                appliedToProduction: false
              },
              {
                id: 'res4',
                componentId: 'cta',
                variantAData: { visitors: 1688, conversions: 72 },
                variantBData: { visitors: 1687, conversions: 89 },
                improvement: 23.7,
                confidence: 99.1,
                isSignificant: true,
                winningVariant: 'b',
                appliedToProduction: false
              }
            ]
          };
          
          const dummyComponents = [
            { id: 'header', componentType: 'ヘッダー', variantA: 'オリジナル', variantB: '新デザイン' },
            { id: 'hero', componentType: 'ヒーローセクション', variantA: 'オリジナル', variantB: '新コピー' },
            { id: 'features', componentType: '機能紹介', variantA: '3カラム', variantB: '2カラム大きめ' },
            { id: 'cta', componentType: 'CTAボタン', variantA: '青色・角丸', variantB: '緑色・シャープ' }
          ];
            
          return new Response(
            JSON.stringify({ test: dummyTest, components: dummyComponents }),
            { status: 200, headers }
          );
        }
        
        // テスト対象コンポーネント情報
        const componentIds = test.testedComponents as string[];
        
        const components = await prisma.lpComponent.findMany({
          where: {
            id: { in: componentIds },
          },
          include: {
            variants: true,
          },
        });
        
        return new Response(
          JSON.stringify({ test, components }),
          { status: 200, headers }
        );
      } catch (dbError) {
        console.error("DB error in development mode:", dbError);
        // DB操作が失敗した場合のダミーデータ
        const dummyTest = {
          id,
          name: 'サンプルテスト' + id.charAt(0).toUpperCase(),
          description: 'ヘッダーとCTAボタンのA/Bテスト',
          status: 'completed',
          startDate: new Date('2025-03-01').toISOString(),
          endDate: new Date('2025-03-15').toISOString(),
          visitorCount: 3375,
          conversionCount: 168,
          conversionRate: 0.0498,
          improvementRate: 0.124,
          conversionGoal: 'button_click',
          testedComponents: ['header', 'hero', 'features', 'cta'],
          testResults: [
            {
              id: 'res1',
              componentId: 'header',
              variantAData: { visitors: 1688, conversions: 82 },
              variantBData: { visitors: 1687, conversions: 86 },
              improvement: 4.9,
              confidence: 98.2,
              isSignificant: true,
              winningVariant: 'b',
              appliedToProduction: true
            },
            {
              id: 'res2',
              componentId: 'hero',
              variantAData: { visitors: 1688, conversions: 75 },
              variantBData: { visitors: 1687, conversions: 83 },
              improvement: 10.8,
              confidence: 92.5,
              isSignificant: false,
              winningVariant: 'b',
              appliedToProduction: false
            },
            {
              id: 'res3',
              componentId: 'features',
              variantAData: { visitors: 1688, conversions: 79 },
              variantBData: { visitors: 1687, conversions: 77 },
              improvement: -2.6,
              confidence: 18.4,
              isSignificant: false,
              winningVariant: null,
              appliedToProduction: false
            },
            {
              id: 'res4',
              componentId: 'cta',
              variantAData: { visitors: 1688, conversions: 72 },
              variantBData: { visitors: 1687, conversions: 89 },
              improvement: 23.7,
              confidence: 99.1,
              isSignificant: true,
              winningVariant: 'b',
              appliedToProduction: false
            }
          ]
        };
        
        const dummyComponents = [
          { id: 'header', componentType: 'ヘッダー', variantA: 'オリジナル', variantB: '新デザイン' },
          { id: 'hero', componentType: 'ヒーローセクション', variantA: 'オリジナル', variantB: '新コピー' },
          { id: 'features', componentType: '機能紹介', variantA: '3カラム', variantB: '2カラム大きめ' },
          { id: 'cta', componentType: 'CTAボタン', variantA: '青色・角丸', variantB: '緑色・シャープ' }
        ];
            
        return new Response(
          JSON.stringify({ test: dummyTest, components: dummyComponents }),
          { status: 200, headers }
        );
      }
    }
    
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session || !session.user?.email) {
      return new Response(
        JSON.stringify({ error: "認証に失敗しました。再ログインしてください。" }),
        { status: 401, headers }
      );
    }
    
    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "ユーザーが見つかりません" }),
        { status: 404, headers }
      );
    }
    
    // テスト情報取得
    const test = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
      include: {
        project: {
          select: {
            title: true,
            thumbnail: true,
          },
        },
        testResults: true,
        testSessions: {
          take: 100,
        }
      },
    });
    
    if (!test) {
      return new Response(
        JSON.stringify({ error: "テストが見つかりません" }),
        { status: 404, headers }
      );
    }
    
    // テスト対象コンポーネント情報
    const componentIds = test.testedComponents as string[];
    
    const components = await prisma.lpComponent.findMany({
      where: {
        id: { in: componentIds },
      },
      include: {
        variants: true,
      },
    });
    
    return new Response(
      JSON.stringify({ test, components }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("GET /api/tests/[id] error:", error);
    return new Response(
      JSON.stringify({ error: "テスト情報の取得に失敗しました" }),
      { status: 500 }
    );
  }
}

// テスト更新
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "認証に失敗しました。再ログインしてください。" },
        { status: 401 }
      );
    }
    
    // リクエストデータの取得
    const data = await request.json();
    const { 
      name,
      startDate,
      endDate,
      conversionGoal,
      testedComponents,
      status
    } = data;
    
    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト存在確認
    const existingTest = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
    });
    
    if (!existingTest) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト更新
    const updatedTest = await prisma.testSetting.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(conversionGoal && { conversionGoal }),
        ...(testedComponents && { testedComponents }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ 
      success: true,
      test: updatedTest,
    });
  } catch (error) {
    console.error("PATCH /api/tests/[id] error:", error);
    return NextResponse.json(
      { error: "テストの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// テスト削除
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "認証に失敗しました。再ログインしてください。" },
        { status: 401 }
      );
    }
    
    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト存在確認
    const existingTest = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
    });
    
    if (!existingTest) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト削除
    await prisma.testSetting.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true,
      message: "テストが削除されました",
    });
  } catch (error) {
    console.error("DELETE /api/tests/[id] error:", error);
    return NextResponse.json(
      { error: "テストの削除に失敗しました" },
      { status: 500 }
    );
  }
}