/**
 * 個別コンポーネント統計情報API
 * 特定のコンポーネントの統計情報を取得するエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { ComponentStats } from '@/lib/api/tracking';
import { performSignificanceTest } from '@/lib/analysis/real-time-analysis';

/**
 * 特定コンポーネントの統計API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { componentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lpId = searchParams.get('lpId');
    const { componentId } = params;
    
    // LPIDが必須
    if (!lpId) {
      return NextResponse.json(
        { error: 'LP ID is required' },
        { status: 400 }
      );
    }
    
    // コンポーネント統計を取得
    const stats = await getSingleComponentStats(lpId, componentId);
    
    if (!stats) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in component stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component stats' },
      { status: 500 }
    );
  }
}

/**
 * 単一コンポーネントの統計情報を取得
 */
async function getSingleComponentStats(
  lpId: string,
  componentId: string
): Promise<ComponentStats | null> {
  // コンポーネントを取得
  const component = await db.lPComponent.findFirst({
    where: {
      id: componentId,
      lpId
    },
    include: {
      variants: true,
      stats: true
    }
  });
  
  if (!component) {
    return null;
  }
  
  // 統計情報の取得
  const stats = component.stats || [];
  
  // バリアントAとBの統計データを取得
  const variantA = stats.find(s => s.variant === 'a') || {
    views: 0,
    clicks: 0,
    conversions: 0
  };
  
  const variantB = stats.find(s => s.variant === 'b') || {
    views: 0,
    clicks: 0,
    conversions: 0
  };
  
  // コンバージョン率の計算
  const conversionRateA = variantA.views > 0 
    ? variantA.conversions / variantA.views 
    : 0;
  
  const conversionRateB = variantB.views > 0 
    ? variantB.conversions / variantB.views 
    : 0;
  
  // 統計的有意差検定
  const significance = performSignificanceTest(
    variantA.views,
    variantA.conversions,
    variantB.views,
    variantB.conversions
  );
  
  // バリアント別のタイムライン情報を取得（日別の集計）
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  // イベントデータを集計
  const componentEvents = await db.componentEvent.count({
    where: {
      componentId: component.id
    }
  });
  
  // クリック数集計
  const clicks = await db.componentEvent.count({
    where: {
      componentId: component.id,
      eventType: 'click'
    }
  });
  
  // 日別のビュー・コンバージョンデータを取得（高度な分析用）
  const dailyStats = await db.$queryRaw`
    SELECT 
      DATE_TRUNC('day', timestamp) as date,
      variant,
      COUNT(*) FILTER (WHERE "eventType" = 'component_view') as views,
      COUNT(*) FILTER (WHERE "eventType" = 'click') as clicks,
      COUNT(*) FILTER (WHERE "eventType" = 'conversion') as conversions
    FROM 
      "ComponentEvent"
    WHERE 
      "componentId" = ${component.id}
      AND timestamp >= ${thirtyDaysAgo}
    GROUP BY 
      DATE_TRUNC('day', timestamp), variant
    ORDER BY 
      date
  `;
  
  // 集計結果を返す
  return {
    id: component.id,
    componentId: component.id,
    views: variantA.views + variantB.views,
    clicks: clicks,
    conversions: variantA.conversions + variantB.conversions,
    variantA: {
      views: variantA.views,
      clicks: variantA.clicks,
      conversions: variantA.conversions,
      conversionRate: conversionRateA
    },
    variantB: {
      views: variantB.views,
      clicks: variantB.clicks,
      conversions: variantB.conversions,
      conversionRate: conversionRateB
    },
    improvement: significance.improvementRate,
    confidence: significance.confidence,
    isSignificant: significance.isSignificant,
    dailyStats
  };
}