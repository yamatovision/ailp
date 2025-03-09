/**
 * トラッキングAPI関数
 * クライアント側からトラッキングデータを取得・操作するためのAPI関数群
 */

import { TrackingEvent } from '../tracking/tracker';

/**
 * イベント統計情報の型定義
 */
export interface EventStats {
  total: number;
  byType: Record<string, number>;
  byDevice: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  byDate: Record<string, number>; // YYYY-MM-DD形式の日付をキーとする
}

/**
 * コンポーネント統計情報の型定義
 */
export interface ComponentStats {
  id: string;
  componentId: string;
  views: number;
  clicks: number;
  conversions: number;
  variantA: {
    views: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  };
  variantB: {
    views: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  };
  improvement: number; // B vs A の改善率
  confidence: number; // 統計的信頼度 (0-1)
  isSignificant: boolean; // 統計的に有意かどうか
}

/**
 * LP全体の統計情報の型定義
 */
export interface LPStats {
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  dailyData: Array<{
    date: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
}

/**
 * テスト検証レポートの型定義
 */
export interface TestReport {
  testId: string;
  startDate: string;
  endDate: string;
  duration: number; // 日数
  totalSessions: number;
  totalConversions: number;
  overallConversionRate: number;
  componentResults: ComponentStats[];
  winningVariants: Array<{
    componentId: string;
    winningVariant: 'a' | 'b';
    improvement: number;
    confidence: number;
  }>;
  deviceSpecificResults: {
    desktop: ComponentStats[];
    mobile: ComponentStats[];
    tablet: ComponentStats[];
  };
  aiInsights: string[]; // AIによる分析結果
}

/**
 * LPのイベント統計を取得
 */
export async function getLPEventStats(lpId: string): Promise<EventStats> {
  try {
    const response = await fetch(`/api/tracking/stats?lpId=${lpId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching LP event stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch LP event stats:', error);
    throw error;
  }
}

/**
 * コンポーネント別の統計情報を取得
 */
export async function getComponentStats(lpId: string, componentId?: string): Promise<ComponentStats[]> {
  try {
    const url = componentId 
      ? `/api/tracking/stats/components/${componentId}?lpId=${lpId}`
      : `/api/tracking/stats/components?lpId=${lpId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching component stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch component stats:', error);
    throw error;
  }
}

/**
 * LP全体の統計情報を取得
 */
export async function getLPStats(lpId: string): Promise<LPStats> {
  try {
    const response = await fetch(`/api/tracking/stats/lp/${lpId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching LP stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch LP stats:', error);
    throw error;
  }
}

/**
 * テスト検証レポートを取得
 */
export async function getTestReport(testId: string): Promise<TestReport> {
  try {
    const response = await fetch(`/api/tracking/stats/report/${testId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching test report: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch test report:', error);
    throw error;
  }
}

/**
 * イベントデータをエクスポート
 */
export async function exportEventData(lpId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
  try {
    const response = await fetch(`/api/tracking/export?lpId=${lpId}&format=${format}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error exporting event data: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Failed to export event data:', error);
    throw error;
  }
}

/**
 * 勝者バリアントを適用
 */
export async function applyWinningVariant(
  testId: string, 
  componentId: string, 
  variant: 'a' | 'b'
): Promise<boolean> {
  try {
    const response = await fetch(`/api/tests/${testId}/apply-winner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ componentId, winningVariant: variant }),
    });

    if (!response.ok) {
      throw new Error(`Error applying winning variant: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to apply winning variant:', error);
    throw error;
  }
}

/**
 * リアルタイムイベントデータを取得（直近のイベント）
 */
export async function getRecentEvents(
  lpId: string, 
  limit: number = 100
): Promise<TrackingEvent[]> {
  try {
    const response = await fetch(`/api/tracking/events/recent?lpId=${lpId}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching recent events: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch recent events:', error);
    throw error;
  }
}

/**
 * A/Bテスト結果の統計的有意差を確認
 */
export async function checkStatisticalSignificance(
  lpId: string,
  componentId: string
): Promise<{
  isSignificant: boolean;
  confidence: number;
  winningVariant: 'a' | 'b' | null;
  recommendation: string;
}> {
  try {
    const response = await fetch(`/api/tracking/analysis/significance?lpId=${lpId}&componentId=${componentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error checking statistical significance: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to check statistical significance:', error);
    throw error;
  }
}