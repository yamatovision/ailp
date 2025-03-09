'use client';

import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { authService } from './auth-service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // アクション
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  // ユーザー情報を設定
  setUser: (user: User | null) => set({
    user,
    isAuthenticated: !!user,
  }),
  
  // ローディング状態を設定
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  // 初期化処理
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      // セッションからユーザー情報を取得
      const user = await authService.getCurrentUser();
      
      // ユーザーが存在する場合は同期
      if (user) {
        try {
          // サーバーサイドAPIを呼び出してユーザー同期
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            })
          });
          
          if (!response.ok) {
            console.warn('初期化時のユーザー同期エラー:', await response.text());
            // ただし、認証自体はできているので続行
          }
        } catch (syncError) {
          console.warn('初期化時のユーザー同期処理エラー:', syncError);
          // ただし、認証自体はできているので続行
        }
      }
      
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
      
      // 認証状態の変更を監視
      authService.onAuthStateChange((user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      });
    } catch (error) {
      console.error('認証初期化エラー:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  
  // ログイン処理
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    const result = await authService.login(email, password);
    
    // 認証に成功した場合、セッションを再確認して確実に情報を取得
    if (result.success && result.user) {
      try {
        // セッションを再度確認して最新のユーザー情報を取得
        const currentUser = await authService.getCurrentUser();
        set({
          user: currentUser,
          isAuthenticated: !!currentUser,
          isLoading: false,
        });
      } catch (error) {
        console.error('ユーザー情報の再取得に失敗:', error);
        set({
          user: result.user,
          isAuthenticated: !!result.user,
          isLoading: false,
        });
      }
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
    
    return {
      success: result.success,
      error: result.error,
    };
  },
  
  // ログアウト処理
  logout: async () => {
    set({ isLoading: true });
    
    const result = await authService.logout();
    
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    return {
      success: result.success,
      error: result.error,
    };
  },
  
  // 会員登録処理
  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    
    const result = await authService.register(email, password, name);
    
    set({
      user: result.user || null,
      isAuthenticated: !!result.user,
      isLoading: false,
    });
    
    return {
      success: result.success,
      error: result.error,
    };
  },
}));