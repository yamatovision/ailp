/**
 * イベントトラッキングエンドポイント
 * 一般的なユーザーインタラクションイベントを記録します
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
    
    // イベントを記録
    const event = await prisma.lPEvent.create({
      data: {
        sessionId,
        lpId,
        eventType,
        timestamp: new Date(timestamp || Date.now()),
        data
      }
    });
    
    // 特定のイベントタイプに基づいた追加処理
    if (eventType === 'click') {
      // クリックの場合、コンポーネント統計の更新
      try {
        const componentId = data.componentId;
        const variant = data.variant || 'a';
        
        if (componentId) {
          await prisma.$transaction(async (tx) => {
            // 統計データの既存レコードを取得
            const existingStats = await tx.componentStats.findFirst({
              where: {
                componentId,
                variant
              }
            });
            
            if (existingStats) {
              // 既存レコードの更新
              await tx.componentStats.update({
                where: { id: existingStats.id },
                data: {
                  clicks: { increment: 1 },
                  updatedAt: new Date()
                }
              });
            } else {
              // 新規レコード作成
              await tx.componentStats.create({
                data: {
                  componentId,
                  lpId,
                  variant,
                  views: 0,
                  clicks: 1,
                  conversions: 0
                }
              });
            }
          });
        }
      } catch (statsError) {
        console.error('Error updating click stats:', statsError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}