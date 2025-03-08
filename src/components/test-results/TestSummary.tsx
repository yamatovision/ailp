import { ITestSetting, ITestResult } from '@/types';

interface TestSummaryProps {
  test: ITestSetting & { testResults: ITestResult[] };
}

export default function TestSummary({ test }: TestSummaryProps) {
  // テスト結果から集計データを計算
  const latestResult = test.testResults[0];
  const totalVisitors = test.testResults.reduce((sum, result) => 
    sum + (result.variantAData?.visitors || 0) + (result.variantBData?.visitors || 0), 0);
  const totalConversions = test.testResults.reduce((sum, result) => 
    sum + (result.variantAData?.conversions || 0) + (result.variantBData?.conversions || 0), 0);
  const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
  const averageImprovement = test.testResults.reduce((sum, result) => 
    sum + (result.improvement || 0), 0) / (test.testResults.length || 1);
  
  // テスト状態の判断
  const statusLabel = {
    active: "実行中",
    paused: "一時停止",
    completed: "完了",
    draft: "下書き"
  }[test.status] || test.status;
  
  // ステータスに応じた背景色
  const statusColor = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    draft: "bg-gray-100 text-gray-800"
  }[test.status] || "bg-gray-100 text-gray-800";
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{test.name}</h1>
          <p className="text-gray-500 mt-1">
            {test.startDate && new Date(test.startDate).toLocaleDateString()} 
            {test.endDate && ` 〜 ${new Date(test.endDate).toLocaleDateString()}`}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${statusColor}`}>
          {statusLabel}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm">総訪問者数</div>
          <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm">総コンバージョン数</div>
          <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm">平均コンバージョン率</div>
          <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm">平均改善率</div>
          <div className={`text-2xl font-bold ${averageImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {averageImprovement > 0 ? '+' : ''}{averageImprovement.toFixed(2)}%
          </div>
        </div>
      </div>
      
      {test.conversionGoal && (
        <div className="mt-4 text-sm text-gray-600">
          <strong>コンバージョン目標:</strong> {test.conversionGoal}
        </div>
      )}
    </div>
  );
}