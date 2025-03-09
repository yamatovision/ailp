import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/db/prisma';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// テスト一覧取得
export async function GET(req: Request) {
  // レスポンスヘッダー設定
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  try {
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
    
    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
    // 開発環境の場合、認証をバイパスしてテストデータを返す
    if (process.env.NODE_ENV === 'development' && (!session || !session.user)) {
      const tests = await prisma.testSetting.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          project: {
            select: {
              title: true,
              thumbnail: true,
            },
          },
          testSessions: {
            select: {
              id: true,
              deviceType: true,
            },
          },
          testResults: true,
        },
      });
      
      // データが存在しない場合はダミーデータを返す
      if (tests.length === 0) {
        const dummyTests = [
          {
            id: '1',
            name: 'サンプルテストA',
            description: 'ヘッダーとCTAボタンのA/Bテスト',
            status: 'running',
            startDate: new Date('2025-03-01').toISOString(),
            endDate: new Date('2025-03-15').toISOString(),
            visitorCount: 1245,
            conversionRate: 0.052,
            improvementRate: 0.124,
          },
          {
            id: '2',
            name: 'サンプルテストB',
            description: 'お客様の声セクションのA/Bテスト',
            status: 'completed',
            startDate: new Date('2025-02-01').toISOString(),
            endDate: new Date('2025-02-15').toISOString(),
            visitorCount: 2130,
            conversionRate: 0.068,
            improvementRate: 0.215,
          },
          {
            id: '3',
            name: 'サンプルテストC',
            description: '価格表示方法のA/Bテスト',
            status: 'scheduled',
            startDate: new Date('2025-03-20').toISOString(),
            endDate: new Date('2025-04-05').toISOString(),
            visitorCount: 0,
            conversionRate: 0,
            improvementRate: 0,
          }
        ];
        
        return new Response(JSON.stringify({ tests: dummyTests }), { 
          status: 200, 
          headers 
        });
      }
      
      // テストデータを加工して返す
      const processedTests = tests.map(test => {
        // 訪問者数の計算
        const visitorCount = test.testSessions?.length || 0;
        
        // コンバージョン率の計算
        let conversions = 0;
        test.testResults.forEach(result => {
          const variantAData = result.variantAData as any;
          const variantBData = result.variantBData as any;
          conversions += (variantAData?.conversions || 0) + (variantBData?.conversions || 0);
        });
        
        const conversionRate = visitorCount > 0 ? conversions / visitorCount : 0;
        
        // 改善率の計算 (平均)
        let totalImprovement = 0;
        let improvementCount = 0;
        test.testResults.forEach(result => {
          if (result.improvement !== null) {
            totalImprovement += result.improvement;
            improvementCount++;
          }
        });
        
        const improvementRate = improvementCount > 0 ? totalImprovement / improvementCount : 0;
        
        return {
          ...test,
          visitorCount,
          conversionRate,
          improvementRate
        };
      });
      
      return new Response(JSON.stringify({ tests: processedTests }), { 
        status: 200, 
        headers 
      });
    }
    
    // 認証チェック (本番環境)
    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ error: "認証に失敗しました。再ログインしてください。" }), { 
        status: 401, 
        headers 
      });
    }
    
    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return new Response(JSON.stringify({ error: "ユーザーが見つかりません" }), { 
        status: 404, 
        headers 
      });
    }
    
    // ユーザーのテスト一覧を取得
    const tests = await prisma.testSetting.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            title: true,
            thumbnail: true,
          },
        },
        testSessions: {
          select: {
            id: true,
            deviceType: true,
          },
        },
        testResults: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    // データ加工
    const processedTests = tests.map(test => {
      // 訪問者数の計算
      const visitorCount = test.testSessions?.length || 0;
      
      // コンバージョン率の計算
      let conversions = 0;
      test.testResults.forEach(result => {
        const variantAData = result.variantAData as any;
        const variantBData = result.variantBData as any;
        conversions += (variantAData?.conversions || 0) + (variantBData?.conversions || 0);
      });
      
      const conversionRate = visitorCount > 0 ? conversions / visitorCount : 0;
      
      // 改善率の計算 (平均)
      let totalImprovement = 0;
      let improvementCount = 0;
      test.testResults.forEach(result => {
        if (result.improvement !== null) {
          totalImprovement += result.improvement;
          improvementCount++;
        }
      });
      
      const improvementRate = improvementCount > 0 ? totalImprovement / improvementCount : 0;
      
      return {
        ...test,
        visitorCount,
        conversionRate,
        improvementRate
      };
    });
    
    return new Response(JSON.stringify({ tests: processedTests }), { 
      status: 200, 
      headers 
    });
  } catch (error) {
    console.error("GET /api/tests error:", error);
    return new Response(JSON.stringify({ error: "テスト一覧の取得に失敗しました" }), { 
      status: 500, 
      headers 
    });
  }
}

// 新規テスト作成
export async function POST(request: Request) {
  // レスポンスヘッダー設定
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  try {
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
    
    // リクエストデータの取得
    const data = await request.json();
    const { 
      projectId, 
      name, 
      startDate, 
      endDate, 
      conversionGoal, 
      testedComponents 
    } = data;
    
    if (!projectId || !name || !conversionGoal || !testedComponents) {
      return new Response(
        JSON.stringify({ error: "必須項目が不足しています" }),
        { status: 400, headers }
      );
    }
    
    // 開発環境の場合、認証をバイパス
    if (process.env.NODE_ENV === 'development') {
      try {
        // プロジェクト存在確認
        const project = await prisma.lpProject.findUnique({
          where: { id: projectId },
        });
        
        if (!project) {
          return new Response(
            JSON.stringify({ error: "プロジェクトが見つかりません" }),
            { status: 404, headers }
          );
        }
        
        // テスト作成
        const test = await prisma.testSetting.create({
          data: {
            projectId,
            userId: project.userId, // プロジェクトの所有者を使用
            name,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            conversionGoal,
            testedComponents,
            status: 'scheduled',
          },
        });
        
        return new Response(
          JSON.stringify({ success: true, test }),
          { status: 200, headers }
        );
      } catch (dbError) {
        console.error("DB error in development mode:", dbError);
        
        // DB操作が失敗した場合、ダミーレスポンスを返す
        const testId = Math.random().toString(36).substring(2, 15);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            test: {
              id: testId,
              projectId,
              name,
              startDate: startDate ? new Date(startDate).toISOString() : null,
              endDate: endDate ? new Date(endDate).toISOString() : null,
              conversionGoal,
              testedComponents,
              status: 'scheduled',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }),
          { status: 200, headers }
        );
      }
    }
    
    // 認証セッションを取得
    const session = await getUserSession(req, cookies, supabase, createRouteHandlerClient);
    
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
    
    // プロジェクト確認
    const project = await prisma.lpProject.findUnique({
      where: { 
        id: projectId,
        userId: user.id,
      },
    });
    
    if (!project) {
      return new Response(
        JSON.stringify({ error: "プロジェクトが見つかりません" }),
        { status: 404, headers }
      );
    }
    
    // テスト作成
    const test = await prisma.testSetting.create({
      data: {
        projectId,
        userId: user.id,
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        conversionGoal,
        testedComponents,
        status: 'scheduled',
      },
    });
    
    return new Response(
      JSON.stringify({ success: true, test }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("POST /api/tests error:", error);
    return new Response(
      JSON.stringify({ error: "テストの作成に失敗しました" }),
      { status: 500, headers }
    );
  }
}