'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Award, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTests } from '@/lib/api/tests';

// テストの状態に応じたバッジの色を返す関数
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'running':
      return <Badge className="bg-green-500">実行中</Badge>;
    case 'completed':
      return <Badge className="bg-blue-500">完了</Badge>;
    case 'scheduled':
      return <Badge className="bg-yellow-500">予定</Badge>;
    case 'draft':
      return <Badge className="bg-gray-500">下書き</Badge>;
    default:
      return <Badge className="bg-gray-500">{status}</Badge>;
  }
};

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 実際のAPIからデータを取得
        const testsData = await getTests();
        console.log('取得したテストデータ:', testsData);
        
        // 正しい形式のデータを抽出
        if (testsData && typeof testsData === 'object' && 'tests' in testsData) {
          setTests(Array.isArray(testsData.tests) ? testsData.tests : []);
        } else {
          setTests([]);
          setError('テストデータの形式が正しくありません');
        }
      } catch (err) {
        console.error('テスト一覧の取得に失敗しました:', err);
        setError('テストの取得に失敗しました。後でもう一度お試しください。');
        
        // エラー時はダミーデータにフォールバック
        const dummyTests = [
          {
            id: '1',
            name: 'サンプルテストA',
            description: 'ヘッダーとCTAボタンのA/Bテスト',
            status: 'running',
            startDate: '2025-03-01',
            endDate: '2025-03-15',
            visitorCount: 1245,
            conversionRate: 0.052,
            improvementRate: 0.124,
          },
          {
            id: '2',
            name: 'サンプルテストB',
            description: 'お客様の声セクションのA/Bテスト',
            status: 'completed',
            startDate: '2025-02-01',
            endDate: '2025-02-15',
            visitorCount: 2130,
            conversionRate: 0.068,
            improvementRate: 0.215,
          },
          {
            id: '3',
            name: 'サンプルテストC',
            description: '価格表示方法のA/Bテスト',
            status: 'scheduled',
            startDate: '2025-03-20',
            endDate: '2025-04-05',
            visitorCount: 0,
            conversionRate: 0,
            improvementRate: 0,
          }
        ];
        
        setTests(dummyTests);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">テスト結果</h1>
        <div className="flex justify-center items-center min-h-[300px]">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示は必要なくなったので削除

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">テスト結果</h1>
      </div>
      
      {error ? (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md text-amber-700">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p className="text-sm">
              {error} <br />
              <span className="text-xs opacity-80">フォールバックとしてダミーデータを表示しています</span>
            </p>
          </div>
        </div>
      ) : tests.length > 0 && process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-md text-blue-700">
          <div className="flex items-center">
            <p className="text-sm">
              実際のデータベースから取得したテスト一覧を表示しています
            </p>
          </div>
        </div>
      )}

      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-lg p-10">
          <p className="text-gray-500 mb-4">まだテストがありません</p>
          <p className="text-gray-400 text-sm mb-6">LPのテストを作成して結果を確認しましょう</p>
          <Button asChild>
            <Link href="/lp">LP管理へ</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card key={test.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{test.name || 'テスト'}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
                <CardDescription className="line-clamp-2">
                  {test.description || 'テストの説明'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">訪問者数</span>
                    <span className="font-medium">{test.visitorCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">コンバージョン</span>
                    <span className="font-medium">{test.conversionRate ? `${(test.conversionRate * 100).toFixed(2)}%` : '0.00%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">改善率</span>
                    <span className={`font-medium ${test.improvementRate > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {test.improvementRate ? `${(test.improvementRate * 100).toFixed(2)}%` : '0.00%'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between border-t">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {test.startDate ? new Date(test.startDate).toLocaleDateString('ja-JP') : '未開始'}
                    {test.endDate ? ` - ${new Date(test.endDate).toLocaleDateString('ja-JP')}` : ''}
                  </span>
                </div>
                <Button variant="link" asChild className="p-0 h-auto">
                  <Link href={`/tests/${test.id}`} className="flex items-center text-blue-600">
                    詳細を見る <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}