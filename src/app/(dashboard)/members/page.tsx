'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { MemberList } from '@/components/members/MemberList';
import { getMembers } from '@/lib/api/members';
import { UserWithStatus } from '@/lib/api/members';

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<UserWithStatus[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // URLパラメータの取得
  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  // 初期状態の設定
  useEffect(() => {
    setActiveTab(status);
    setCurrentPage(page);
    setSearchQuery(search);
    loadMembers(status, page, search);
  }, [status, page, search]);

  // 会員データの読み込み
  const loadMembers = async (status = 'all', page = 1, search = '') => {
    try {
      setLoading(true);
      
      // APIパラメータの準備
      const params: any = {
        page,
        limit: 10,
        search,
      };
      
      // ステータスフィルターを追加
      if (status !== 'all') {
        params.status = status;
      }
      
      // APIリクエスト
      const response = await getMembers(params);
      
      setMembers(response.data);
      setTotalMembers(response.meta.total);
      setTotalPages(response.meta.totalPages);
      
    } catch (error) {
      console.error('会員データの取得エラー:', error);
      toast({
        title: 'エラー',
        description: '会員情報の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // タブ変更ハンドラ
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updateUrlAndLoadMembers(value, 1, searchQuery);
  };

  // 検索ハンドラ
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlAndLoadMembers(activeTab, 1, searchQuery);
  };

  // URLとデータを更新
  const updateUrlAndLoadMembers = (status: string, page: number, search: string) => {
    // URLパラメータの構築
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (page !== 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    
    // URLの更新
    const newUrl = `/members${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
    
    // データの読み込み
    loadMembers(status, page, search);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">会員管理</h1>
          <p className="text-muted-foreground mt-1">会員情報の閲覧、編集、招待が行えます</p>
        </div>
        <Link href="/members/invite">
          <Button className="whitespace-nowrap">
            <UserPlus className="mr-2 h-4 w-4" />
            会員を招待
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="active">有効</TabsTrigger>
              <TabsTrigger value="trial">お試し</TabsTrigger>
              <TabsTrigger value="inactive">無効/退会</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="w-full sm:w-auto flex gap-2">
            <form onSubmit={handleSearch} className="flex-1 sm:flex-initial flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="名前またはメールで検索..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadMembers(activeTab, currentPage, searchQuery)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <MemberList users={members} />
        
        {/* ページネーション（必要に応じて実装） */}
        {/* <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            全 {totalMembers} 件中 {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalMembers)} 件を表示
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrlAndLoadMembers(activeTab, currentPage - 1, searchQuery)}
              disabled={currentPage <= 1 || loading}
            >
              前へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrlAndLoadMembers(activeTab, currentPage + 1, searchQuery)}
              disabled={currentPage >= totalPages || loading}
            >
              次へ
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  );
}