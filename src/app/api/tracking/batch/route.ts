/**
 * バッチトラッキングAPI
 * クライアント側から送信された複数のトラッキングイベントをまとめて処理
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { EventType } from '@/lib/tracking/tracker';

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data. Expected non-empty array.' },
        { status: 400 }
      );
    }
    
    // イベントの検証
    const validatedEvents = events.filter(validateEvent);
    
    if (validatedEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events found.' },
        { status: 400 }
      );
    }
    
    // イベントを処理
    await processEvents(validatedEvents);
    
    return NextResponse.json({
      success: true,
      processedCount: validatedEvents.length
    });
  } catch (error) {
    console.error('Error processing tracking batch:', error);
    return NextResponse.json(
      { error: 'Failed to process tracking data.' },
      { status: 500 }
    );
  }
}

/**
 * イベントの検証
 */
function validateEvent(event: any): boolean {
  if (!event || typeof event !== 'object') return false;
  
  // 必須フィールドの確認
  const requiredFields = ['type', 'lpId', 'sessionId', 'timestamp'];
  if (!requiredFields.every(field => event[field])) return false;
  
  // イベントタイプの確認（有効な種類かどうか）
  const validTypes = Object.values(EventType) as string[];
  if (!validTypes.includes(event.type)) return false;
  
  // タイムスタンプのフォーマット確認
  const timestamp = Number(event.timestamp);
  if (isNaN(timestamp) || timestamp <= 0) return false;
  
  // イベントタイプ別の検証
  switch (event.type) {
    case EventType.COMPONENT_VIEW:
    case EventType.COMPONENT_HIDE:
    case EventType.CLICK:
      // コンポーネント関連のイベントには componentId と variant が必要
      return !!event.componentId && !!event.variant;
    
    case EventType.CONVERSION:
      // コンバージョンには data.conversionType が必要
      return !!event.data?.conversionType;
    
    default:
      return true;
  }
}

/**
 * イベントの処理
 */
async function processEvents(events: any[]): Promise<void> {
  // イベントタイプ別に分類
  const eventsByType: Record<string, any[]> = {};
  
  for (const event of events) {
    if (!eventsByType[event.type]) {
      eventsByType[event.type] = [];
    }
    eventsByType[event.type].push(event);
  }
  
  // それぞれのイベントタイプを並列処理
  await Promise.all(
    Object.entries(eventsByType).map(([type, typeEvents]) => {
      return processEventsByType(type as EventType, typeEvents);
    })
  );
}

/**
 * 特定のイベントタイプの処理
 */
async function processEventsByType(type: EventType, events: any[]): Promise<void> {
  try {
    switch (type) {
      case EventType.PAGEVIEW:
        await processPageViews(events);
        break;
        
      case EventType.COMPONENT_VIEW:
        await processComponentViews(events);
        break;
        
      case EventType.CLICK:
        await processClicks(events);
        break;
        
      case EventType.CONVERSION:
        await processConversions(events);
        break;
        
      case EventType.EXIT:
        await processExitEvents(events);
        break;
        
      default:
        // その他のイベントタイプは汎用的に保存
        await storeGenericEvents(type, events);
    }
  } catch (error) {
    console.error(`Error processing events of type ${type}:`, error);
    throw error;
  }
}

/**
 * ページビューの処理
 */
async function processPageViews(events: any[]): Promise<void> {
  try {
    // セッションデータの更新/作成
    const sessionUpdates = events.map(event => {
      return prisma.lPSession.upsert({
        where: {
          id: event.sessionId
        },
        create: {
          id: event.sessionId,
          lpId: event.lpId,
          startedAt: new Date(event.timestamp),
          lastActivityAt: new Date(event.timestamp),
          pageViews: 1,
          source: event.meta?.referrer || null,
          deviceType: event.device?.type || 'unknown',
          browser: event.device?.browser || 'unknown'
        },
        update: {
          lastActivityAt: new Date(event.timestamp),
          pageViews: {
            increment: 1
          }
        }
      });
    });
    
    // LPのビュー数更新
    const lpUpdates = Array.from(new Set(events.map(e => e.lpId))).map(lpId => {
      return prisma.lPStats.upsert({
        where: {
          lpId
        },
        create: {
          lpId,
          views: events.filter(e => e.lpId === lpId).length,
          uniqueVisitors: 1,
          lastUpdatedAt: new Date()
        },
        update: {
          views: {
            increment: events.filter(e => e.lpId === lpId).length
          },
          lastUpdatedAt: new Date()
        }
      });
    });
    
    // 全ての更新を並列実行
    await Promise.all([
      ...sessionUpdates,
      ...lpUpdates
    ]);
  } catch (error) {
    console.error('Error processing page views:', error);
    throw error;
  }
}

/**
 * コンポーネント表示の処理
 */
