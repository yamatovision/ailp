'use client';

import { useState, useEffect } from 'react';
import { getCrossSectionAnalysis } from '@/lib/api/analysis';

interface AIInsightsProps {
  testId: string;
}

interface InsightData {
  patternAnalysis: string;
  patterns: string[];
  recommendations: string;
}

export default function AIInsights({ testId }: AIInsightsProps) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  
  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getCrossSectionAnalysis(testId);
        setInsights(data);
      } catch (error) {
        console.error('AI分析データの取得に失敗しました', error);
        setError('AI分析データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInsights();
  }, [testId]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">AI分析インサイト</h2>
        {insights && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expanded ? '折りたたむ' : '詳細を表示'}
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500">AI分析を実行中...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-48 text-red-500">
          {error}
        </div>
      ) : insights ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-md font-medium text-blue-800 mb-2">主要なインサイト</h3>
            <p className="text-sm text-gray-800">{insights.patternAnalysis}</p>
          </div>
          
          {expanded && (
            <>
              {insights.patterns && insights.patterns.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-2">効果的なパターン</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-sm text-gray-700">
                    {insights.patterns.map((pattern, index) => (
                      <li key={index}>{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insights.recommendations && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-md font-medium text-green-800 mb-2">次のテストへの推奨事項</h3>
                  <p className="text-sm text-gray-800">{insights.recommendations}</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-48 text-gray-500">
          <div className="text-center">
            <p>AIインサイトデータがありません</p>
            <p className="text-xs mt-2">十分なテストデータが収集された後に表示されます</p>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>※ AI分析は収集されたテストデータに基づいて生成されます</p>
        <p>※ より精度の高い分析には十分なサンプル数が必要です</p>
      </div>
    </div>
  );
}