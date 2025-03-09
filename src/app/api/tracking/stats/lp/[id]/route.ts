/**
 * LP統計情報API
 * 特定のLPの統計情報を取得するエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { LPStats } from '@/lib/api/tracking';

/**
 * LP統計API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lpId = params.id;
    
    // LP統計を取得
    const stats = await getLPStats(lpId);
    
    if (!stats) {
      return NextResponse.json(
        { error: 'LP not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in LP stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LP stats' },
      { status: 500 }
    );
  }
}

/**
 * LP統計情報を取得
 */
async function getLPStats(lpId: string): Promise<LPStats | null> {
  // LPの存在確認
  const lp = await db.lP.findUnique({
    where: { id: lpId },
    include: {
      stats: true
    }
  });
  
  if (!lp) {
    return null;
  }
  
  // 基本的な統計情報の取得
  const stats = lp.stats || {
    views: 0,
    conversions: 0,
    engagements: 0
  };
  
  // セッション情報の取得
  const sessions = await db.lPSession.findMany({
    where: { lpId }
  });
  
  // 平均滞在時間の計算
  const totalDuration = sessions.reduce((sum, session) => {
    return sum + (session.duration || 0);
  }, 0);
  
  const averageTimeOnPage = sessions.length > 0
    ? totalDuration / sessions.length
    : 0;
  
  // 直帰率の計算（ページ内でのアクション無しのセッション比率）
  // ここでは簡易的に滞在時間10秒未満を直帰とする
  const bounces = sessions.filter(session => 
    (session.duration || 0) < 10
  ).length;
  
  const bounceRate = sessions.length > 0
    ? bounces / sessions.length
    : 0;
  
  // デバイス別の訪問者数
  const deviceBreakdown = {
    desktop: 0,
    mobile: 0,
    tablet: 0
  };
  
  sessions.forEach(session => {
    if (session.deviceType === 'desktop') {
      deviceBreakdown.desktop++;
    } else if (session.deviceType === 'mobile') {
      deviceBreakdown.mobile++;
    } else if (session.deviceType === 'tablet') {
      deviceBreakdown.tablet++;
    }
  });
  
  // 日別データの取得（過去30日間）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailyData = await db.$queryRaw`
    WITH daily_views AS (
      SELECT 
        DATE_TRUNC('day', s."startedAt") as date,
        COUNT(DISTINCT s.id) as views
      FROM 
        "LPSession" s
      WHERE 
        s."lpId" = ${lpId}
        AND s."startedAt" >= ${thirtyDaysAgo}
      GROUP BY 
        DATE_TRUNC('day', s."startedAt")
    ),
    daily_conversions AS (
      SELECT 
        DATE_TRUNC('day', s."conversionTimestamp") as date,
        COUNT(DISTINCT s.id) as conversions
      FROM 
        "LPSession" s
      WHERE 
        s."lpId" = ${lpId}
        AND s."hasConverted" = true
        AND s."conversionTimestamp" >= ${thirtyDaysAgo}
      GROUP BY 
        DATE_TRUNC('day', s."conversionTimestamp")
    )
    SELECT 
      COALESCE(dv.date, dc.date) as date,
      COALESCE(dv.views, 0) as views,
      COALESCE(dc.conversions, 0) as conversions
    FROM 
      daily_views dv
    FULL OUTER JOIN 
      daily_conversions dc ON dv.date = dc.date
    ORDER BY 
      date
  `;
  
  // 日別データの整形
  const formattedDailyData = (dailyData as any[]).map(day => {
    const views = Number(day.views);
    const conversions = Number(day.conversions);
    const conversionRate = views > 0 ? conversions / views : 0;
    
    return {
      date: new Date(day.date).toISOString().split('T')[0], // YYYY-MM-DD形式
      views,
      conversions,
      conversionRate
    };
  });
  
  // 統計情報を返す
  return {
    totalViews: stats.views,
    totalConversions: stats.conversions,
    conversionRate: stats.views > 0 ? stats.conversions / stats.views : 0,
    averageTimeOnPage,
    bounceRate,
    deviceBreakdown,
    dailyData: formattedDailyData
  };
}