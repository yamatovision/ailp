/**
 * 統計情報API
 * トラッキングデータの集計・分析結果を提供するエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { EventStats } from '@/lib/api/tracking';

/**
 * イベント統計API
 * LPのイベント統計情報を取得
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
    
    // イベント統計を取得
    const stats = await getEventStats(lpId);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in tracking stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking stats' },
      { status: 500 }
    );
  }
}

/**
 * イベント統計情報を取得
 */
async function getEventStats(lpId: string): Promise<EventStats> {
  // LPイベントの件数を取得
  const totalEvents = await db.lPEvent.count({
    where: { lpId }
  });
  
  // イベントタイプ別の集計
  const eventTypeStats = await db.lPEvent.groupBy({
    by: ['eventType'],
    where: { lpId },
    _count: true
  });
  
  // デバイスタイプ別の集計
  const deviceStats = await db.$queryRaw`
    SELECT 
      s.deviceType,
      COUNT(e.id) as count
    FROM 
      "LPEvent" e
    JOIN 
      "LPSession" s ON e."sessionId" = s.id
    WHERE 
      e."lpId" = ${lpId}
    GROUP BY 
      s.deviceType
  `;
  
  // 日付別の集計（過去30日間）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dateStats = await db.$queryRaw`
    SELECT 
      DATE_TRUNC('day', e.timestamp) as date,
      COUNT(e.id) as count
    FROM 
      "LPEvent" e
    WHERE 
      e."lpId" = ${lpId}
      AND e.timestamp >= ${thirtyDaysAgo}
    GROUP BY 
      DATE_TRUNC('day', e.timestamp)
    ORDER BY 
      date
  `;
  
  // イベントタイプ別の集計を整形
  const byType: Record<string, number> = {};
  eventTypeStats.forEach((stat: any) => {
    byType[stat.eventType] = stat._count;
  });
  
  // デバイスタイプ別の集計を整形
  const byDevice = {
    desktop: 0,
    mobile: 0,
    tablet: 0
  };
  
  (deviceStats as any[]).forEach((stat: any) => {
    if (stat.deviceType === 'desktop') {
      byDevice.desktop = Number(stat.count);
    } else if (stat.deviceType === 'mobile') {
      byDevice.mobile = Number(stat.count);
    } else if (stat.deviceType === 'tablet') {
      byDevice.tablet = Number(stat.count);
    }
  });
  
  // 日付別の集計を整形
  const byDate: Record<string, number> = {};
  (dateStats as any[]).forEach((stat: any) => {
    // PostgreSQLの日付をYYYY-MM-DD形式に変換
    const date = new Date(stat.date).toISOString().split('T')[0];
    byDate[date] = Number(stat.count);
  });
  
  return {
    total: totalEvents,
    byType,
    byDevice,
    byDate
  };
}