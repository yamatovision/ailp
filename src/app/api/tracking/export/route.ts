/**
 * データエクスポートAPI
 * トラッキングデータをCSVまたはJSONでエクスポートするエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

/**
 * トラッキングデータエクスポートAPI
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lpId = searchParams.get('lpId');
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // LPIDが必須
    if (!lpId) {
      return NextResponse.json(
        { error: 'LP ID is required' },
        { status: 400 }
      );
    }
    
    // フォーマット確認
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "json"' },
        { status: 400 }
      );
    }
    
    // 日付範囲のフィルタリング設定
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
    
    const whereClause: any = {
      lpId
    };
    
    if (Object.keys(dateFilter).length > 0) {
      whereClause.timestamp = dateFilter;
    }
    
    // イベントデータを取得
    const events = await db.lPEvent.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'asc'
      },
      include: {
        session: true
      }
    });
    
    // セッションIDとデバイス情報の対応関係を作成
    const sessionDeviceMap: Record<string, string> = {};
    events.forEach(event => {
      if (event.session?.deviceType) {
        sessionDeviceMap[event.sessionId] = event.session.deviceType;
      }
    });
    
    // コンポーネントイベントを取得
    const componentEvents = await db.componentEvent.findMany({
      where: {
        lpId
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    // JSON形式のデータを準備
    const exportData = {
      lpId,
      exportDate: new Date().toISOString(),
      totalEvents: events.length,
      totalComponentEvents: componentEvents.length,
      events: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        deviceType: sessionDeviceMap[event.sessionId] || 'unknown',
        path: event.path,
        data: event.data
      })),
      componentEvents: componentEvents.map(event => ({
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        componentId: event.componentId,
        variant: event.variant,
        data: event.data
      }))
    };
    
    // フォーマットに応じて出力
    if (format === 'json') {
      return NextResponse.json(exportData);
    } else {
      // CSV形式に変換
      const eventsCsv = convertToCsv([
        ['ID', 'Event Type', 'Timestamp', 'Session ID', 'Device Type', 'Path', 'Data'],
        ...exportData.events.map(e => [
          e.id,
          e.eventType,
          e.timestamp.toISOString(),
          e.sessionId,
          e.deviceType,
          e.path || '',
          e.data ? JSON.stringify(e.data) : ''
        ])
      ]);
      
      const componentEventsCsv = convertToCsv([
        ['ID', 'Event Type', 'Timestamp', 'Session ID', 'Component ID', 'Variant', 'Data'],
        ...exportData.componentEvents.map(e => [
          e.id,
          e.eventType,
          e.timestamp.toISOString(),
          e.sessionId,
          e.componentId,
          e.variant || '',
          e.data ? JSON.stringify(e.data) : ''
        ])
      ]);
      
      const csv = 
        `# LP: ${lpId}\n` +
        `# Export Date: ${exportData.exportDate}\n` +
        `# Total Events: ${exportData.totalEvents}\n` +
        `# Total Component Events: ${exportData.totalComponentEvents}\n\n` +
        `# EVENTS\n${eventsCsv}\n\n` +
        `# COMPONENT EVENTS\n${componentEventsCsv}`;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tracking_data_${lpId}.csv"`
        }
      });
    }
  } catch (error) {
    console.error('Error in tracking export API:', error);
    return NextResponse.json(
      { error: 'Failed to export tracking data' },
      { status: 500 }
    );
  }
}

/**
 * 2次元配列をCSV形式に変換
 */
function convertToCsv(arr: any[][]): string {
  return arr
    .map(row => 
      row
        .map(value => {
          if (value === null || value === undefined) {
            return '';
          }
          const str = String(value);
          // ダブルクォートや改行、カンマを含む場合はダブルクォートでエスケープ
          if (str.includes('"') || str.includes('\n') || str.includes(',')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}