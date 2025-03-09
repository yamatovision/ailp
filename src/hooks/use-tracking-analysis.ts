/**
 * トラッキング分析フック
 * トラッキングデータの分析結果を取得・操作するためのReactフック
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getLPStats, 
  getComponentStats, 
  getTestReport,
  checkStatisticalSignificance,
  ComponentStats,
  LPStats,
  TestReport
} from '../lib/api/tracking';

/**
 * LPの統計情報フック
 */
export function useLPStats(lpId: string) {
  const [stats, setStats] = useState<LPStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // データ取得関数
  const fetchData = useCallback(async () => {
    if (!lpId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLPStats(lpId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch LP stats'));
      console.error('Error fetching LP stats:', err);
    } finally {
      setLoading(false);
    }
  }, [lpId]);
  
  // 初回データ取得
  useEffect(() => {
    if (lpId) {
      fetchData();
    }
  }, [lpId, fetchData]);
  
  // データ更新関数
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { stats, loading, error, refresh };
}

/**
 * コンポーネントの統計情報フック
 */
export function useComponentStats(lpId: string, componentId?: string) {
  const [stats, setStats] = useState<ComponentStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // データ取得関数
  const fetchData = useCallback(async () => {
    if (!lpId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getComponentStats(lpId, componentId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch component stats'));
      console.error('Error fetching component stats:', err);
    } finally {
      setLoading(false);
    }
  }, [lpId, componentId]);
  
  // 初回データ取得
  useEffect(() => {
    if (lpId) {
      fetchData();
    }
  }, [lpId, componentId, fetchData]);
  
  // データ更新関数
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // 特定のコンポーネントの統計情報を取得
  const getComponentStat = useCallback((id: string) => {
    return stats.find(stat => stat.componentId === id) || null;
  }, [stats]);
  
  // 統計的有意差をチェック
  const checkSignificance = useCallback(async (componentId: string) => {
    if (!lpId) return null;
    
    try {
      return await checkStatisticalSignificance(lpId, componentId);
    } catch (err) {
      console.error('Error checking significance:', err);
      return null;
    }
  }, [lpId]);
  
  return {
    stats,
    loading,
    error,
    refresh,
    getComponentStat,
    checkSignificance
  };
}

/**
 * テストレポートフック
 */
export function useTestReport(testId: string) {
  const [report, setReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // データ取得関数
  const fetchData = useCallback(async () => {
    if (!testId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getTestReport(testId);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch test report'));
      console.error('Error fetching test report:', err);
    } finally {
      setLoading(false);
    }
  }, [testId]);
  
  // 初回データ取得
  useEffect(() => {
    if (testId) {
      fetchData();
    }
  }, [testId, fetchData]);
  
  // データ更新関数
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // 特定のデバイスの結果を取得
  const getDeviceResults = useCallback((deviceType: 'desktop' | 'mobile' | 'tablet') => {
    if (!report) return [];
    return report.deviceSpecificResults[deviceType] || [];
  }, [report]);
  
  // 勝者バリアントを適用
  const applyWinner = useCallback(async (componentId: string, variant: 'a' | 'b') => {
    if (!testId) return false;
    
    try {
      // この関数の実装は lib/api/tracking.ts で定義したapplyWinningVariantを使用
      // ここでは省略
      console.log('Applying winner:', testId, componentId, variant);
      return true;
    } catch (err) {
      console.error('Error applying winner:', err);
      return false;
    }
  }, [testId]);
  
  return {
    report,
    loading,
    error,
    refresh,
    getDeviceResults,
    applyWinner
  };
}