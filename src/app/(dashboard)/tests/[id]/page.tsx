import { Suspense } from 'react';
import { getTestById } from '@/lib/api/tests';
import { getAnalysisData } from '@/lib/api/analysis';
import TestSummary from '@/components/test-results/TestSummary';
import ResultsTable from '@/components/test-results/ResultsTable';
import DeviceAnalysis from '@/components/test-results/DeviceAnalysis';
import ActionButtons from '@/components/test-results/ActionButtons';
import AIInsights from '@/components/test-results/AIInsights';

// ローディングコンポーネント
function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 bg-gray-200 rounded-lg"></div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-52 bg-gray-200 rounded-lg"></div>
        <div className="h-52 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-24 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

async function TestResultContent({ params }: { params: { id: string } }) {
  try {
    // 実際のAPIからデータを取得
    const { test, components } = await getTestById(params.id);
    
    try {
      // 表示情報を出力 (デバッグ用)
      console.log('テスト情報取得成功:', { 
        id: test.id, 
        name: test.name,
        status: test.status,
        resultsCount: test.testResults?.length || 0
      });
    } catch (logError) {
      // ログエラーは無視
    }
    
    return (
      <>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-md text-blue-700">
            <p className="text-sm">実際のデータベースから取得したデータを表示しています (テストID: {params.id})</p>
          </div>
        )}
        <TestSummary test={test} />
        <ResultsTable components={components} testResults={test.testResults || []} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DeviceAnalysis testId={test.id} componentIds={test.testedComponents as string[]} />
          <AIInsights testId={test.id} />
        </div>
        <ActionButtons testId={test.id} components={components} results={test.testResults || []} />
      </>
    );
  } catch (error) {
    console.error('テスト詳細の取得に失敗しました:', error);
    
    // エラー時はダミーデータにフォールバック
    const dummyTest = {
      id: params.id,
      name: 'サンプルテスト' + params.id.charAt(0).toUpperCase(),
      description: 'ヘッダーとCTAボタンのA/Bテスト',
      status: 'completed',
      startDate: '2025-03-01',
      endDate: '2025-03-15',
      visitorCount: 3375,
      conversionCount: 168,
      conversionRate: 0.0498,
      improvementRate: 0.124,
      conversionGoal: 'button_click',
      testedComponents: ['header', 'hero', 'features', 'cta'],
      testResults: [
        {
          id: 'res1',
          componentId: 'header',
          variantAData: { visitors: 1688, conversions: 82 },
          variantBData: { visitors: 1687, conversions: 86 },
          improvement: 4.9,
          confidence: 98.2,
          isSignificant: true,
          winningVariant: 'b',
          appliedToProduction: true
        },
        {
          id: 'res2',
          componentId: 'hero',
          variantAData: { visitors: 1688, conversions: 75 },
          variantBData: { visitors: 1687, conversions: 83 },
          improvement: 10.8,
          confidence: 92.5,
          isSignificant: false,
          winningVariant: 'b',
          appliedToProduction: false
        },
        {
          id: 'res3',
          componentId: 'features',
          variantAData: { visitors: 1688, conversions: 79 },
          variantBData: { visitors: 1687, conversions: 77 },
          improvement: -2.6,
          confidence: 18.4,
          isSignificant: false,
          winningVariant: null,
          appliedToProduction: false
        },
        {
          id: 'res4',
          componentId: 'cta',
          variantAData: { visitors: 1688, conversions: 72 },
          variantBData: { visitors: 1687, conversions: 89 },
          improvement: 23.7,
          confidence: 99.1,
          isSignificant: true,
          winningVariant: 'b',
          appliedToProduction: false
        }
      ]
    };
    
    const dummyComponents = [
      { id: 'header', componentType: 'ヘッダー', variantA: 'オリジナル', variantB: '新デザイン' },
      { id: 'hero', componentType: 'ヒーローセクション', variantA: 'オリジナル', variantB: '新コピー' },
      { id: 'features', componentType: '機能紹介', variantA: '3カラム', variantB: '2カラム大きめ' },
      { id: 'cta', componentType: 'CTAボタン', variantA: '青色・角丸', variantB: '緑色・シャープ' }
    ];
    
    return (
      <>
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md text-amber-700">
          <p className="text-sm">APIエラー: データの取得に失敗したため、ダミーデータを表示しています (テストID: {params.id})</p>
        </div>
        <TestSummary test={dummyTest} />
        <ResultsTable components={dummyComponents} testResults={dummyTest.testResults} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DeviceAnalysis testId={dummyTest.id} componentIds={dummyTest.testedComponents as string[]} />
          <AIInsights testId={dummyTest.id} />
        </div>
        <ActionButtons testId={dummyTest.id} components={dummyComponents} results={dummyTest.testResults} />
      </>
    );
  }
}

export default function TestResultPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">テスト結果分析</h1>
      <Suspense fallback={<LoadingState />}>
        <TestResultContent params={params} />
      </Suspense>
    </div>
  );
}