'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function UserNav() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ユーザー名のイニシャルを取得
  const getInitials = (name: string) => {
    if (!name) return 'ユ';
    return name.charAt(0).toUpperCase();
  };

  // ユーザー名を取得（ユーザーメタデータもしくはメールアドレスから）
  const getUserName = () => {
    if (!user) return 'ユーザー';
    
    // @ts-ignore - Supabaseのuser.user_metadataの型が正確に定義されていない場合
    const userName = user.user_metadata?.name || 'ユーザー';
    return userName;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const result = await logout();
      
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'ログアウトエラー',
          description: result.error || 'ログアウトに失敗しました',
        });
        return;
      }
      
      toast({
        title: 'ログアウト成功',
        description: 'ログインページに移動します',
      });
      
      // 直接リダイレクト（router.pushではなく）
      window.location.href = '/login';
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'ログアウトエラー',
        description: '予期せぬエラーが発生しました',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full text-white hover:bg-[#4a5dc7]">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback className="bg-[#f50057] text-white">{getInitials(getUserName())}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{getUserName()}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* アカウント設定ページは一時的に無効化 */}
          <DropdownMenuItem disabled>
            <span className="mr-2">⚙️</span>
            アカウント設定（準備中）
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-500" 
          disabled={isLoggingOut || isLoading}
        >
          <span className="mr-2">🚪</span>
          {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}