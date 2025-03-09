'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/auth/store/auth-store';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'コンテキストが初期化されていません' }),
  logout: async () => ({ success: false, error: 'コンテキストが初期化されていません' }),
  register: async () => ({ success: false, error: 'コンテキストが初期化されていません' }),
  resetPassword: async () => ({ success: false, error: 'コンテキストが初期化されていません' }),
  updatePassword: async () => ({ success: false, error: 'コンテキストが初期化されていません' })
});

interface AuthProviderProps {
  children: ReactNode;
  initialSession?: {
    user: User | null;
  } | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const authStore = useAuthStore();
  
  // 初期セッションがある場合はストアを更新
  useEffect(() => {
    if (initialSession?.user && !authStore.initialized) {
      useAuthStore.setState({
        user: initialSession.user,
        isAuthenticated: true,
        initialized: true
      });
    } else if (!authStore.initialized) {
      // 初期化は一度だけ実行
      authStore.initialize();
    }
  }, [initialSession, authStore.initialized]);
  
  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);