'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, UserCog, User, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MemberForm } from '@/components/members/MemberForm';
import { ActivityLog } from '@/components/members/ActivityLog';
import { getMember } from '@/lib/api/members';
import { UserWithStatus } from '@/lib/api/members';

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<UserWithStatus | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // 会員データの読み込み
  useEffect(() => {
    loadMember();
  }, [id]);

  const loadMember = async () => {
    try {
      setLoading(true);
      const data = await getMember(id);
      setMember(data);
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

  // 保存成功時のハンドラ
  const handleSuccess = () => {
    // 最新データを再取得
    loadMember();
    
    // プロフィールタブに戻る
    setActiveTab('profile');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/members">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            会員一覧に戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {loading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              `${member?.name || '会員'} の詳細`
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {loading ? (
              <Skeleton className="h-5 w-64" />
            ) : (
              member?.email || 'メールアドレスなし'
            )}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            プロフィール
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            アクティビティ
          </TabsTrigger>
          <TabsTrigger value="settings">
            <UserCog className="mr-2 h-4 w-4" />
            設定
          </TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <TabsContent value="profile" className="space-y-4">
            {loading ? (
              <>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </>
            ) : (
              member && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>基本情報</CardTitle>
                      <CardDescription>会員の基本情報</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                          <dd className="mt-1">
                            {member.status === 'active' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">有効</span>}
                            {member.status === 'trial' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">お試し</span>}
                            {member.status === 'inactive' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">無効</span>}
                            {member.status === 'withdrawn' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">退会</span>}
                          </dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">プラン</dt>
                          <dd className="mt-1">{member.plan === 'premium' ? 'プレミアム' : 'ベーシック'}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">権限</dt>
                          <dd className="mt-1">{member.role === 'admin' ? '管理者' : 'ユーザー'}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">登録日</dt>
                          <dd className="mt-1">{member.createdAt ? new Date(member.createdAt).toLocaleDateString('ja-JP') : '-'}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">最終ログイン</dt>
                          <dd className="mt-1">{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString('ja-JP') : '-'}</dd>
                        </div>
                        {member.status === 'trial' && member.expirationDate && (
                          <div className="flex flex-col">
                            <dt className="text-sm font-medium text-gray-500">試用期限</dt>
                            <dd className="mt-1">{new Date(member.expirationDate).toLocaleDateString('ja-JP')}</dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>利用状況</CardTitle>
                      <CardDescription>会員の利用状況</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">作成LP数</dt>
                          <dd className="mt-1">{member.lpCount || 0}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">平均コンバージョン率</dt>
                          <dd className="mt-1">{member.conversionRate ? `${member.conversionRate}%` : '-'}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-sm font-medium text-gray-500">メモ</dt>
                          <dd className="mt-1">{member.notes || '特になし'}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              )
            )}

            <div className="mt-6">
              <ActivityLog userId={id} limit={5} />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="mb-4">
              <h2 className="text-lg font-medium mb-2">アクティビティ履歴</h2>
              <p className="text-sm text-muted-foreground">会員のすべてのアクティビティ履歴を表示します</p>
            </div>
            {loading ? (
              <Skeleton className="h-96" />
            ) : (
              <ActivityLog userId={id} />
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="mb-4">
              <h2 className="text-lg font-medium mb-2">会員情報編集</h2>
              <p className="text-sm text-muted-foreground">会員情報の変更や削除ができます</p>
            </div>
            {loading ? (
              <Skeleton className="h-96" />
            ) : (
              member && <MemberForm user={member} onSuccess={handleSuccess} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}