'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/hooks/use-auth';

/**
 * ユーザーIDとPrismaデータベースの同期を行うカスタムフック
 * Supabaseで認証されたユーザーをPrismaデータベースと自動的に同期します
 */
export function useSyncUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [syncState, setSyncState] = useState<{
    synced: boolean;
    error: string | null;
    lastSyncTime: number | null;
  }>({
    synced: false,
    error: null,
    lastSyncTime: null
  });

  useEffect(() => {
    // 認証済みで、ユーザー情報がある場合のみ同期を実行
    if (isAuthenticated && user && !isLoading) {
      // 前回の同期から60秒以上経過している場合のみ実行（無限ループ防止）
      const now = Date.now();
      if (syncState.lastSyncTime && (now - syncState.lastSyncTime < 60000)) {
        return;
      }
      
      // 同期APIを呼び出す
      const syncUser = async () => {
        try {
          setSyncState(prev => ({ ...prev, error: null }));
          
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ユーザー同期に失敗: ${response.status} ${errorText}`);
          }
          
          // 成功
          setSyncState({
            synced: true,
            error: null,
            lastSyncTime: Date.now()
          });
        } catch (error) {
          // エラー状態を設定
          setSyncState(prev => ({
            ...prev,
            synced: false,
            error: error instanceof Error ? error.message : '不明なエラー',
            lastSyncTime: Date.now() // エラーでも時間は更新
          }));
        }
      };
      
      syncUser();
    }
  }, [user, isAuthenticated, isLoading, syncState.lastSyncTime]);
  
  return { 
    syncedUser: user, 
    synced: syncState.synced,
    syncError: syncState.error
  };
}