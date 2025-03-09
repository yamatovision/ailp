'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Search, UserPlus, Mail, Edit, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


// ユーザータイプの拡張（実際の実装ではprismaスキーマを拡張するべき）
type UserWithStatus = User & {
  status: 'active' | 'trial' | 'inactive' | 'withdrawn';
  role: 'admin' | 'user';
  plan: 'basic' | 'premium';
  lastLoginAt?: Date | null;
};

// ステータスバッジの表示設定
const statusConfig = {
  active: { label: '有効', variant: 'success' as const },
  trial: { label: 'お試し', variant: 'warning' as const },
  inactive: { label: '無効', variant: 'destructive' as const },
  withdrawn: { label: '退会', variant: 'outline' as const },
};

// 日付フォーマット用の関数
const formatDate = (date: Date | null | undefined) => {
  if (!date) return '-';
  
  // Dateオブジェクトでなければ変換を試みる
  let dateObj = date;
  if (!(date instanceof Date) && date) {
    try {
      dateObj = new Date(date);
    } catch (e) {
      console.error('Invalid date format:', date);
      return '-';
    }
  }
  
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

// ユーザー名の頭文字取得用の関数
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

type MemberListProps = {
  users?: UserWithStatus[];
};

export function MemberList({ users }: MemberListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // APIから取得したユーザーデータを使用
  const data = users || [];
  
  // 検索とタブによるフィルタリング
  const filteredUsers = data.filter(user => {
    // タブによるフィルタリング
    if (activeTab !== 'all' && user.status !== activeTab) {
      return false;
    }
    
    // 検索によるフィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    return true;
  }) as UserWithStatus[];

  // ユーザー詳細ページへ移動
  const handleUserDetail = (userId: string) => {
    router.push(`/members/${userId}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>会員一覧</CardTitle>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="active">有効</TabsTrigger>
              <TabsTrigger value="trial">お試し</TabsTrigger>
              <TabsTrigger value="inactive">無効/退会</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="名前またはメールで検索..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/members/invite">
              <Button variant="default">
                <UserPlus className="h-4 w-4 mr-2" />
                招待
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>会員名</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>プラン</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell>最終ログイン</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {searchQuery ? '検索条件に一致する会員が見つかりません' : '会員が登録されていません'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleUserDetail(user.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.image || ''} alt={user.name || ''} />
                          <AvatarFallback>{getInitials(user.name || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.role === 'admin' ? '管理者' : 'ユーザー'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[user.status].variant}>
                        {statusConfig[user.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.plan === 'premium' ? 'プレミアム' : 'ベーシック'}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">メニューを開く</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>アクション</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/members/${user.id}`);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>詳細</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // メール送信ロジック
                          }}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>メール送信</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // 削除ロジック
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>削除</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}