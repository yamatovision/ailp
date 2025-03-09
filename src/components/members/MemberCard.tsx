'use client';

import { User } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Mail, Edit, Activity } from 'lucide-react';
import Link from 'next/link';

// ユーザータイプの拡張（実際の実装ではprismaスキーマを拡張するべき）
type UserWithStatus = User & {
  status: 'active' | 'trial' | 'inactive' | 'withdrawn';
  role: 'admin' | 'user';
  plan: 'basic' | 'premium';
  lastLoginAt?: Date | null;
  lpCount?: number;
  conversionRate?: number;
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
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// ユーザー名の頭文字取得用の関数
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

interface MemberCardProps {
  user: UserWithStatus;
  className?: string;
}

export function MemberCard({ user, className }: MemberCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || ''} alt={user.name || ''} />
              <AvatarFallback>{getInitials(user.name || '')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <Badge variant={statusConfig[user.status].variant}>
            {statusConfig[user.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">登録日</span>
            <span className="flex items-center gap-1 text-sm">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDate(user.createdAt)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">最終ログイン</span>
            <span className="flex items-center gap-1 text-sm">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDate(user.lastLoginAt)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">プラン</span>
            <span className="text-sm font-medium">
              {user.plan === 'premium' ? 'プレミアム' : 'ベーシック'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">権限</span>
            <span className="text-sm font-medium">
              {user.role === 'admin' ? '管理者' : 'ユーザー'}
            </span>
          </div>
          {(user.lpCount !== undefined || user.conversionRate !== undefined) && (
            <>
              {user.lpCount !== undefined && (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">作成LP数</span>
                  <span className="text-sm font-medium">{user.lpCount}</span>
                </div>
              )}
              {user.conversionRate !== undefined && (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">平均CV率</span>
                  <span className="text-sm font-medium">{user.conversionRate}%</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/members/${user.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            詳細
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            メール送信
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            アクティビティ
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}