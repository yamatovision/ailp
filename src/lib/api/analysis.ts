/**
 * テスト分析関連のAPI呼び出し関数
 */

/**
 * テスト全体の分析データを取得する
 * @param testId テストID
 * @returns 分析結果データ
 */
export async function getAnalysisData(testId: string) {
  const response = await fetch(`/api/analysis?testId=${encodeURIComponent(testId)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '分析データの取得に失敗しました');
  }
  
  const { data } = await response.json();
  return data;
}

/**
 * コンポーネントのデバイス別データを取得する
 * @param componentId コンポーネントID
 * @returns デバイス別分析データ
 */
export async function getDeviceData(componentId: string) {
  const response = await fetch(`/api/analysis/device-data/${componentId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'デバイス別データの取得に失敗しました');
  }
  
  const { data } = await response.json();
  return data;
}

/**
 * テストのセクション横断分析データを取得する
 * @param testId テストID
 * @returns 横断分析データとAIインサイト
 */
export async function getCrossSectionAnalysis(testId: string) {
  const response = await fetch(`/api/analysis/cross-section?testId=${encodeURIComponent(testId)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '横断分析データの取得に失敗しました');
  }
  
  const { data } = await response.json();
  return data;
}