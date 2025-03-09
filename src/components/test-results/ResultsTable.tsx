'use client';

import { useState } from 'react';
import { ILpComponent, ITestResult } from '@/types';

interface ResultsTableProps {
  components: ILpComponent[];
  testResults: ITestResult[];
}

export default function ResultsTable({ components, testResults }: ResultsTableProps) {
  const [sortColumn, setSortColumn] = useState<'component' | 'improvement' | 'confidence'>('improvement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // ソート用の関数
  const handleSort = (column: 'component' | 'improvement' | 'confidence') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // componentとテスト結果をマージしてソート
  const sortedResults = components
    .map(component => {
      const result = testResults.find(r => r.componentId === component.id);
      return { component, result };
    })
    .sort((a, b) => {
      if (sortColumn === 'component') {
        return sortDirection === 'asc' 
          ? a.component.componentType.localeCompare(b.component.componentType) 
          : b.component.componentType.localeCompare(a.component.componentType);
      }
      if (sortColumn === 'improvement') {
        const valueA = a.result?.improvement || 0;
        const valueB = b.result?.improvement || 0;
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      if (sortColumn === 'confidence') {
        const valueA = a.result?.confidence || 0;
        const valueB = b.result?.confidence || 0;
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return 0;
    });
  
  // ソートアイコン表示用関数
  const renderSortIcon = (column: 'component' | 'improvement' | 'confidence') => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">コンポーネント別テスト結果</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('component')}
              >
                コンポーネント{renderSortIcon('component')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                バリアントA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                バリアントB
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('improvement')}
              >
                改善率{renderSortIcon('improvement')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('confidence')}
              >
                信頼度{renderSortIcon('confidence')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                勝者
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map(({ component, result }) => (
              <tr key={component.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{component.componentType}</div>
                  <div className="text-xs text-gray-500">ID: {component.id.substring(0, 8)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result?.variantAData ? (
                    <div className="text-sm text-gray-900">
                      <div>訪問: {result.variantAData.visitors}</div>
                      <div>CV: {result.variantAData.conversions}</div>
                      <div>CV率: {((result.variantAData.conversions / result.variantAData.visitors) * 100).toFixed(2)}%</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result?.variantBData ? (
                    <div className="text-sm text-gray-900">
                      <div>訪問: {result.variantBData.visitors}</div>
                      <div>CV: {result.variantBData.conversions}</div>
                      <div>CV率: {((result.variantBData.conversions / result.variantBData.visitors) * 100).toFixed(2)}%</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result?.improvement !== undefined ? (
                    <div className={`text-sm font-medium ${result.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(2)}%
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result?.confidence !== undefined ? (
                    <div className="text-sm text-gray-900">
                      {result.confidence.toFixed(1)}%
                      {result.isSignificant && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          有意
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result?.winningVariant ? (
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.winningVariant === 'a' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      バリアント{result.winningVariant.toUpperCase()}
                      {result.appliedToProduction && (
                        <span className="ml-1">✓</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">判定中</div>
                  )}
                </td>
              </tr>
            ))}
            
            {sortedResults.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  テスト結果がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
        <p>※ 信頼度が95%以上で統計的に有意と判定されます</p>
        <p>※ 勝者はコンバージョン率とサンプル数に基づいて判定されます</p>
      </div>
    </div>
  );
}