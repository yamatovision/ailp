/**
 * コンポーネント統計情報API
 * LP内の全コンポーネントの統計情報を取得するエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { ComponentStats } from '@/lib/api/tracking';
import { performSignificanceTest } from '@/lib/analysis/real-time-analysis';

/**
 * コンポーネント統計一覧API
 * LP内のすべてのコンポーネントの統計情報を取得
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lpId = searchParams.get('lpId');
    
    // LPIDが必須
    if (!lpId) {
      return NextResponse.json(
        { error: 'LP ID is required' },
        { status: 400 }
      );
    }
    
    // コンポーネント統計を取得
    const stats = await getComponentStats(lpId);
    
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
 * コンポーネント統計情報を取得
 */
async function getComponentStats(lpId: string): Promise<ComponentStats[]> {
  // LP内のすべてのコンポーネントを取得
  const components = await db.lPComponent.findMany({
    where: { lpId },
    include: {
      variants: true,
      stats: true
    }
  });
  
  // 各コンポーネントの統計情報を計算
  const componentStats: ComponentStats[] = await Promise.all(
    components.map(async (component) => {
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
        isSignificant: significance.isSignificant
      };
    })
  );
  
  // コンポーネントIDで並べ替え（上から下の順）
  componentStats.sort((a, b) => {
    const compA = components.find(c => c.id === a.componentId);
    const compB = components.find(c => c.id === b.componentId);
    
    if (compA && compB) {
      return compA.position - compB.position;
    }
    
    return 0;
  });
  
  return componentStats;
}