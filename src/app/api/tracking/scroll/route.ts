/**
 * スクロールトラッキングエンドポイント
 * ユーザーのスクロール行動を記録します
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { lpId, sessionId, eventType, data = {}, timestamp } = await request.json();
    
    // パラメータを検証
    if (!lpId || !sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: lpId, sessionId and eventType are required' },
        { status: 400 }
      );
    }
    
    // スクロールイベントを記録
    const scrollEvent = await prisma.lPEvent.create({
      data: {
        sessionId,
        lpId,
        eventType,
        timestamp: new Date(timestamp || Date.now()),
        data
      }
    });
    
    // スクロール深度が特定のしきい値を超えた場合のみLP統計を更新
    // ほとんどのLPでは、重要なコンテンツを75%までに配置することが一般的
    if (eventType === 'scroll_depth' && data.depth >= 75) {
      try {
        // 十分なスクロールがあった場合は、「エンゲージメント」としてカウント
        await prisma.lPStats.upsert({
          where: { lpId },
          update: {
            engagements: { increment: 1 },
            updatedAt: new Date()
          },
          create: {
            lpId,
            views: 0,
            conversions: 0,
            engagements: 1
          }
        });
      } catch (statsError) {
        console.error('Error updating scroll stats:', statsError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking scroll event:', error);
    return NextResponse.json(
      { error: 'Failed to track scroll event' },
      { status: 500 }
    );
  }
}