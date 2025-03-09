/**
 * リアルタイム分析ツール
 * トラッキングデータのリアルタイム分析機能を提供
 */

import { TrackingEvent, EventType } from '../tracking/tracker';

/**
 * イベント集計結果の型
 */
export interface EventAggregation {
  totalEvents: number;
  byType: Record<string, number>;
  byComponent: Record<string, {
    total: number;
    byVariant: {
      a: number;
      b: number;
    };
    byEventType: Record<string, number>;
  }>;
  conversionRate: number;
  clickRate: Record<string, number>; // コンポーネントIDごとのクリック率
}

/**
 * 統計的有意差検定結果の型
 */
export interface SignificanceTestResult {
  isSignificant: boolean;
  confidence: number; // 0-1の範囲
  pValue: number;
  winningVariant: 'a' | 'b' | null;
  improvementRate: number; // パーセント表示の改善率
}

/**
 * A/Bテストの結果モデル
 */
export interface ABTestResult {
  componentId: string;
  sampleSizeA: number; // バリアントAのサンプルサイズ
  sampleSizeB: number; // バリアントBのサンプルサイズ
  conversionCountA: number; // バリアントAのコンバージョン数
  conversionCountB: number; // バリアントBのコンバージョン数
  conversionRateA: number; // バリアントAのコンバージョン率
  conversionRateB: number; // バリアントBのコンバージョン率
  significance: SignificanceTestResult;
}

/**
 * イベントデータをリアルタイムで集計
 */
export function aggregateEvents(events: TrackingEvent[]): EventAggregation {
  // 初期集計オブジェクト
  const aggregation: EventAggregation = {
    totalEvents: 0,
    byType: {},
    byComponent: {},
    conversionRate: 0,
    clickRate: {}
  };
  
  if (!events.length) {
    return aggregation;
  }
  
  // 各種カウント用の変数
  let pageviews = 0;
  const conversionsByLP: Record<string, number> = {};
  const sessionsByLP: Record<string, Set<string>> = {};
  
  // イベントを集計
  events.forEach(event => {
    // 総イベント数
    aggregation.totalEvents++;
    
    // イベントタイプ別集計
    aggregation.byType[event.type] = (aggregation.byType[event.type] || 0) + 1;
    
    // ページビューのカウント
    if (event.type === EventType.PAGEVIEW) {
      pageviews++;
      
      // セッション数のカウント（ユニークセッション）
      if (!sessionsByLP[event.lpId]) {
        sessionsByLP[event.lpId] = new Set();
      }
      sessionsByLP[event.lpId].add(event.sessionId);
    }
    
    // コンポーネント別集計
    if (event.componentId) {
      // コンポーネントが存在しない場合は初期化
      if (!aggregation.byComponent[event.componentId]) {
        aggregation.byComponent[event.componentId] = {
          total: 0,
          byVariant: { a: 0, b: 0 },
          byEventType: {}
        };
      }
      
      // コンポーネント別総数
      aggregation.byComponent[event.componentId].total++;
      
      // バリアント別集計
      if (event.variant) {
        aggregation.byComponent[event.componentId].byVariant[event.variant]++;
      }
      
      // イベントタイプ別集計
      aggregation.byComponent[event.componentId].byEventType[event.type] = 
        (aggregation.byComponent[event.componentId].byEventType[event.type] || 0) + 1;
      
      // クリック率の計算のための準備
      if (event.type === EventType.CLICK) {
        // コンバージョンイベントの場合
        if (event.componentId && event.lpId) {
          conversionsByLP[event.lpId] = (conversionsByLP[event.lpId] || 0) + 1;
        }
      }
    }
    
    // コンバージョンのカウント
    if (event.type === EventType.CONVERSION) {
      if (event.lpId) {
        conversionsByLP[event.lpId] = (conversionsByLP[event.lpId] || 0) + 1;
      }
    }
  });
  
  // クリック率の計算（コンポーネント別ビュー数に対するクリック数の割合）
  for (const componentId in aggregation.byComponent) {
    const component = aggregation.byComponent[componentId];
    const views = component.byEventType[EventType.COMPONENT_VIEW] || 0;
    const clicks = component.byEventType[EventType.CLICK] || 0;
    
    aggregation.clickRate[componentId] = views > 0 ? clicks / views : 0;
  }
  
  // 全体のコンバージョン率計算
  let totalConversions = 0;
  let totalSessions = 0;
  
  for (const lpId in conversionsByLP) {
    totalConversions += conversionsByLP[lpId];
  }
  
  for (const lpId in sessionsByLP) {
    totalSessions += sessionsByLP[lpId].size;
  }
  
  aggregation.conversionRate = totalSessions > 0 ? totalConversions / totalSessions : 0;
  
  return aggregation;
}

