/**
 * テストレポートAPI
 * A/Bテスト結果の詳細なレポートを生成するエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { TestReport, ComponentStats } from '@/lib/api/tracking';
import { performSignificanceTest } from '@/lib/analysis/real-time-analysis';

/**
 * テストレポートAPI
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId;
    
    // テストレポートを取得
    const report = await generateTestReport(testId);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error in test report API:', error);
    return NextResponse.json(
      { error: 'Failed to generate test report' },
      { status: 500 }
    );
  }
}

/**
 * テストレポートを生成
 */
async function generateTestReport(testId: string): Promise<TestReport | null> {
  // テスト設定を取得
  const testSetting = await db.testSetting.findUnique({
    where: { id: testId },
    include: {
      testSessions: true,
      testResults: true,
      project: true
    }
  });
  
  if (!testSetting) {
    return null;
  }
  
  // テスト期間の計算
  const startDate = testSetting.startDate || new Date(testSetting.createdAt);
  const endDate = testSetting.endDate || new Date();
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  // セッション数の取得
  const totalSessions = testSetting.testSessions.length;
  
  // コンバージョン数の取得
  let totalConversions = 0;
  
  // セッションイベントの取得
  const sessionEvents = await db.sessionEvent.findMany({
    where: {
      sessionId: {
        in: testSetting.testSessions.map(s => s.id)
      },
      eventType: 'conversion'
    }
  });
  
  totalConversions = sessionEvents.length;
  
  // 全体のコンバージョン率
  const overallConversionRate = totalSessions > 0 
    ? totalConversions / totalSessions 
    : 0;
  
  // コンポーネント別の結果を取得
  const componentResults: ComponentStats[] = [];
  
  // テスト対象のコンポーネントIDを取得
  let testedComponentIds: string[] = [];
  try {
    testedComponentIds = JSON.parse(testSetting.testedComponents as string) as string[];
  } catch (error) {
    console.error('Error parsing testedComponents:', error);
    testedComponentIds = [];
  }
  
  // 各コンポーネントの結果を取得
  for (const componentId of testedComponentIds) {
    // コンポーネントの結果を取得
    const result = testSetting.testResults.find(r => r.componentId === componentId);
    
    if (result) {
      const variantAData = JSON.parse(result.variantAData as string);
      const variantBData = JSON.parse(result.variantBData as string);
      
      // コンバージョン率の計算
      const conversionRateA = variantAData.visitors > 0 
        ? variantAData.conversions / variantAData.visitors 
        : 0;
      
      const conversionRateB = variantBData.visitors > 0 
        ? variantBData.conversions / variantBData.visitors 
        : 0;
      
      componentResults.push({
        id: result.id,
        componentId,
        views: variantAData.visitors + variantBData.visitors,
        clicks: variantAData.clicks + variantBData.clicks,
        conversions: variantAData.conversions + variantBData.conversions,
        variantA: {
          views: variantAData.visitors,
          clicks: variantAData.clicks,
          conversions: variantAData.conversions,
          conversionRate: conversionRateA
        },
        variantB: {
          views: variantBData.visitors,
          clicks: variantBData.clicks,
          conversions: variantBData.conversions,
          conversionRate: conversionRateB
        },
        improvement: result.improvement || 0,
        confidence: result.confidence || 0,
        isSignificant: result.isSignificant || false
      });
    } else {
      // 結果がない場合、セッションデータから計算
      const sessionIds = testSetting.testSessions.map(s => s.id);
      
      const componentEvents = await db.sessionEvent.findMany({
        where: {
          sessionId: {
            in: sessionIds
          },
          componentId
        }
      });
      
      // バリアントごとのイベント分類
      const viewsA = new Set<string>();
      const viewsB = new Set<string>();
      const clicksA = new Set<string>();
      const clicksB = new Set<string>();
      const conversionsA = new Set<string>();
      const conversionsB = new Set<string>();
      
      // セッションとバリアントの対応関係
      const sessionVariants: Record<string, 'a' | 'b'> = {};
      
      for (const session of testSetting.testSessions) {
        try {
          const assignedVariants = JSON.parse(session.assignedVariants as string) as Record<string, 'a' | 'b'>;
          if (assignedVariants[componentId]) {
            sessionVariants[session.id] = assignedVariants[componentId];
          }
        } catch (error) {
          console.error('Error parsing assignedVariants:', error);
        }
      }
      
      // イベントの分類
      for (const event of componentEvents) {
        const variant = sessionVariants[event.sessionId];
        if (!variant) continue;
        
        if (event.eventType === 'view') {
          if (variant === 'a') {
            viewsA.add(event.sessionId);
          } else {
            viewsB.add(event.sessionId);
          }
        } else if (event.eventType === 'click') {
          if (variant === 'a') {
            clicksA.add(event.sessionId);
          } else {
            clicksB.add(event.sessionId);
          }
        } else if (event.eventType === 'conversion') {
          if (variant === 'a') {
            conversionsA.add(event.sessionId);
          } else {
            conversionsB.add(event.sessionId);
          }
        }
      }
      
      // コンバージョン率の計算
      const conversionRateA = viewsA.size > 0 
        ? conversionsA.size / viewsA.size 
        : 0;
      
      const conversionRateB = viewsB.size > 0 
        ? conversionsB.size / viewsB.size 
        : 0;
      
      // 統計的有意差検定
      const significance = performSignificanceTest(
        viewsA.size,
        conversionsA.size,
        viewsB.size,
        conversionsB.size
      );
      
      componentResults.push({
        id: `computed-${componentId}`,
        componentId,
        views: viewsA.size + viewsB.size,
        clicks: clicksA.size + clicksB.size,
        conversions: conversionsA.size + conversionsB.size,
        variantA: {
          views: viewsA.size,
          clicks: clicksA.size,
          conversions: conversionsA.size,
          conversionRate: conversionRateA
        },
        variantB: {
          views: viewsB.size,
          clicks: clicksB.size,
          conversions: conversionsB.size,
          conversionRate: conversionRateB
        },
        improvement: significance.improvementRate,
        confidence: significance.confidence,
        isSignificant: significance.isSignificant
      });
    }
  }
  
  // 勝者バリアントの取得
  const winningVariants = componentResults
    .filter(result => result.isSignificant)
    .map(result => {
      const winningVariant = result.variantA.conversionRate > result.variantB.conversionRate 
        ? 'a' 
        : 'b';
      
      return {
        componentId: result.componentId,
        winningVariant,
        improvement: result.improvement,
        confidence: result.confidence
      };
    });
  
  // デバイス別の結果分類
  const deviceSpecificResults: {
    desktop: ComponentStats[];
    mobile: ComponentStats[];
    tablet: ComponentStats[];
  } = {
    desktop: [],
    mobile: [],
    tablet: []
  };
  
  // 各デバイスタイプごとに分析
  // 実際の実装では、セッションデータからデバイスタイプごとに分類して
  // 同様の分析を行いますが、この例では省略します
  
  // AIによる分析結果
  // 実際の実装ではAIサービスを呼び出しますが、ここではサンプルを返します
  const aiInsights = [
    "ヘッダーセクションのバリアントBは平均滞在時間が20%向上しています",
    "モバイルユーザーはデスクトップユーザーよりCTAボタンのクリック率が高い傾向があります",
    "バリアントAはコンバージョン率は低いものの、スクロール深度が深く、コンテンツ消費量が多い可能性があります"
  ];
  
  return {
    testId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    duration: durationDays,
    totalSessions,
    totalConversions,
    overallConversionRate,
    componentResults,
    winningVariants,
    deviceSpecificResults,
    aiInsights
  };
}