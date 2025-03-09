/**
 * コンバージョントラッキングエンドポイント
 * コンバージョンイベントを記録し、統計情報を更新します
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { lpId, sessionId, conversionType, data = {}, timestamp } = await request.json();
    
    // パラメータを検証
    if (!lpId || !sessionId || !conversionType) {
      return NextResponse.json(
        { error: 'Missing required fields: lpId, sessionId and conversionType are required' },
        { status: 400 }
      );
    }
    
    // コンバージョンイベントを記録
    const conversion = await prisma.lPEvent.create({
      data: {
        sessionId,
        lpId,
        eventType: `conversion_${conversionType}`,
        timestamp: new Date(timestamp || Date.now()),
        data: {
          conversionType,
          ...data
        }
      }
    });
    
    // セッションを更新してコンバージョン状態をマーク
    await prisma.lPSession.update({
      where: { id: sessionId },
      data: {
        hasConverted: true,
        conversionType: conversionType,
        conversionTimestamp: new Date(timestamp || Date.now())
      }
    });
    
    // コンポーネント統計の更新
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
                conversions: { increment: 1 },
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
                clicks: 0,
                conversions: 1
              }
            });
          }
        });
      }
      
      // LP全体の統計も更新
      await prisma.lPStats.upsert({
        where: { lpId },
        update: {
          conversions: { increment: 1 },
          updatedAt: new Date()
        },
        create: {
          lpId,
          views: 0,
          conversions: 1
        }
      });
      
    } catch (statsError) {
      console.error('Error updating conversion stats:', statsError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}