/**
 * 統計的有意差検定を実行
 * Z検定（比率の差の検定）を使用
 */
export function performSignificanceTest(
  sampleSizeA: number,
  conversionA: number,
  sampleSizeB: number,
  conversionB: number,
  confidenceLevel: number = 0.95
): SignificanceTestResult {
  // サンプルサイズが少ない場合は有意差なしとする
  if (sampleSizeA < 10 || sampleSizeB < 10) {
    return {
      isSignificant: false,
      confidence: 0,
      pValue: 1,
      winningVariant: null,
      improvementRate: 0
    };
  }
  
  // コンバージョン率を計算
  const convRateA = sampleSizeA > 0 ? conversionA / sampleSizeA : 0;
  const convRateB = sampleSizeB > 0 ? conversionB / sampleSizeB : 0;
  
  // 全体のコンバージョン率
  const pooledConvRate = (conversionA + conversionB) / (sampleSizeA + sampleSizeB);
  
  // 標準誤差を計算
  const standardError = Math.sqrt(
    pooledConvRate * (1 - pooledConvRate) * (1/sampleSizeA + 1/sampleSizeB)
  );
  
  // Z値を計算
  const zScore = Math.abs(convRateA - convRateB) / standardError;
  
  // p値を計算（標準正規分布の累積分布関数から）
  // 正確な計算には統計ライブラリを使用するべきですが、
  // ここでは近似値を計算
  const pValue = 2 * (1 - normalCDF(zScore));
  
  // 信頼度を計算
  const confidence = 1 - pValue;
  
  // 有意差があるかどうか判定
  const isSignificant = confidence >= confidenceLevel;
  
  // 勝者バリアントを決定
  let winningVariant: 'a' | 'b' | null = null;
  if (isSignificant) {
    winningVariant = convRateA > convRateB ? 'a' : 'b';
  }
  
  // 改善率を計算（勝者/敗者 - 1）* 100
  let improvementRate = 0;
  if (winningVariant === 'a' && convRateB > 0) {
    improvementRate = ((convRateA / convRateB) - 1) * 100;
  } else if (winningVariant === 'b' && convRateA > 0) {
    improvementRate = ((convRateB / convRateA) - 1) * 100;
  }
  
  return {
    isSignificant,
    confidence,
    pValue,
    winningVariant,
    improvementRate
  };
}

/**
 * 標準正規分布の累積分布関数（CDF）
 * エルフ関数のTaylor展開による近似
 */
function normalCDF(x: number): number {
  // 正規分布の累積分布関数の近似計算
  // エルフ関数のTaylor展開を使用
  
  // 負の値は対称性を利用
  if (x < 0) {
    return 1 - normalCDF(-x);
  }
  
  // 大きな値の場合は1に近似
  if (x > 6) {
    return 1;
  }
  
  // エルフ関数のTaylor展開による近似
  let sum = x;
  let term = x;
  
  for (let i = 1; i < 100; i++) {
    term = term * x * x / (2 * i + 1);
    sum += term;
  }
  
  return 0.5 + sum * Math.exp(-x*x/2) / Math.sqrt(2 * Math.PI);
}

