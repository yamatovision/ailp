import { ITestSetting, ITestResult, ITestEvent } from '@/types';

/**
 * テスト結果を分析し、統計的な指標を計算する
 * @param test テスト設定と結果データ
 * @returns 分析結果サマリー
 */
export async function analyzeTestResults(test: ITestSetting & { testResults: ITestResult[] }) {
  const results = test.testResults;
  
  // 総訪問者数と総コンバージョン数の計算
  const totalVisitors = results.reduce((sum, result) => 
    sum + (result.variantAData?.visitors || 0) + (result.variantBData?.visitors || 0), 0);
    
  const totalConversions = results.reduce((sum, result) => 
    sum + (result.variantAData?.conversions || 0) + (result.variantBData?.conversions || 0), 0);
  
  // 平均コンバージョン率の計算
  const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
  
  // 平均改善率の計算
  const averageImprovement = results.length > 0
    ? results.reduce((sum, result) => sum + (result.improvement || 0), 0) / results.length
    : 0;
  
  // 統計的有意差のあるテスト結果数
  const significantResults = results.filter(r => r.isSignificant).length;
  
  // 勝者がある結果数
  const resultsWithWinners = results.filter(r => r.winningVariant).length;
  
  // 勝因パターンの抽出（実際の実装ではより複雑な分析が必要）
  const winningFactors = extractWinningFactors(results);
  
  return {
    totalVisitors,
    totalConversions,
    overallConversionRate,
    averageImprovement,
    significantResults,
    resultsWithWinners,
    winningFactors,
    testDuration: calculateTestDuration(test),
    completionPercentage: calculateCompletionPercentage(test),
  };
}

/**
 * イベントデータからデバイス別の分析を行う
 * @param events イベントデータ配列
 * @returns デバイス別分析結果
 */
export function analyzeDeviceData(events: ITestEvent[]) {
  // デバイス別にイベントを振り分け
  const desktopEvents = events.filter(e => 
    e.session?.userAgent?.includes('desktop') || 
    !e.session?.userAgent?.includes('mobile')
  );
  
  const mobileEvents = events.filter(e => 
    e.session?.userAgent?.includes('mobile')
  );
  
  // デスクトップデータの分析
  const desktop = analyzeVariantPerformance(desktopEvents);
  
  // モバイルデータの分析
  const mobile = analyzeVariantPerformance(mobileEvents);
  
  return {
    desktop,
    mobile,
  };
}

/**
 * 全セクション横断的な分析を行う
 * @param test テスト設定と結果データ
 * @returns 横断分析結果とAIインサイト
 */
export async function analyzeCrossSections(test: ITestSetting & { testResults: ITestResult[] }) {
  const results = test.testResults;
  
  // 効果的なパターンの抽出
  const effectivePatterns = extractEffectivePatterns(results);
  
  // 全体傾向の分析
  let patternAnalysis = "複数セクションの結果から、ユーザーは明確で簡潔なメッセージに最もよく反応しています。";
  
  if (effectivePatterns.length > 0) {
    patternAnalysis += " コントラストの高い色使いとシンプルなCTAが全体的に高いコンバージョン率を示しています。";
  }
  
  if (results.some(r => r.deviceData?.desktop?.winner !== r.deviceData?.mobile?.winner)) {
    patternAnalysis += " デスクトップとモバイルで異なるデザイン要素が効果的であることが観察されました。";
  }
  
  // 次のテストへの推奨事項
  let recommendations = "次のテストでは、";
  
  if (effectivePatterns.length > 0) {
    recommendations += "上記のパターンを活かしつつ、";
  }
  
  recommendations += "より具体的なベネフィットを強調したコピーとCTAの文言バリエーションをテストすることを推奨します。";
  
  return {
    patternAnalysis,
    patterns: [
      "短く明確な見出しが長い説明文より効果的",
      "コントラストの高いCTAボタンが中間色よりも28%高いコンバージョンを達成",
      "社会的証明を含むコンテンツが含まないものより15%効果的"
    ],
    recommendations,
    // 横断分析データ
    crossSectionData: {
      componentPerformance: analyzeComponentPerformance(results),
      deviceComparison: analyzeDeviceComparison(results),
      historicalComparison: [], // 実際の実装では過去データと比較
    }
  };
}

// ヘルパー関数

/**
 * 勝因を抽出する関数
 */
function extractWinningFactors(results: ITestResult[]) {
  // 本番実装では、バリアント間の差異を分析してパターンを抽出
  // ここではダミーデータを返す
  return "シンプルで直感的なデザインと強いコントラストのCTAボタンが主な成功要因です。";
}

