'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Metadata } from 'next';
import { PlusCircle, Search, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { LpCard } from '@/components/dashboard/lp-card';
import { getLPs, deleteLP, duplicateLP, createLP } from '@/lib/api/lp';

// メタデータはサーバーコンポーネントでのみ動作するため、
// 別のファイルに移動するか、Route Segmentsを使用する必要があります
// export const metadata: Metadata = {
//   title: 'LP管理 - 多変量テストLP作成システム',
//   description: 'ランディングページの作成、編集、管理を行います。',
// };

// LPの型定義
type LPType = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  conversionRate?: number;
  views?: number;
  conversions?: number;
};

export default function LPPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lps, setLPs] = useState<LPType[]>([]);
  const [filteredLPs, setFilteredLPs] = useState<LPType[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // LPの読み込み
  useEffect(() => {
    const fetchLPs = async () => {
      try {
        setLoading(true);
        const data = await getLPs();
        
        // data.lpsを使用して配列を取得する
        if (data && data.lps) {
          setLPs(data.lps);
          setFilteredLPs(data.lps);
        } else {
          // APIレスポンスが期待した形式でない場合は空配列をセット
          console.error('LP APIの応答が期待した形式ではありません:', data);
          setLPs([]);
          setFilteredLPs([]);
        }
      } catch (error) {
        console.error('LPの読み込みに失敗しました:', error);
        toast({
          title: 'エラー',
          description: 'LPの読み込みに失敗しました。',
          variant: 'destructive',
        });
        // エラー時は空配列をセット
        setLPs([]);
        setFilteredLPs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLPs();
  }, [toast]);

  // フィルタリング処理
  useEffect(() => {
    let result = [...lps];

    // タブによるフィルタリング
    if (activeTab === 'active') {
      result = result.filter((lp) => lp.status === 'active');
    } else if (activeTab === 'draft') {
      result = result.filter((lp) => lp.status === 'draft');
    }

    // 検索クエリによるフィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lp) =>
          lp.title.toLowerCase().includes(query) ||
          (lp.description && lp.description.toLowerCase().includes(query))
      );
    }

    setFilteredLPs(result);
  }, [lps, activeTab, searchQuery]);

  // 新規LP作成 - 直接LP生成画面に遷移
  const handleCreateNew = async () => {
    try {
      // ローディング状態を設定
      setLoading(true);
      
      // 新規LPを作成
      const newLP = await createLP({
        title: '新規LP',
        description: 'AIビルダーで作成中のLP',
        status: 'draft',
        thumbnail: null,
      });
      
      toast({
        title: 'LP作成開始',
        description: 'AIビルダーでLPを作成します',
      });
      
      // 直接生成画面に遷移
      router.push(`/lp/${newLP.id}/edit/generate`);
    } catch (error) {
      console.error('LP作成エラー:', error);
      
      // エラー表示
      toast({
        title: 'エラー',
        description: 'LPの作成に失敗しました。再ログインしてお試しください。',
        variant: 'destructive',
      });
      
      setLoading(false);
      
      // 認証エラーが発生した場合はログインページにリダイレクト
      if (error instanceof Error && (
        error.message.includes('認証') || 
        error.message.includes('auth') || 
        error.message.includes('401')
      )) {
        // 少し待ってからリダイレクト（トーストメッセージを見せるため）
        setTimeout(() => {
          router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
        }, 1500);
      }
    }
  };

  // LP編集
  const handleEdit = (id: string) => {
    router.push(`/lp/${id}/edit`);
  };

  // LP複製
  const handleDuplicate = async (id: string) => {
    try {
      // API呼び出し
      const duplicatedLP = await duplicateLP(id);
      
      // フロントエンド側の状態を更新
      setLPs(prevLPs => [...prevLPs, duplicatedLP]);
      
      // フィルター適用中の場合は、フィルター後のリストも更新
      if (activeTab === 'all' || (activeTab === 'draft' && duplicatedLP.status === 'draft')) {
        setFilteredLPs(prevFiltered => [...prevFiltered, duplicatedLP]);
      }
      
      toast({
        title: '複製完了',
        description: 'LPを複製しました。',
        variant: 'success',
      });
    } catch (error) {
      console.error('LPの複製に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'LPの複製に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  // LP削除
  const handleDelete = async (id: string) => {
    try {
      // API呼び出し
      await deleteLP(id);
      
      // フロントエンド側でも状態を更新
      const updatedLPs = lps.filter(lp => lp.id !== id);
      setLPs(updatedLPs);
      setFilteredLPs(prev => prev.filter(lp => lp.id !== id));
      
      toast({
        title: '削除完了',
        description: 'LPを削除しました。',
        variant: 'success', // 成功バリアントを使用
      });
    } catch (error) {
      console.error('LPの削除に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'LPの削除に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  // 検索クエリのクリア
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow-sm p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">ランディングページ管理</h1>
          <p className="text-gray-500 mt-1">ランディングページの作成、編集、テスト設定を行います</p>
        </div>
        
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <TabsList className="bg-[#f5f7fa] border border-gray-100">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-[#3f51b5] data-[state=active]:text-white text-gray-700"
              >
                すべて
              </TabsTrigger>
              <TabsTrigger 
                value="active"
                className="data-[state=active]:bg-[#3f51b5] data-[state=active]:text-white text-gray-700"
              >
                公開中
              </TabsTrigger>
              <TabsTrigger 
                value="draft"
                className="data-[state=active]:bg-[#3f51b5] data-[state=active]:text-white text-gray-700"
              >
                下書き
              </TabsTrigger>
            </TabsList>
          
            <div className="flex items-center gap-3 md:ml-auto">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="LP名・説明文で検索"
                  className="pl-8 border-gray-300 focus:border-[#3f51b5] focus:ring-[#3f51b5] bg-white text-gray-800 w-52"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    onClick={clearSearch}
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Button 
                className="bg-[#3f51b5] hover:bg-[#4a5dc7] text-white whitespace-nowrap" 
                onClick={handleCreateNew}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    作成中...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    新規LP作成
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <TabsContent value="all">
            <RenderLPs
              lps={filteredLPs}
              loading={loading}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onCreateNew={handleCreateNew}
            />
          </TabsContent>
          <TabsContent value="active">
            <RenderLPs
              lps={filteredLPs}
              loading={loading}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onCreateNew={handleCreateNew}
            />
          </TabsContent>
          <TabsContent value="draft">
            <RenderLPs
              lps={filteredLPs}
              loading={loading}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onCreateNew={handleCreateNew}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// LPs表示用コンポーネント
function RenderLPs({
  lps,
  loading,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateNew,
}: {
  lps: LPType[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white rounded-lg">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f51b5]"></div>
      </div>
    );
  }

  if (lps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white rounded-lg p-8">
        <div className="p-6 bg-[#f5f7fa] rounded-full">
          <PlusCircle className="h-10 w-10 text-[#3f51b5]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">LP がありません</h3>
        <p className="text-gray-600 text-center max-w-md">
          LPを作成してA/Bテストを開始しましょう。AIが効果的なLPの作成をサポートします。
        </p>
        <Button 
          onClick={onCreateNew} 
          className="bg-[#3f51b5] hover:bg-[#4a5dc7] text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
              <span className="text-white">作成中...</span>
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="text-white">新規LP作成</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lps.map((lp) => (
        <LpCard
          key={lp.id}
          lp={lp}
          onEdit={() => onEdit(lp.id)}
          onDuplicate={() => onDuplicate(lp.id)}
          onDelete={() => onDelete(lp.id)}
        />
      ))}
    </div>
  );
}