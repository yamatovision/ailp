/**
 * コンポーネントトラッキングエンドポイント
 * LPコンポーネントの閲覧・インタラクションを記録します
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      lpId, 
      sessionId, 
      componentId, 
      componentType, 
      variant,
      eventType, 
      timestamp 
    } = await request.json();
    
    // 必須パラメータを検証
    if (!lpId || !sessionId || !componentId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // コンポーネントイベントを記録
    const componentEvent = await prisma.componentEvent.create({
      data: {
        sessionId,
        lpId,
        componentId,
        variant: variant || 'a',
        eventType,
        timestamp: new Date(timestamp || Date.now()),
        data: {
          componentType: componentType || 'unknown'
        }
      }
    });
    
    // 累計集計の更新（バックグラウンドジョブで行うべき重い処理は一旦簡易実装）
    // 実際にはキューに入れて非同期で処理するか、定期的なバッチ集計に任せるべき
    if (eventType === 'view') {
      try {
        await prisma.$transaction(async (tx) => {
          // コンポーネント集計データの既存レコードを取得
          const existingStats = await tx.componentStats.findFirst({
            where: {
              componentId,
              variant: variant || 'a'
            }
          });
          
          if (existingStats) {
            // 既存レコードの更新
            await tx.componentStats.update({
              where: { id: existingStats.id },
              data: {
                views: { increment: 1 },
                updatedAt: new Date()
              }
            });
          } else {
            // 新規レコード作成
            await tx.componentStats.create({
              data: {
                componentId,
                lpId,
                variant: variant || 'a',
                views: 1,
                clicks: 0,
                conversions: 0
              }
            });
          }
        });
      } catch (statsError) {
        // 統計更新エラーはログに記録するが、API応答は失敗としない
        console.error('Error updating component stats:', statsError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking component event:', error);
    return NextResponse.json(
      { error: 'Failed to track component event' },
      { status: 500 }
    );
  }
}