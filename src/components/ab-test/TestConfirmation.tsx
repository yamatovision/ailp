'use client';

import { useState } from 'react';
import { useTest } from './TestContext';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// コンバージョン目標のマッピング
const conversionGoalNames: Record<string, string> = {
  form_submit: 'フォーム送信',
  button_click: 'ボタンクリック',
  page_view: 'ページ閲覧時間',
  scroll_depth: 'スクロール深度',
};

// コンポーネント名のマッピング
const componentNames: Record<string, string> = {
  hero: 'ヒーローセクション',
  features: '機能紹介',
  benefits: 'メリット',
  pricing: '料金プラン',
  cta: '行動喚起',
  testimonials: '顧客の声',
  faq: 'よくある質問',
  contact: 'お問い合わせ',
  footer: 'フッター',
};

interface ComponentInfo {
  id: string;
  componentType: string;
}

export default function TestConfirmation() {
  const { state, startTest } = useTest();
  const [componentInfo, setComponentInfo] = useState<ComponentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // テスト開始処理
  const handleStartTest = async () => {
    try {
      setLoading(true);
      setError(null);
      await startTest();
      
      // テスト結果ページへリダイレクト
      if (state.testId) {
        router.push(`/dashboard/tests/${state.testId}`);
      } else {
        // 新しく作成されたテストの場合、結果一覧へリダイレクト
        router.push('/dashboard/tests');
      }
    } catch (error) {
      console.error('Test start error:', error);
      setError('テストの開始に失敗しました。設定を確認して再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 必須項目の確認
  const hasRequiredSettings = () => {
    return (
      state.testName.trim() !== '' &&
      state.startDate !== null &&
      state.endDate !== null &&
      state.conversionGoal !== '' &&
      state.testedComponents.length > 0
    );
  };

  // コンポーネント情報を取得
  useState(() => {
    const fetchComponentInfo = async () => {
      try {
        if (state.testedComponents.length === 0) return;
        
        const response = await fetch(`/api/lp/${state.projectId}/components?ids=${state.testedComponents.join(',')}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch component info');
        }
        
        const data = await response.json();
        setComponentInfo(data.components);
      } catch (error) {
        console.error('Error fetching component info:', error);
      }
    };
    
    fetchComponentInfo();
  });

  // コンポーネント名を取得
  const getComponentName = (componentId: string) => {
    const component = componentInfo.find(c => c.id === componentId);
    return component ? 
      componentNames[component.componentType] || component.componentType : 
      'コンポーネント';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>テスト確認</CardTitle>
        <CardDescription>
          設定内容を確認し、テストを開始します。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 確認リスト */}
        <div className="space-y-4">
          <Alert variant="outline" className="bg-secondary/50">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>テスト基本情報</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                <li><span className="font-medium">テスト名:</span> {state.testName}</li>
                <li>
                  <span className="font-medium">期間:</span> {state.startDate ? 
                    format(state.startDate, 'yyyy年MM月dd日', { locale: ja }) : '未設定'} 〜 
                    {state.endDate ? 
                    format(state.endDate, 'yyyy年MM月dd日', { locale: ja }) : '未設定'}
                </li>
                <li>
                  <span className="font-medium">コンバージョン目標:</span> {
                    conversionGoalNames[state.conversionGoal] || state.conversionGoal
                  }
                </li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <Alert variant="outline" className="bg-secondary/50">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>テスト対象コンポーネント</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {state.testedComponents.map((componentId) => (
                  <li key={componentId}>
                    • {getComponentName(componentId)} (バリアントA/B)
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          
          <Alert variant="outline" className="bg-secondary/50">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>トラフィック配分</AlertTitle>
            <AlertDescription>
              <p className="mt-2">バリアントA:B = 50:50 の均等配分でテストを実施します。</p>
            </AlertDescription>
          </Alert>
          
          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* 注意事項 */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>注意事項</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                <li>• テストは開始後もいつでも一時停止・終了できます</li>
                <li>• 統計的に有意な結果を得るためには、十分なトラフィックが必要です</li>
                <li>• テスト期間中はLP内容の変更を控えることをお勧めします</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline">戻る</Button>
        <Button 
          onClick={handleStartTest}
          disabled={loading || !hasRequiredSettings()}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              処理中...
            </>
          ) : "テストを開始"}
        </Button>
      </CardFooter>
    </Card>
  );
}