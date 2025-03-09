/**
 * Beacon API用トラッキングエンドポイント
 * ページ離脱時にBeacon APIから送信されるトラッキングデータを処理
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { EventType } from '@/lib/tracking/tracker';

export async function POST(request: NextRequest) {
  try {
    // Beacon APIからのリクエストはContent-Typeに注意が必要
    const contentType = request.headers.get('Content-Type') || '';
    
    let events = [];
    
    if (contentType.includes('application/json')) {
      const body = await request.json();
      events = body.events || [];
    } else {
      // テキストとして読み込み、JSONにパース
      const text = await request.text();
      try {
        const body = JSON.parse(text);
        events = body.events || [];
      } catch (e) {
        console.error('Failed to parse beacon data:', e);
      }
    }
    
    if (!Array.isArray(events) || events.length === 0) {
      // Beacon APIは常に成功を返す必要があるため、エラーでも200を返す
      return new NextResponse(null, { status: 200 });
    }
    
    // データ処理を非同期的に開始（レスポンスを待たない）
    void processBeaconEvents(events);
    
    // Beacon APIはレスポンスを見ないので、すぐに成功を返す
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error processing beacon data:', error);
    // Beacon APIは常に成功を返す必要がある
    return new NextResponse(null, { status: 200 });
  }
}

/**
 * Beaconイベントの処理（非同期で実行）
 * エラーが発生しても、Beacon APIはレスポンスを待たないため
 * ここでのエラーはロギングのみを行う
 */
async function processBeaconEvents(events: any[]): Promise<void> {
  try {
    // イベントの検証
    const validatedEvents = events.filter(validateEvent);
    
    if (validatedEvents.length === 0) {
      console.warn('No valid events found in beacon data');
      return;
    }
    
    // EXIT イベントを優先的に処理
    const exitEvents = validatedEvents.filter(e => e.type === EventType.EXIT);
    if (exitEvents.length > 0) {
      await processExitEvents(exitEvents).catch(err => {
        console.error('Error processing exit events from beacon:', err);
      });
    }
    
    // その他のイベントを処理
    const otherEvents = validatedEvents.filter(e => e.type !== EventType.EXIT);
    if (otherEvents.length > 0) {
      await processOtherEvents(otherEvents).catch(err => {
        console.error('Error processing other events from beacon:', err);
      });
    }
  } catch (error) {
    console.error('Error in beacon event processing:', error);
  }
}

/**
 * イベントの検証
 */
function validateEvent(event: any): boolean {
  if (!event || typeof event !== 'object') return false;
  
  // 必須フィールドの確認
  const requiredFields = ['type', 'lpId', 'sessionId', 'timestamp'];
  return requiredFields.every(field => event[field] !== undefined);
}

/**
 * 離脱イベントの処理
 */
async function processExitEvents(events: any[]): Promise<void> {
  try {
    // セッションの更新
    const sessionUpdates = events.map(event => {
      return prisma.lPSession.update({
        where: {
          id: event.sessionId
        },
        data: {
          lastActivityAt: new Date(event.timestamp),
          timeOnPage: event.meta?.timeOnPage || 0,
          maxScrollDepth: event.meta?.scrollDepth || 0
        }
      }).catch(err => {
        console.error(`Error updating session ${event.sessionId}:`, err);
        return null;
      });
    });
    
    // イベントログの保存
    const eventLogs = events.map(event => {
      return prisma.lPEvent.create({
        data: {
          type: 'exit',
          sessionId: event.sessionId,
          lpId: event.lpId,
          timestamp: new Date(event.timestamp),
          data: {
            exitUrl: event.meta?.exitUrl || '',
            timeOnPage: event.meta?.timeOnPage || 0,
            scrollDepth: event.meta?.scrollDepth || 0
          }
        }
      }).catch(err => {
        console.error(`Error logging exit event for session ${event.sessionId}:`, err);
        return null;
      });
    });
    
    // 全ての更新を並列実行
    await Promise.all([
      ...sessionUpdates,
      ...eventLogs
    ]);
  } catch (error) {
    console.error('Error processing exit events:', error);
    throw error;
  }
}

/**
 * その他のイベントの処理
 */
async function processOtherEvents(events: any[]): Promise<void> {
  try {
    // シンプルにイベントを記録するだけ（詳細な処理はバッチエンドポイントで行う）
    const eventLogs = events.map(event => {
      return prisma.lPEvent.create({
        data: {
          type: event.type.toLowerCase(),
          sessionId: event.sessionId,
          lpId: event.lpId,
          timestamp: new Date(event.timestamp),
          data: event.data || {},
          meta: event.meta || {}
        }
      }).catch(err => {
        console.error(`Error logging event for session ${event.sessionId}:`, err);
        return null;
      });
    });
    
    await Promise.all(eventLogs);
  } catch (error) {
    console.error('Error processing other events:', error);
    throw error;
  }
}