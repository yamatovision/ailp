/**
 * リアルタイム統計コンポーネント
 * ABテストのリアルタイムデータを表示
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { getLPStats, getRecentEvents } from '@/lib/api/tracking';
import { TrackingEvent } from '@/lib/tracking/tracker';
import { aggregateEvents } from '@/lib/analysis/real-time-analysis';

interface RealTimeStatsProps {
  lpId: string;
  refreshInterval?: number; // ミリ秒
}

export default function RealTimeStats({ lpId, refreshInterval = 30000 }: RealTimeStatsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [recentEvents, setRecentEvents] = useState<TrackingEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // 統計情報の取得
  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getLPStats(lpId);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('統計情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 最新イベントの取得
  const fetchRecentEvents = async () => {
    try {
      const events = await getRecentEvents(lpId, 100); // 直近100件
      setRecentEvents(events);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching recent events:', err);
    }
  };
  
  // 初回データ取得
  useEffect(() => {
    fetchStats();
    fetchRecentEvents();
  }, [lpId]);
  
  // 定期的なデータ更新
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchRecentEvents();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [lpId, refreshInterval]);
  
  // イベントの集計
  const aggregatedData = aggregateEvents(recentEvents);
  
  // 現在のアクティブユーザー数（過去5分）
  const activeUsers = recentEvents
    .filter(e => 
      e.timestamp > Date.now() - 5 * 60 * 1000 // 過去5分
    )
    .reduce((unique, event) => {
      unique.add(event.sessionId);
      return unique;
    }, new Set<string>()).size;
  
  // データローディング中の表示
  if (loading && !stats) {
    return (
      <Card className="p-4 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-500">統計情報を読み込み中...</p>
        </div>
      </Card>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <Card className="p-4 shadow-sm border-red-200">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button 
            className="mt-2 text-xs text-blue-500 hover:underline"
            onClick={fetchStats}
          >
            再読み込み
          </button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* リアルタイム指標 */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-medium text-gray-600 mb-2">リアルタイム指標</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">現在のアクティブユーザー</span>
              <span className="text-sm font-semibold">{activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">過去5分のイベント数</span>
              <span className="text-sm font-semibold">{recentEvents.filter(e => e.timestamp > Date.now() - 5 * 60 * 1000).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">過去5分のコンバージョン</span>
              <span className="text-sm font-semibold">
                {recentEvents.filter(e => e.type === 'conversion' && e.timestamp > Date.now() - 5 * 60 * 1000).length}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 text-right">
            最終更新: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        
        {/* 全体統計 */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-medium text-gray-600 mb-2">全体統計</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">総訪問数</span>
              <span className="text-sm font-semibold">{stats?.totalViews || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">総コンバージョン数</span>
              <span className="text-sm font-semibold">{stats?.totalConversions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">コンバージョン率</span>
              <span className="text-sm font-semibold">
                {stats ? (stats.conversionRate * 100).toFixed(2) : 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* デバイス内訳 */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-medium text-gray-600 mb-2">デバイス内訳</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">デスクトップ</span>
              <span className="text-sm font-semibold">{stats?.deviceBreakdown?.desktop || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">モバイル</span>
              <span className="text-sm font-semibold">{stats?.deviceBreakdown?.mobile || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">タブレット</span>
              <span className="text-sm font-semibold">{stats?.deviceBreakdown?.tablet || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 最近のイベント */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">最近のイベント</h3>
        <div className="max-h-48 overflow-y-auto text-xs">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">タイプ</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">時間</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">コンポーネント</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">バリアント</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentEvents.slice(0, 10).map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-1 whitespace-nowrap">
                    {event.type === 'pageview' && 'ページビュー'}
                    {event.type === 'component_view' && 'コンポーネント表示'}
                    {event.type === 'click' && 'クリック'}
                    {event.type === 'conversion' && 'コンバージョン'}
                    {event.type === 'scroll' && 'スクロール'}
                    {event.type === 'exit' && '離脱'}
                    {!['pageview', 'component_view', 'click', 'conversion', 'scroll', 'exit'].includes(event.type) && event.type}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {event.componentId ? event.componentId.substring(0, 8) + '...' : '-'}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {event.variant || '-'}
                  </td>
                </tr>
              ))}
              {recentEvents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                    イベントはまだありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 更新ボタン */}
      <div className="mt-4 text-center">
        <button
          className="text-xs text-blue-500 hover:underline"
          onClick={() => {
            fetchStats();
            fetchRecentEvents();
          }}
        >
          データを更新
        </button>
      </div>
    </Card>
  );
}