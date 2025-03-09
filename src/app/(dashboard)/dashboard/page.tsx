'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText, PieChart, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLP } from '@/lib/api/lp';
import { useToast } from '@/components/ui/use-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  // セッション検証用（useEffectを使用して適切なタイミングで実行）
  useEffect(() => {
    // クライアント側のみで実行
    if (typeof window !== 'undefined') {
      const authVerified = localStorage.getItem('auth_verified');
      
      // 認証検証フラグが存在すればクリア
      if (authVerified) {
        localStorage.removeItem('auth_verified');
      }
    }
  }, []);

  // LP作成処理（リダイレクトなし）
  const createLP_NoRedirect = async () => {
    console.log('【デバッグ】LP作成処理（リダイレクトなし）を開始');
    try {
      setIsCreating(true);
      
      // 新規LPを作成
      const newLP = await createLP({
        title: '新規LP',
        description: 'AIビルダーで作成中のLP',
        status: 'draft',
        thumbnail: null,
      });
      
      // ID生成の確認
      if (!newLP || !newLP.id) {
        throw new Error('LP IDが生成されませんでした');
      }
      
      console.log('【デバッグ】LP作成成功。ID:', newLP.id);
      
      // トースト表示
      toast({
        title: 'LP作成完了',
        description: `LP「${newLP.title}」の作成が完了しました。編集画面に移動します。`,
      });
      
      // 生成されたLPのIDを返す（リダイレクトはこの関数の外で行う）
      return newLP.id;
    } catch (error) {
      console.error('【デバッグ】LP作成エラー詳細:', error);
      toast({
        title: 'エラー',
        description: 'LPの作成に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
      setIsCreating(false);
      throw error; // エラーを上位に伝播させる
    }
  };
  
  // 明示的なリダイレクト処理
  const redirectToEditGenerate = (lpId) => {
    console.log('【デバッグ】リダイレクト関数が呼び出されました。lpId:', lpId);
    
    try {
      // リダイレクト先のURL
      const redirectUrl = `/lp/${lpId}/edit/generate`;
      console.log('【デバッグ】リダイレクト先URL:', redirectUrl);
      
      // HTMLページ作成による強制リダイレクト
      document.open();
      document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          <title>リダイレクト中...</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3f51b5; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-right: 15px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .container { text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="display: flex; align-items: center; justify-content: center;">
              <div class="loader"></div>
              <div>リダイレクト中...</div>
            </div>
            <p>自動的に移動しない場合は、<a href="${redirectUrl}">こちらをクリック</a>してください。</p>
          </div>
          <script>
            console.log("リダイレクトページがロードされました");
            setTimeout(function() {
              window.location.href = "${redirectUrl}";
            }, 100);
          </script>
        </body>
        </html>
      `);
      document.close();
    } catch (error) {
      console.error('【デバッグ】リダイレクト処理中のエラー:', error);
      // 通常のリダイレクトにフォールバック
      window.location.href = `/lp/${lpId}/edit/generate`;
    }
  };
  
  // メインのLP作成処理（作成とリダイレクトを分離）
  const createWithAI = async () => {
    // ボタンクリック時の詳細なログ
    console.log('【デバッグ】新規LP作成ボタンがクリックされました - ' + new Date().toISOString());
    
    try {
      // LP作成（リダイレクトなし）
      const lpId = await createLP_NoRedirect();
      console.log('【デバッグ】LP作成完了。遷移準備 - lpId:', lpId);
      
      // 少し待機してからリダイレクト
      setTimeout(() => {
        // 別の関数でリダイレクト処理
        redirectToEditGenerate(lpId);
      }, 300);
    } catch (error) {
      console.error('【デバッグ】処理全体のエラー:', error);
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          {/* LP管理ページと同じボタンを追加 */}
          <Button
            className="bg-[#3f51b5] hover:bg-[#4a5dc7] text-white"
            onClick={() => router.push('/lp/new')}
            disabled={isCreating}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            新規LP作成
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