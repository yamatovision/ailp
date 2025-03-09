/**
 * 離脱イベントトラッキングエンドポイント
 * ユーザーがページを離れる際のイベントを記録します
 * Beacon APIによって送信されるため、レスポンスを返さなくても動作します
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { lpId, sessionId, eventType, data = {}, timestamp } = await request.json();
    
    // パラメータを検証
    if (!lpId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: lpId and sessionId are required' },
        { status: 400 }
      );
    }
    
    // 離脱イベントを記録
    const exitEvent = await prisma.lPEvent.create({
      data: {
        sessionId,
        lpId,
        eventType: eventType || 'exit',
        timestamp: new Date(timestamp || Date.now()),
        data
      }
    });
    
    // セッションの滞在時間を更新
    if (data.timeSpent) {
      await prisma.lPSession.update({
        where: { id: sessionId },
        data: {
          duration: Math.floor(data.timeSpent / 1000), // ミリ秒を秒に変換
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // BeaconAPIの場合、エラーレスポンスは実際にはクライアントに届かないが、
    // ログには残しておく
    console.error('Error tracking exit event:', error);
    return NextResponse.json(
      { error: 'Failed to track exit event' },
      { status: 500 }
    );
  }
}

// Beacon APIはCORSヘッダーを必要とする
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
  });
}