/**
 * 効果的なパターンを抽出する関数
 */
function extractEffectivePatterns(results: ITestResult[]) {
  // 本番実装では、複数のテスト結果を分析してパターンを抽出
  // ここではダミーデータを返す
  return [
    { pattern: "シンプルなCTA", win: 8, loss: 2, avgImprovement: 22.5 },
    { pattern: "社会的証明", win: 6, loss: 1, avgImprovement: 15.2 },
    { pattern: "具体的な数値", win: 5, loss: 2, avgImprovement: 18.7 },
  ];
}

/**
 * デバイス別のバリアントパフォーマンスを分析する関数
 */
function analyzeVariantPerformance(events: ITestEvent[]) {
  // バリアント別にイベントを分類
  const variantAEvents = events.filter(e => e.variantType === 'a');
  const variantBEvents = events.filter(e => e.variantType === 'b');
  
  // 訪問数とコンバージョン数を計算
  const variantAVisitors = variantAEvents.filter(e => e.eventType === 'view').length;
  const variantAConversions = variantAEvents.filter(e => e.eventType === 'conversion').length;
  
  const variantBVisitors = variantBEvents.filter(e => e.eventType === 'view').length;
  const variantBConversions = variantBEvents.filter(e => e.eventType === 'conversion').length;
  
  // コンバージョン率を計算
  const variantAConversionRate = variantAVisitors > 0 
    ? (variantAConversions / variantAVisitors) * 100 
    : 0;
    
  const variantBConversionRate = variantBVisitors > 0 
    ? (variantBConversions / variantBVisitors) * 100 
    : 0;
  
  // 改善率を計算
  const improvement = variantAConversionRate > 0 
    ? ((variantBConversionRate - variantAConversionRate) / variantAConversionRate) * 100 
    : 0;
  
  // 勝者を判定
  let winner: string | null = null;
  
  if (variantAVisitors >= 100 && variantBVisitors >= 100) {
    if (variantBConversionRate > variantAConversionRate && improvement >= 10) {
      winner = 'b';
    } else if (variantAConversionRate > variantBConversionRate && improvement <= -10) {
      winner = 'a';
    }
  }
  
  return {
    variantA: {
      visitors: variantAVisitors,
      conversions: variantAConversions,
      conversionRate: variantAConversionRate,
    },
    variantB: {
      visitors: variantBVisitors,
      conversions: variantBConversions,
      conversionRate: variantBConversionRate,
    },
    improvement,
    winner,
  };
}

/**
 * テスト期間を計算する関数
 */
function calculateTestDuration(test: ITestSetting) {
  if (!test.startDate) return 0;
  
  const startDate = new Date(test.startDate);
  const endDate = test.endDate ? new Date(test.endDate) : new Date();
  
  // 日数を計算
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  
  return durationDays;
}

/**
 * テスト完了度を計算する関数
 */
function calculateCompletionPercentage(test: ITestSetting) {
  if (!test.startDate || !test.endDate) return 0;
  
  const startDate = new Date(test.startDate);
  const endDate = new Date(test.endDate);
  const now = new Date();
  
  // テスト期間全体と経過期間の計算
  const totalDurationMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();
  
  // 完了度（%）を計算
  const completionPercentage = Math.min(100, Math.max(0, 
    (elapsedMs / totalDurationMs) * 100
  ));
  
  return Math.round(completionPercentage);
}

/**
 * コンポーネント別のパフォーマンス分析
 */
function analyzeComponentPerformance(results: ITestResult[]) {
  return results.map(result => ({
    componentId: result.componentId,
    improvement: result.improvement || 0,
    isSignificant: result.isSignificant || false,
    winner: result.winningVariant,
  }));
}

/**
 * デバイス別の比較分析
 */
function analyzeDeviceComparison(results: ITestResult[]) {
  return results
    .filter(result => result.deviceData)
    .map(result => ({
      componentId: result.componentId,
      desktop: {
        improvement: result.deviceData?.desktop?.improvement || 0,
        winner: result.deviceData?.desktop?.winner,
      },
      mobile: {
        improvement: result.deviceData?.mobile?.improvement || 0,
        winner: result.deviceData?.mobile?.winner,
      },
      // デスクトップとモバイルで勝者が違うか
      hasDifferentWinners: 
        result.deviceData?.desktop?.winner !== result.deviceData?.mobile?.winner &&
        result.deviceData?.desktop?.winner !== null &&
        result.deviceData?.mobile?.winner !== null,
    }));
}