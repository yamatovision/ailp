'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyWinner } from '@/lib/api/tests';
import { ILpComponent, ITestResult } from '@/types';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  testId: string;
  components: ILpComponent[];
  results: ITestResult[];
}

export default function ActionButtons({ testId, components, results }: ActionButtonsProps) {
  const router = useRouter();
  const [applying, setApplying] = useState<boolean>(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 勝者があるコンポーネントを抽出
  const componentsWithWinners = components.filter(component => {
    const result = results.find(r => r.componentId === component.id);
    return result?.winningVariant && !result.appliedToProduction;
  });
  
  // すべての勝者をまとめて適用する関数
  const handleApplyAllWinners = async () => {
    if (componentsWithWinners.length === 0) return;
    
    setApplying(true);
    setError(null);
    
    try {
      for (const component of componentsWithWinners) {
        const result = results.find(r => r.componentId === component.id);
        if (result?.winningVariant) {
          setApplyingId(component.id);
          await applyWinner(testId, component.id, result.winningVariant);
        }
      }
      
      router.refresh();
    } catch (error) {
      console.error('勝者適用に失敗しました', error);
      setError('勝者の適用に失敗しました。後でもう一度お試しください。');
    } finally {
      setApplying(false);
      setApplyingId(null);
    }
  };
  
  // 個別コンポーネントの勝者を適用する関数
  const handleApplyWinner = async (componentId: string) => {
    const result = results.find(r => r.componentId === componentId);
    if (!result?.winningVariant) return;
    
    setApplying(true);
    setApplyingId(componentId);
    setError(null);
    
    try {
      await applyWinner(testId, componentId, result.winningVariant);
      router.refresh();
    } catch (error) {
      console.error('勝者適用に失敗しました', error);
      setError('勝者の適用に失敗しました。後でもう一度お試しください。');
    } finally {
      setApplying(false);
      setApplyingId(null);
    }
  };
  
  // 新しいテストを作成する関数
  const handleCreateNextTest = () => {
    router.push(`/dashboard/lp/${testId}/test`);
  };
  
  // プレビューを表示する関数
  const handlePreview = () => {
    // 実装予定: プレビューページへの遷移
    router.push(`/dashboard/lp/${testId}/preview`);
  };
  
  // テスト一覧に戻る関数
  const handleBackToList = () => {
    router.push('/dashboard/tests');
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium mb-4">アクション</h2>
      
      <div className="space-y-6">
        {componentsWithWinners.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">勝者の適用</h3>
            <div className="flex flex-wrap gap-2">
              {componentsWithWinners.map(component => (
                <Button
                  key={component.id}
                  variant="outline"
                  onClick={() => handleApplyWinner(component.id)}
                  disabled={applying}
                  className="flex items-center space-x-1"
                >
                  <span>
                    {component.componentType}の勝者を適用
                    {applyingId === component.id && (
                      <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent"></span>
                    )}
                  </span>
                </Button>
              ))}
              
              {componentsWithWinners.length > 1 && (
                <Button
                  variant="default"
                  onClick={handleApplyAllWinners}
                  disabled={applying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <span>
                    すべての勝者を適用
                    {applying && applyingId === null && (
                      <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                    )}
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-medium mb-2">その他のアクション</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateNextTest}
            >
              次のテストを作成
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePreview}
            >
              LP全体をプレビュー
            </Button>
            
            <Button
              variant="outline"
              onClick={handleBackToList}
            >
              テスト一覧に戻る
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}