async function processComponentViews(events: any[]): Promise<void> {
  try {
    // イベントログの保存
    const eventLogs = events.map(event => {
      return prisma.componentEvent.create({
        data: {
          type: 'view',
          sessionId: event.sessionId,
          lpId: event.lpId,
          componentId: event.componentId,
          variant: event.variant,
          timestamp: new Date(event.timestamp),
          data: event.data || {}
        }
      });
    });
    
    // コンポーネント統計の更新
    const componentStats = Array.from(
      new Set(events.map(e => `${e.componentId}-${e.variant}`))
    ).map(compVariant => {
      const [componentId, variant] = compVariant.split('-');
      const count = events.filter(
        e => e.componentId === componentId && e.variant === variant
      ).length;
      
      return prisma.componentStats.upsert({
        where: {
          componentId_variant: {
            componentId,
            variant
          }
        },
        create: {
          componentId,
          variant,
          views: count,
          lastUpdatedAt: new Date()
        },
        update: {
          views: {
            increment: count
          },
          lastUpdatedAt: new Date()
        }
      });
    });
    
    // 全ての更新を並列実行
    await Promise.all([
      ...eventLogs,
      ...componentStats
    ]);
  } catch (error) {
    console.error('Error processing component views:', error);
    throw error;
  }
}

/**
 * クリックイベントの処理
 */
async function processClicks(events: any[]): Promise<void> {
  try {
    // イベントログの保存
    const eventLogs = events.map(event => {
      return prisma.componentEvent.create({
        data: {
          type: 'click',
          sessionId: event.sessionId,
          lpId: event.lpId,
          componentId: event.componentId,
          variant: event.variant,
          timestamp: new Date(event.timestamp),
          data: {
            element: event.data?.element || 'unknown',
            ...event.data
          }
        }
      });
    });
    
    // コンポーネント統計の更新（クリック数）
    const componentStats = Array.from(
      new Set(events.map(e => `${e.componentId}-${e.variant}`))
    ).map(compVariant => {
      const [componentId, variant] = compVariant.split('-');
      const count = events.filter(
        e => e.componentId === componentId && e.variant === variant
      ).length;
      
      return prisma.componentStats.upsert({
        where: {
          componentId_variant: {
            componentId,
            variant
          }
        },
        create: {
          componentId,
          variant,
          clicks: count,
          lastUpdatedAt: new Date()
        },
        update: {
          clicks: {
            increment: count
          },
          lastUpdatedAt: new Date()
        }
      });
    });
    
    // 全ての更新を並列実行
    await Promise.all([
      ...eventLogs,
      ...componentStats
    ]);
  } catch (error) {
    console.error('Error processing clicks:', error);
    throw error;
  }
}

/**
 * コンバージョンイベントの処理
 */
async function processConversions(events: any[]): Promise<void> {
  try {
    // イベントログの保存
    const eventLogs = events.map(event => {
      return prisma.lPEvent.create({
        data: {
          type: 'conversion',
          sessionId: event.sessionId,
          lpId: event.lpId,
          timestamp: new Date(event.timestamp),
          data: {
            conversionType: event.data?.conversionType || 'unknown',
            value: event.data?.value,
            ...event.data
          }
        }
      });
    });
    
    // LP統計の更新（コンバージョン数）
    const lpStats = Array.from(new Set(events.map(e => e.lpId))).map(lpId => {
      const count = events.filter(e => e.lpId === lpId).length;
      
      return prisma.lPStats.upsert({
        where: {
          lpId
        },
        create: {
          lpId,
          conversions: count,
          lastUpdatedAt: new Date()
        },
        update: {
          conversions: {
            increment: count
          },
          lastUpdatedAt: new Date()
        }
      });
    });
    
    // セッションのコンバージョン状態更新
    const sessionUpdates = Array.from(new Set(events.map(e => e.sessionId))).map(sessionId => {
      return prisma.lPSession.update({
        where: {
          id: sessionId
        },
        data: {
          converted: true,
          conversionTime: new Date(
            Math.min(...events.filter(e => e.sessionId === sessionId).map(e => e.timestamp))
          )
        }
      });
    });
    
    // 全ての更新を並列実行
    await Promise.all([
      ...eventLogs,
      ...lpStats,
      ...sessionUpdates
    ]);
  } catch (error) {
    console.error('Error processing conversions:', error);
    throw error;
  }
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
 * 汎用イベントの保存
 */
async function storeGenericEvents(type: EventType, events: any[]): Promise<void> {
  try {
    const eventLogs = events.map(event => {
      return prisma.lPEvent.create({
        data: {
          type: type.toLowerCase(),
          sessionId: event.sessionId,
          lpId: event.lpId,
          timestamp: new Date(event.timestamp),
          data: event.data || {},
          meta: event.meta || {}
        }
      });
    });
    
    await Promise.all(eventLogs);
  } catch (error) {
    console.error(`Error storing generic events of type ${type}:`, error);
    throw error;
  }
}