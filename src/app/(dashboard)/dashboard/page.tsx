'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText, PieChart, Users } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLP } from '@/lib/api/lp';
import { useToast } from '@/components/ui/use-toast';

export const metadata: Metadata = {
  title: 'ダッシュボード - 多変量テストLP作成システム',
  description: 'LPの管理、テスト結果の確認、会員管理などができます。',
};

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // AIビルダーで直接作成
  const createWithAI = async () => {
    try {
      setIsCreating(true);
      
      // 仮のタイトルでLPを作成
      const newLP = await createLP({
        title: '新規AI作成LP',
        description: 'AIビルダーで作成中のLP',
        status: 'draft',
        thumbnail: null,
      });

      toast({
        title: 'LP作成開始',
        description: 'AIビルダーでLPを作成します',
      });

      // 直接生成フェーズに移行
      router.push(`/lp/${newLP.id}/edit/generate`);
    } catch (error) {
      console.error('LP作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'LPの作成に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <Button 
            className="bg-[#3f51b5] hover:bg-[#4a5dc7]"
            onClick={createWithAI}
            disabled={isCreating}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {isCreating ? '作成中...' : '新規LP作成'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-0">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#3f51b5] to-[#5c6bc0] text-white">
            <CardTitle className="text-xl">LP管理</CardTitle>
            <CardDescription className="text-gray-100">
              ランディングページの作成・編集・管理
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-bold text-[#3f51b5]">0</div>
            <p className="text-xs text-muted-foreground">登録済みLP</p>
          </CardContent>
          <CardFooter>
            <Link href="/lp" className="w-full">
              <Button variant="outline" className="w-full border-[#3f51b5] text-[#3f51b5] hover:bg-[#3f51b5] hover:text-white">
                <FileText className="mr-2 h-4 w-4" />
                LP一覧を見る
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="overflow-hidden border-0">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#f50057] to-[#ff4081] text-white">
            <CardTitle className="text-xl">テスト結果</CardTitle>
            <CardDescription className="text-gray-100">
              A/Bテストの結果確認と分析
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-bold text-[#f50057]">0</div>
            <p className="text-xs text-muted-foreground">実施済みテスト</p>
          </CardContent>
          <CardFooter>
            <Link href="/tests" className="w-full">
              <Button variant="outline" className="w-full border-[#f50057] text-[#f50057] hover:bg-[#f50057] hover:text-white">
                <PieChart className="mr-2 h-4 w-4" />
                テスト結果を見る
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="overflow-hidden border-0">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#4caf50] to-[#66bb6a] text-white">
            <CardTitle className="text-xl">会員管理</CardTitle>
            <CardDescription className="text-gray-100">
              ユーザーアカウントの管理
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-bold text-[#4caf50]">0</div>
            <p className="text-xs text-muted-foreground">登録ユーザー</p>
          </CardContent>
          <CardFooter>
            <Link href="/members" className="w-full">
              <Button variant="outline" className="w-full border-[#4caf50] text-[#4caf50] hover:bg-[#4caf50] hover:text-white">
                <Users className="mr-2 h-4 w-4" />
                会員一覧を見る
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0">
          <CardHeader className="border-b bg-[#f5f7fa]">
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>
              最近の操作履歴と更新情報
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm font-medium">データがありません</p>
                <p className="text-xs text-muted-foreground">
                  まだアクティビティの記録がありません。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="border-b bg-[#f5f7fa]">
            <CardTitle>クイックガイド</CardTitle>
            <CardDescription>
              システムを効果的に使うためのヒント
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm font-medium">1. LP作成の流れ</p>
                <p className="text-xs text-muted-foreground">
                  「新規LP作成」ボタンからAIガイドに従ってLPを作成します。
                </p>
              </div>
              <div className="border-b pb-4">
                <p className="text-sm font-medium">2. テスト設定</p>
                <p className="text-xs text-muted-foreground">
                  作成したLPに対してA/Bテストを設定・実施できます。
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">3. 結果分析</p>
                <p className="text-xs text-muted-foreground">
                  テスト結果から最適なLP要素を選択し、改善できます。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}