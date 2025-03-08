'use client';

import { useState, useEffect } from 'react';
import { getDeviceData } from '@/lib/api/analysis';

interface DeviceAnalysisProps {
  testId: string;
  componentIds: string[];
}

interface DeviceData {
  desktop: {
    variantA: { visitors: number; conversions: number; conversionRate: number };
    variantB: { visitors: number; conversions: number; conversionRate: number };
    improvement: number;
    winner: string | null;
  };
  mobile: {
    variantA: { visitors: number; conversions: number; conversionRate: number };
    variantB: { visitors: number; conversions: number; conversionRate: number };
    improvement: number;
    winner: string | null;
  };
}

export default function DeviceAnalysis({ testId, componentIds = [] }: DeviceAnalysisProps) {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string>(componentIds[0] || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!selectedComponent) {
      if (componentIds.length > 0) {
        setSelectedComponent(componentIds[0]);
      }
      return;
    }
    
    async function fetchDeviceData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDeviceData(selectedComponent);
        setDeviceData(data);
      } catch (error) {
        console.error('デバイス別データの取得に失敗しました', error);
        setError('デバイス別データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDeviceData();
  }, [selectedComponent, componentIds]);
  
  const renderVariantData = (
    variantType: string,
    data: { visitors: number; conversions: number; conversionRate: number }
  ) => (
    <div className="bg-white p-3 rounded border">
      <h4 className="text-sm font-medium mb-1">バリアント{variantType}</h4>
      <div className="space-y-1 text-sm">
        <p>訪問: {data.visitors}</p>
        <p>CV数: {data.conversions}</p>
        <p>CV率: {data.conversionRate.toFixed(2)}%</p>
      </div>
    </div>
  );
  
  const renderDeviceSection = (
    deviceType: 'desktop' | 'mobile',
    data: {
      variantA: { visitors: number; conversions: number; conversionRate: number };
      variantB: { visitors: number; conversions: number; conversionRate: number };
      improvement: number;
      winner: string | null;
    }
  ) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-md font-medium mb-3">
        {deviceType === 'desktop' ? 'デスクトップ' : 'モバイル'}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {renderVariantData('A', data.variantA)}
        {renderVariantData('B', data.variantB)}
      </div>
      
      <div className="mt-3 space-y-1">
        <p className={`text-sm font-medium ${data.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
          改善率: {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(2)}%
        </p>
        
        {data.winner && (
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              data.winner === 'a' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              勝者: バリアント{data.winner.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">デバイス別分析</h2>
        <select 
          value={selectedComponent}
          onChange={(e) => setSelectedComponent(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
          disabled={loading || componentIds.length === 0}
        >
          {componentIds.length === 0 ? (
            <option value="">コンポーネントなし</option>
          ) : (
            componentIds.map(id => (
              <option key={id} value={id}>{id.substring(0, 8)}...</option>
            ))
          )}
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-pulse text-gray-500">データを読み込み中...</div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-48 text-red-500">
          {error}
        </div>
      ) : deviceData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDeviceSection('desktop', deviceData.desktop)}
            {renderDeviceSection('mobile', deviceData.mobile)}
          </div>
          
          <div className="text-sm text-gray-500 mt-4">
            <p className="mb-1">※ デバイス別の結果は、ユーザーのデバイスタイプに基づいて集計されています</p>
            <p>※ コンポーネントを選択して、各コンポーネントのデバイス別データを確認できます</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-48 text-gray-500">
          デバイス別データがありません
        </div>
      )}
    </div>
  );
}