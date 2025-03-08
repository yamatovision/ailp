import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: {
    id: string;
  };
}

// イベント一覧取得
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '100');
    const offset = Number(searchParams.get('offset') || '0');
    const eventType = searchParams.get('eventType');
    const componentId = searchParams.get('componentId');
    const sessionId = searchParams.get('sessionId');
    
    // テスト存在確認
    const testExists = await prisma.testSetting.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!testExists) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // セッションID一覧の取得
    let sessionIds: string[] = [];
    
    if (sessionId) {
      // 特定のセッションのみ取得する場合
      sessionIds = [sessionId];
    } else {
      // このテストに属するすべてのセッションを取得
      const sessions = await prisma.testSession.findMany({
        where: { testId: id },
        select: { id: true },
      });
      sessionIds = sessions.map(s => s.id);
    }
    
    // フィルタ条件の構築
    let whereCondition: any = {
      sessionId: { in: sessionIds },
    };
    
    if (eventType) {
      whereCondition.eventType = eventType;
    }
    
    if (componentId) {
      whereCondition.componentId = componentId;
    }
    
    // イベント総数取得
    const totalCount = await prisma.sessionEvent.count({
      where: whereCondition,
    });
    
    // イベント一覧取得
    const events = await prisma.sessionEvent.findMany({
      where: whereCondition,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
    
    return NextResponse.json({
      events,
      meta: {
        total: totalCount,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("GET /api/tests/[id]/events error:", error);
    return NextResponse.json(
      { error: "イベント一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規イベント記録
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // リクエストデータの取得
    const data = await request.json();
    const { 
      sessionId, 
      eventType, 
      componentId, 
      variantId, 
      timeSpent,
      timestamp
    } = data;
    
    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }
    
    // セッション存在確認
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      select: { 
        id: true,
        testId: true
      },
    });
    
    if (!session) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 }
      );
    }
    
    // テストIDの一致確認
    if (session.testId !== id) {
      return NextResponse.json(
        { error: "このセッションは指定されたテストに属していません" },
        { status: 400 }
      );
    }
    
    // イベント記録
    const event = await prisma.sessionEvent.create({
      data: {
        sessionId,
        eventType,
        componentId: componentId || null,
        variantId: variantId || null,
        timeSpent: timeSpent || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });
    
    // コンバージョンイベントの場合はテスト結果を更新
    if (eventType === 'conversion') {
      await updateTestResults(id, componentId, variantId);
    }
    
    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("POST /api/tests/[id]/events error:", error);
    return NextResponse.json(
      { error: "イベントの記録に失敗しました" },
      { status: 500 }
    );
  }
}

// テスト結果の更新
async function updateTestResults(testId: string, componentId: string | null, variantId: string | null) {
  try {
    // コンポーネントIDがない場合は何もしない
    if (!componentId || !variantId) return;
    
    // バリアント情報の取得
    const variant = await prisma.componentVariant.findUnique({
      where: { id: variantId },
      include: {
        component: {
          select: {
            id: true,
            variants: {
              select: {
                id: true,
                variantType: true,
              },
            },
          },
        },
      },
    });
    
    if (!variant) return;
    
    // コンポーネントとそのバリアント
    const component = variant.component;
    const variantType = variant.variantType;
    
    // A/Bのそれぞれのバリアントのイベント数を集計
    // variantAのセッション数とコンバージョン数
    const variantAEvents = await getEventCounts(testId, component.id, 'a');
    
    // variantBのセッション数とコンバージョン数
    const variantBEvents = await getEventCounts(testId, component.id, 'b');
    
    // 既存のテスト結果を取得
    let testResult = await prisma.testResult.findFirst({
      where: {
        testId: testId,
        componentId: component.id,
      },
    });
    
    // 結果データの構築
    const variantAData = {
      visitors: variantAEvents.views,
      conversions: variantAEvents.conversions,
      conversionRate: variantAEvents.views > 0 
        ? (variantAEvents.conversions / variantAEvents.views) * 100 
        : 0,
    };
    
    const variantBData = {
      visitors: variantBEvents.views,
      conversions: variantBEvents.conversions,
      conversionRate: variantBEvents.views > 0 
        ? (variantBEvents.conversions / variantBEvents.views) * 100 
        : 0,
    };
    
    // 改善率の計算
    let improvement = 0;
    if (variantAData.conversionRate > 0) {
      improvement = ((variantBData.conversionRate - variantAData.conversionRate) / variantAData.conversionRate) * 100;
    }
    
    // 勝者の判定
    let winningVariant = null;
    if (variantAData.conversions >= 10 && variantBData.conversions >= 10) {
      // 最低10コンバージョンがある場合のみ有意差を考慮
      if (improvement > 10) { // 10%以上の改善を有意とする簡易判定
        winningVariant = 'b';
      } else if (improvement < -10) {
        winningVariant = 'a';
      }
    }
    
    // テスト結果がなければ新規作成、あれば更新
    if (!testResult) {
      testResult = await prisma.testResult.create({
        data: {
          testId: testId,
          componentId: component.id,
          variantAData: variantAData as any,
          variantBData: variantBData as any,
          improvement: improvement,
          confidence: Math.min(Math.abs(improvement) / 2, 99), // 簡易的な信頼度計算
          isSignificant: Math.abs(improvement) > 10,
          winningVariant: winningVariant,
          timestamp: new Date(),
        },
      });
    } else {
      testResult = await prisma.testResult.update({
        where: { id: testResult.id },
        data: {
          variantAData: variantAData as any,
          variantBData: variantBData as any,
          improvement: improvement,
          confidence: Math.min(Math.abs(improvement) / 2, 99),
          isSignificant: Math.abs(improvement) > 10,
          winningVariant: winningVariant,
          timestamp: new Date(),
        },
      });
    }
    
    return testResult;
  } catch (error) {
    console.error("Error updating test results:", error);
  }
}

// コンポーネント・バリアント別のイベント数を取得
async function getEventCounts(testId: string, componentId: string, variantType: string) {
  // このテストのセッション一覧
  const sessions = await prisma.testSession.findMany({
    where: { testId },
    select: { id: true, assignedVariants: true },
  });
  
  // 特定のバリアントが割り当てられたセッション一覧
  const targetSessionIds = sessions
    .filter(session => {
      const variants = session.assignedVariants as Record<string, string>;
      return variants[componentId] === variantType;
    })
    .map(session => session.id);
  
  // 各セッションごとのビュー数とコンバージョン数を集計
  const viewEvents = await prisma.sessionEvent.count({
    where: {
      sessionId: { in: targetSessionIds },
      eventType: 'view',
      componentId: componentId,
    },
  });
  
  const conversionEvents = await prisma.sessionEvent.count({
    where: {
      sessionId: { in: targetSessionIds },
      eventType: 'conversion',
    },
  });
  
  return {
    views: targetSessionIds.length, // ビュー数はセッション数で代用
    conversions: conversionEvents,
  };
}