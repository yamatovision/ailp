/**
 * 同期XMLHttpRequest用トラッキングエンドポイント
 * ページ離脱時にBeacon APIが利用できない環境で使用するフォールバック
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { EventType } from '@/lib/tracking/tracker';

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid events data' },
        { status: 400 }
      );
    }
    
    // 離脱イベントに特化した簡易処理（高速に完了することが重要）
    // Beacon APIと異なり、同期XMLHttpRequestはレスポンスを待つため
    // できるだけ早く返す必要がある
    
    const exitEvents = events.filter(e => 
      e && typeof e === 'object' && e.type === EventType.EXIT && 
      e.sessionId && e.lpId && e.timestamp
    );
    
    if (exitEvents.length > 0) {
      // 非同期で処理を開始し、レスポンスは待たない
      void processExitEvents(exitEvents);
    }
    
    // 他のイベントも記録（低優先度）
    const otherEvents = events.filter(e => e && typeof e === 'object' && e.type !== EventType.EXIT);
    if (otherEvents.length > 0) {
      void processOtherEvents(otherEvents);
    }
    
    // すぐに成功を返す
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing sync tracking:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 離脱イベントの処理（非同期で実行）
 */
async function processExitEvents(events: any[]): Promise<void> {
  try {
    // セッションIDごとにまとめて1つの更新にする（最適化）
    const sessionGroups = groupBySession(events);
    
    // 各セッションの最後のイベントのみを使用して更新
    const sessionUpdates = Object.entries(sessionGroups).map(([sessionId, sessionEvents]) => {
      // 最新のイベントを使用
      const latestEvent = sessionEvents.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return prisma.lPSession.update({
        where: {
          id: sessionId
        },
        data: {
          lastActivityAt: new Date(latestEvent.timestamp),
          timeOnPage: latestEvent.meta?.timeOnPage || 0,
          maxScrollDepth: latestEvent.meta?.scrollDepth || 0
        }
      }).catch(err => {
        console.error(`Error updating session ${sessionId}:`, err);
        return null;
      });
    });
    
    // セッションの更新を実行（イベントログは省略して最適化）
    await Promise.all(sessionUpdates);
    
    // イベントログの保存は低優先度で非同期に行う
    setTimeout(() => {
      saveExitEventLogs(events).catch(err => {
        console.error('Error saving exit event logs:', err);
      });
    }, 100);
  } catch (error) {
    console.error('Error processing exit events:', error);
  }
}

/**
 * 離脱イベントログの保存（優先度低）
 */
async function saveExitEventLogs(events: any[]): Promise<void> {
  try {
    // イベントログの保存（バルク挿入）
    const eventData = events.map(event => ({
      type: 'exit',
      sessionId: event.sessionId,
      lpId: event.lpId,
      timestamp: new Date(event.timestamp),
      data: {
        exitUrl: event.meta?.exitUrl || '',
        timeOnPage: event.meta?.timeOnPage || 0,
        scrollDepth: event.meta?.scrollDepth || 0
      }
    }));
    
    // バルク挿入（Prismaはバルク挿入をnativeにサポートしていないため、複数Promise）
    const eventLogs = eventData.map(data => {
      return prisma.lPEvent.create({
        data
      }).catch(err => {
        console.error(`Error logging exit event:`, err);
        return null;
      });
    });
    
    await Promise.all(eventLogs);
  } catch (error) {
    console.error('Error saving exit event logs:', error);
    throw error;
  }
}

/**
 * その他のイベントの処理（優先度低）
 */
async function processOtherEvents(events: any[]): Promise<void> {
  // 一定時間後に低優先度で処理
  setTimeout(() => {
    // シンプルにイベントを記録（最大20件まで）
    const limitedEvents = events.slice(0, 20);
    
    const eventLogs = limitedEvents.map(event => {
      return prisma.lPEvent.create({
        data: {
          type: event.type?.toLowerCase() || 'unknown',
          sessionId: event.sessionId,
          lpId: event.lpId,
          timestamp: new Date(event.timestamp),
          data: event.data || {},
          meta: event.meta || {}
        }
      }).catch(err => {
        console.error(`Error logging event:`, err);
        return null;
      });
    });
    
    Promise.all(eventLogs).catch(err => {
      console.error('Error processing other events:', err);
    });
  }, 200);
}

/**
 * セッションIDでイベントをグループ化
 */
function groupBySession(events: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  for (const event of events) {
    const sessionId = event.sessionId;
    if (!groups[sessionId]) {
      groups[sessionId] = [];
    }
    groups[sessionId].push(event);
  }
  
  return groups;
}