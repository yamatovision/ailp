/**
 * ページビュートラッキングエンドポイント
 * LPの閲覧イベントを記録します
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { lpId, sessionId, pathname, search, timestamp } = await request.json();
    
    // トラッキングデータを検証
    if (!lpId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: lpId and sessionId are required' },
        { status: 400 }
      );
    }
    
    // LPセッションを作成または取得
    let session = await prisma.lPSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      // セッションが存在しない場合は新規作成
      session = await prisma.lPSession.create({
        data: {
          id: sessionId,
          lpId,
          startedAt: new Date(timestamp || Date.now()),
          userAgent: request.headers.get('user-agent') || 'unknown',
          referrer: request.headers.get('referer') || 'direct',
          ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        }
      });
    }
    
    // ページビューイベントを記録
    const pageView = await prisma.lPEvent.create({
      data: {
        sessionId,
        lpId,
        eventType: 'pageview',
        timestamp: new Date(timestamp || Date.now()),
        path: pathname || '/',
        search: search || '',
        data: {
          // 必要に応じて追加データ
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    return NextResponse.json(
      { error: 'Failed to track pageview' },
      { status: 500 }
    );
  }
}