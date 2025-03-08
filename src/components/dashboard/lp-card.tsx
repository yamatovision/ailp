'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Edit, 
  Copy, 
  Trash2, 
  MoreVertical, 
  ExternalLink,
  PlayCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// LPの型定義
type LpProps = {
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

interface LpCardProps {
  lp: LpProps;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function LpCard({ lp, onEdit, onDuplicate, onDelete }: LpCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const statusBadge = getStatusBadge(lp.status);
  const createdDate = format(new Date(lp.createdAt), 'yyyy年MM月dd日', { locale: ja });

  // サムネイル画像のフォールバック
  const thumbnailSrc = lp.thumbnail || '/assets/placeholder-image.jpg';

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-0 bg-white">
      <div className="relative">
        <div className="relative h-48 w-full bg-muted">
          {thumbnailSrc && (
            <Image
              src={thumbnailSrc}
              alt={lp.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority={false}
              onError={(e) => {
                // エラーが発生した場合はプレースホルダー画像を表示
                (e.target as HTMLImageElement).src = '/assets/placeholder-image.jpg';
              }}
            />
          )}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={statusBadge.variant}
              className={statusBadge.variant === 'success' ? 'bg-[#4caf50] hover:bg-[#43a047]' : ''}
            >
              {statusBadge.label}
            </Badge>
          </div>
        </div>
      </div>

      <CardHeader className="pb-2 bg-white">
        <CardTitle className="line-clamp-1 text-xl text-gray-800">{lp.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-gray-600">
          {lp.description || 'No description'}
        </CardDescription>
        <div className="text-xs text-gray-500 mt-1">
          作成日: {createdDate}
        </div>
      </CardHeader>

      <CardContent className="pb-2 bg-white">
        {lp.status === 'active' && lp.conversionRate !== undefined && (
          <div className="rounded-md bg-[#f5f7fa] p-3 text-center mt-2">
            <div className="text-xs font-medium text-gray-600 mb-1">
              コンバージョン率
            </div>
            <div className="text-2xl font-bold text-[#3f51b5]">
              {lp.conversionRate.toFixed(1)}%
            </div>
            {lp.views !== undefined && lp.conversions !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                {lp.views.toLocaleString()}表示 / {lp.conversions.toLocaleString()}件
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-2 bg-white">
        <Button variant="default" size="sm" onClick={onEdit} className="bg-[#3f51b5] hover:bg-[#4a5dc7] text-white">
          <Edit className="mr-2 h-4 w-4" />
          <span className="text-white">編集</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-gray-200">
            <DropdownMenuLabel className="text-gray-800">LP操作</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            {lp.status === 'active' && (
              <DropdownMenuItem className="cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-800" onClick={() => window.open(`/preview/${lp.id}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4 text-gray-700" />
                プレビュー
              </DropdownMenuItem>
            )}
            {lp.status === 'draft' && (
              <DropdownMenuItem className="cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-800" onClick={() => console.log('公開')}>
                <PlayCircle className="mr-2 h-4 w-4 text-gray-700" />
                公開する
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-800" onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4 text-gray-700" />
              複製
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
              className="cursor-pointer text-red-500 hover:bg-gray-100 focus:bg-gray-100 focus:text-red-600"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white text-gray-800 border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-800 text-xl">LPを削除しますか？</DialogTitle>
            <DialogDescription className="text-gray-600">
              このランディングページを削除すると、すべての設定とデータが完全に削除されます。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none"
            >
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}