'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Copy, Trash2, ExternalLink, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { getLP, duplicateLP, deleteLP } from '@/lib/api/lp';

// LPの型定義
type LP = {
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

export default function LPDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [lp, setLP] = useState<LP | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLP = async () => {
      try {
        setLoading(true);
        const data = await getLP(params.id);
        setLP(data);
      } catch (error) {
        console.error('LPの読み込みに失敗しました:', error);
        toast({
          title: 'エラー',
          description: 'LPの読み込みに失敗しました。',
          variant: 'destructive',
        });
        router.push('/lp');
      } finally {
        setLoading(false);
      }
    };

    fetchLP();
  }, [params.id, toast, router]);

  // ステータスバッジの色とラベルを取得
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'success' as const, label: '公開中' };
      case 'draft':
        return { variant: 'outline' as const, label: '下書き' };
      case 'testing':
        return { variant: 'secondary' as const, label: 'テスト中' };
      default:
        return { variant: 'outline' as const, label: status };
    }
  };

  const handleEdit = () => {
    router.push(`/lp/${params.id}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      await duplicateLP(params.id);
      toast({
        title: '複製完了',
        description: 'LPを複製しました。',
      });
      router.push('/lp');
    } catch (error) {
      console.error('LPの複製に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'LPの複製に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLP(params.id);
      toast({
        title: '削除完了',
        description: 'LPを削除しました。',
      });
      router.push('/lp');
    } catch (error) {
      console.error('LPの削除に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'LPの削除に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lp) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/lp" className="inline-flex items-center mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">LP情報</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">LPが見つかりませんでした。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(lp.status);
  const createdDate = format(new Date(lp.createdAt), 'yyyy年MM月dd日', { locale: ja });
  const updatedDate = format(new Date(lp.updatedAt), 'yyyy年MM月dd日', { locale: ja });
  const thumbnailSrc = lp.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25" viewBox="0 0 800 400"%3E%3Crect fill="%23f0f0f0" width="800" height="400"/%3E%3Ctext x="400" y="200" font-family="Arial" font-size="32" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPreview Image%3C/text%3E%3C/svg%3E';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/lp" className="inline-flex items-center mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{lp.title}</h1>
          <Badge variant={statusBadge.variant} className="ml-4">
            {statusBadge.label}
          </Badge>
        </div>
        <div className="flex space-x-2">
          {lp.status === 'active' && (
            <Button variant="outline" onClick={() => window.open(`/preview/${lp.id}`, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              プレビュー
            </Button>
          )}
          {lp.status === 'draft' && (
            <Button variant="outline">
              <PlayCircle className="mr-2 h-4 w-4" />
              公開する
            </Button>
          )}
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            複製
          </Button>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">説明</h3>
                  <p className="text-muted-foreground">{lp.description || '説明なし'}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium mb-1">作成日</h3>
                    <p className="text-muted-foreground">{createdDate}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">最終更新日</h3>
                    <p className="text-muted-foreground">{updatedDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {lp.status === 'active' && lp.conversionRate !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">コンバージョン情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-md text-center">
                    <div className="text-sm text-muted-foreground mb-1">コンバージョン率</div>
                    <div className="text-2xl font-bold">{lp.conversionRate.toFixed(1)}%</div>
                  </div>
                  {lp.views !== undefined && (
                    <div className="bg-muted p-4 rounded-md text-center">
                      <div className="text-sm text-muted-foreground mb-1">総表示回数</div>
                      <div className="text-2xl font-bold">{lp.views.toLocaleString()}</div>
                    </div>
                  )}
                  {lp.conversions !== undefined && (
                    <div className="bg-muted p-4 rounded-md text-center">
                      <div className="text-sm text-muted-foreground mb-1">総コンバージョン</div>
                      <div className="text-2xl font-bold">{lp.conversions.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">サムネイル</h3>
              <div className="relative aspect-video overflow-hidden rounded-md">
                <Image
                  src={thumbnailSrc}
                  alt={lp.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25" viewBox="0 0 800 400"%3E%3Crect fill="%23f0f0f0" width="800" height="400"/%3E%3Ctext x="400" y="200" font-family="Arial" font-size="32" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPreview Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">クイックアクション</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                LPを編集する
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/lp/${params.id}/builder`)}>
                <Edit className="mr-2 h-4 w-4" />
                AIビルダーで編集する
              </Button>
              {lp.status === 'active' && (
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/lp/${params.id}/test/new`)}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  新しいテストを作成する
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">マーケティング情報</h3>
            <div className="space-y-2">
              <p className="text-muted-foreground">このLPにはまだマーケティング情報が設定されていません。</p>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/lp/${params.id}/marketing`)}>
                <Edit className="mr-2 h-4 w-4" />
                マーケティング情報を設定する
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>LPを削除しますか？</DialogTitle>
            <DialogDescription>
              このランディングページを削除すると、すべての設定とデータが完全に削除されます。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}