/**
 * ABテスト結果を計算
 */
export function calculateABTestResult(
  componentId: string,
  events: TrackingEvent[],
  conversionType: EventType = EventType.CONVERSION
): ABTestResult {
  // コンポーネント別・バリアント別に集計
  let viewsA = 0;
  let viewsB = 0;
  let conversionsA = 0;
  let conversionsB = 0;
  
  // セッション別に一意のビューをカウント
  const sessionViewsA = new Set<string>();
  const sessionViewsB = new Set<string>();
  
  events.forEach(event => {
    // 対象のコンポーネントのみ処理
    if (event.componentId === componentId) {
      // ビューのカウント
      if (event.type === EventType.COMPONENT_VIEW) {
        if (event.variant === 'a') {
          const sessionKey = `${event.sessionId}-${event.componentId}`;
          if (!sessionViewsA.has(sessionKey)) {
            sessionViewsA.add(sessionKey);
            viewsA++;
          }
        } else if (event.variant === 'b') {
          const sessionKey = `${event.sessionId}-${event.componentId}`;
          if (!sessionViewsB.has(sessionKey)) {
            sessionViewsB.add(sessionKey);
            viewsB++;
          }
        }
      }
    }
    
    // コンバージョンのカウント
    // コンポーネントに関連付けられていないコンバージョンも含む
    if (event.type === conversionType) {
      // このセッションがどのバリアントを見たか確認
      const sessionKeyA = `${event.sessionId}-${componentId}`;
      const sessionKeyB = `${event.sessionId}-${componentId}`;
      
      if (sessionViewsA.has(sessionKeyA)) {
        conversionsA++;
      } else if (sessionViewsB.has(sessionKeyB)) {
        conversionsB++;
      }
    }
  });
  
  // コンバージョン率を計算
  const convRateA = viewsA > 0 ? conversionsA / viewsA : 0;
  const convRateB = viewsB > 0 ? conversionsB / viewsB : 0;
  
  // 統計的有意差検定を実行
  const significance = performSignificanceTest(viewsA, conversionsA, viewsB, conversionsB);
  
  return {
    componentId,
    sampleSizeA: viewsA,
    sampleSizeB: viewsB,
    conversionCountA: conversionsA,
    conversionCountB: conversionsB,
    conversionRateA: convRateA,
    conversionRateB: convRateB,
    significance
  };
}

/**
 * テスト期間の最適な期間を推定
 * 現在のコンバージョン率とトラフィックに基づいて、統計的有意差を得るのに必要なおおよその日数を計算
 */
export function estimateTestDuration(
  dailyTraffic: number,
  baseConversionRate: number,
  expectedImprovement: number = 10, // 期待する改善率（パーセント）
  confidenceLevel: number = 95, // 信頼水準（パーセント）
  power: number = 80 // 検出力（パーセント）
): number {
  // 必要なサンプルサイズを計算
  const p1 = baseConversionRate / 100; // ベースコンバージョン率（小数）
  const p2 = p1 * (1 + expectedImprovement / 100); // 期待コンバージョン率（小数）
  
  // 有意水準αと検出力βに基づくz値
  const zAlpha = 1.96; // 95%信頼区間のz値
  const zBeta = 0.84; // 80%検出力のz値
  
  // プールされた標準偏差
  const p = (p1 + p2) / 2;
  const sd = Math.sqrt(2 * p * (1 - p));
  
  // 効果量
  const es = Math.abs(p1 - p2);
  
  // 必要なサンプルサイズ（片側）
  const sampleSize = Math.pow(sd * (zAlpha + zBeta) / es, 2);
  
  // 両方のバリアントに必要な合計サンプルサイズ
  const totalSampleSize = sampleSize * 2;
  
  // 必要な日数
  const daysNeeded = Math.ceil(totalSampleSize / dailyTraffic);
  
  return daysNeeded;
}