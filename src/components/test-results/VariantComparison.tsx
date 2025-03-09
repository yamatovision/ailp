/**
 * バリアント比較コンポーネント
 * A/Bテストのバリアント間の比較を視覚的に表示
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { getComponentStats, checkStatisticalSignificance } from '@/lib/api/tracking';
import { ComponentStats } from '@/lib/api/tracking';

interface VariantComparisonProps {
  lpId: string;
  componentId: string;
}

export default function VariantComparison({ lpId, componentId }: VariantComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ComponentStats | null>(null);
  const [significance, setSignificance] = useState<any | null>(null);
  
  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      // コンポーネントの統計情報を取得
      const results = await getComponentStats(lpId, componentId);
      if (results && results.length > 0) {
        setStats(results[0]);
        
        // 統計的有意差を確認
        const sigResult = await checkStatisticalSignificance(lpId, componentId);
        setSignificance(sigResult);
      } else {
        setStats(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching component stats:', err);
      setError('コンポーネントデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 初回データ取得
  useEffect(() => {
    if (lpId && componentId) {
      fetchData();
    }
  }, [lpId, componentId]);
  
  // データローディング中の表示
  if (loading) {
    return (
      <Card className="p-4 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-500">バリアントデータを読み込み中...</p>
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
            onClick={fetchData}
          >
            再読み込み
          </button>
        </div>
      </Card>
    );
  }
  
  // データがない場合の表示
  if (!stats) {
    return (
      <Card className="p-4 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-500">このコンポーネントのデータはまだありません</p>
        </div>
      </Card>
    );
  }
  
  // バリアントの比較データを計算
  const variantA = stats.variantA;
  const variantB = stats.variantB;
  
  // コンバージョン率の差
  const convRateDiff = (variantB.conversionRate - variantA.conversionRate) * 100;
  const isPositiveDiff = convRateDiff > 0;
  
  // 勝者バリアント
  let winnerVariant = null;
  if (significance && significance.isSignificant) {
    winnerVariant = significance.winningVariant;
  }
  
  return (
    <Card className="p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">バリアント比較</h3>
      
      {/* バリアント比較テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">指標</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">バリアントA</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">バリアントB</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">差分</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 訪問数 */}
            <tr>
              <td className="px-4 py-2 text-xs text-gray-600">訪問数</td>
              <td className="px-4 py-2 text-center text-xs">{variantA.views}</td>
              <td className="px-4 py-2 text-center text-xs">{variantB.views}</td>
              <td className="px-4 py-2 text-right text-xs">
                {variantB.views - variantA.views > 0 ? '+' : ''}
                {variantB.views - variantA.views}
              </td>
            </tr>
            
            {/* クリック数 */}
            <tr>
              <td className="px-4 py-2 text-xs text-gray-600">クリック数</td>
              <td className="px-4 py-2 text-center text-xs">{variantA.clicks}</td>
              <td className="px-4 py-2 text-center text-xs">{variantB.clicks}</td>
              <td className="px-4 py-2 text-right text-xs">
                {variantB.clicks - variantA.clicks > 0 ? '+' : ''}
                {variantB.clicks - variantA.clicks}
              </td>
            </tr>
            
            {/* コンバージョン数 */}
            <tr>
              <td className="px-4 py-2 text-xs text-gray-600">コンバージョン数</td>
              <td className="px-4 py-2 text-center text-xs">{variantA.conversions}</td>
              <td className="px-4 py-2 text-center text-xs">{variantB.conversions}</td>
              <td className="px-4 py-2 text-right text-xs">
                {variantB.conversions - variantA.conversions > 0 ? '+' : ''}
                {variantB.conversions - variantA.conversions}
              </td>
            </tr>
            
            {/* コンバージョン率 */}
            <tr>
              <td className="px-4 py-2 text-xs text-gray-600">コンバージョン率</td>
              <td className="px-4 py-2 text-center text-xs">
                {(variantA.conversionRate * 100).toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-center text-xs">
                {(variantB.conversionRate * 100).toFixed(2)}%
              </td>
              <td className={`px-4 py-2 text-right text-xs ${
                isPositiveDiff ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveDiff ? '+' : ''}
                {convRateDiff.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 統計的有意差表示 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-xs font-medium text-gray-600 mb-2">統計分析</h4>
        
        {significance ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">信頼度</span>
              <span className="text-xs font-medium">
                {(significance.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">統計的有意差</span>
              <span className={`text-xs font-medium ${
                significance.isSignificant ? 'text-green-600' : 'text-gray-600'
              }`}>
                {significance.isSignificant ? 'あり' : 'なし'}
              </span>
            </div>
            
            {winnerVariant && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">勝者バリアント</span>
                <span className="text-xs font-medium text-green-600">
                  バリアント{winnerVariant.toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">改善率</span>
              <span className={`text-xs font-medium ${
                stats.improvement > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.improvement > 0 ? '+' : ''}
                {stats.improvement.toFixed(2)}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            十分なデータがないため、統計分析を行えません。
          </p>
        )}
      </div>
      
      {/* 推奨事項 */}
      {significance && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-xs font-medium text-blue-700 mb-1">推奨事項</h4>
          <p className="text-xs text-blue-600">
            {significance.isSignificant ? (
              <>
                バリアント{significance.winningVariant.toUpperCase()}は統計的に有意な結果を示しています。
                このバリアントを本番環境に適用することを推奨します。
              </>
            ) : significance.confidence > 0.8 ? (
              <>
                統計的有意差はまだ確認できませんが、有意差に近づいています。
                もう少しデータを収集してから判断することをお勧めします。
              </>
            ) : (
              <>
                まだ十分なデータが集まっていないか、バリアント間に明確な差がありません。
                テストを継続してデータを収集してください。
              </>
            )}
          </p>
        </div>
      )}
      
      {/* 更新ボタン */}
      <div className="mt-4 text-center">
        <button
          className="text-xs text-blue-500 hover:underline"
          onClick={fetchData}
        >
          データを更新
        </button>
      </div>
    </Card>
  );
}