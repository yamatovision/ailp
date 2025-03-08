'use client';

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
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

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
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <span className="mr-2">⚙️</span>
            アカウント設定
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-500">
          <span className="mr-2">🚪</span>
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}