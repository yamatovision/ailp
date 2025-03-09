'use client';

import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { authService } from '@/auth/services/auth-service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
  
  // アクション
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true, // 初期値をtrueに設定して、初期化中はリダイレクトを防止
  isAuthenticated: false,
  initialized: false,
  
  // 初期化 - アプリ起動時にセッションを確認
  initialize: async () => {
    if (get().initialized) return;
    
    try {
      console.log('認証状態を初期化中...');
      const { session, error } = await authService.getSession();
      
      if (session?.user) {
        console.log('既存セッションを検出:', { userId: session.user.id });
      }
      
      set({
        user: session?.user || null,
        isAuthenticated: !!session?.user,
        isLoading: false,
        initialized: true,
      });
    } catch (error) {
      console.error('認証初期化エラー:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
    }
  },
  
  // ログイン
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error, success } = await authService.signIn(email, password);
      
      if (!success || error) {
        set({ isLoading: false });
        return {
          success: false,
          error: error?.message || 'ログインに失敗しました',
        };
      }
      
      set({
        user: data?.user || null,
        isAuthenticated: !!data?.user,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: '予期せぬエラーが発生しました',
      };
    }
  },
  
  // ログアウト
  logout: async () => {
    set({ isLoading: true });
    
    try {
      const { error, success } = await authService.signOut();
      
      if (!success || error) {
        set({ isLoading: false });
        return {
          success: false,
          error: error?.message || 'ログアウトに失敗しました',
        };
      }
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: '予期せぬエラーが発生しました',
      };
    }
  },
  
  // 会員登録
  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error, success } = await authService.signUp(email, password, name);
      
      if (!success || error) {
        set({ isLoading: false });
        return {
          success: false,
          error: error?.message || '登録に失敗しました',
        };
      }
      
      set({
        user: data?.user || null,
        isAuthenticated: !!data?.user,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: '予期せぬエラーが発生しました',
      };
    }
  },
  
  // パスワードリセットメール送信
  resetPassword: async (email: string) => {
    set({ isLoading: true });
    
    try {
      const { error, success } = await authService.resetPassword(email);
      
      set({ isLoading: false });
      
      if (!success || error) {
        return {
          success: false,
          error: error?.message || 'パスワードリセットに失敗しました',
        };
      }
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: '予期せぬエラーが発生しました',
      };
    }
  },
  
  // 新しいパスワードの設定
  updatePassword: async (password: string) => {
    set({ isLoading: true });
    
    try {
      const { error, success } = await authService.updatePassword(password);
      
      set({ isLoading: false });
      
      if (!success || error) {
        return {
          success: false,
          error: error?.message || 'パスワード更新に失敗しました',
        };
      }
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: '予期せぬエラーが発生しました',
      };
    }
  },
}));