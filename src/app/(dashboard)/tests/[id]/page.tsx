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
  // データ取得
  const { test, components } = await getTestById(params.id);
  const analysisData = await getAnalysisData(params.id);
  
  return (
    <>
      <TestSummary test={test} />
      <ResultsTable components={components} testResults={test.testResults} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeviceAnalysis testId={test.id} componentIds={test.testedComponents} />
        <AIInsights testId={test.id} />
      </div>
      <ActionButtons testId={test.id} components={components} results={test.testResults} />
    </>
  );
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