'use client';

import { Session, User } from '@supabase/supabase-js';
import { supabase, getSession, getUser, signIn as supabaseSignIn, signOut as supabaseSignOut, signUp as supabaseSignUp } from '@/lib/supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User | null;
  session?: Session | null;
}

class AuthService {
  // 認証が不要なパス
  readonly publicPaths: string[] = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  
  // 認証リスナー
  private authStateListener: { data?: { subscription: { unsubscribe: () => void } } } | null = null;
  
  // 認証状態の変更リスナーコールバックの登録
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // サインイン時にユーザーの同期を実行
        this.syncUserToPrisma(session.user, undefined, session.access_token)
          .then(() => {
            // 同期成功・失敗に関わらずコールバックを実行
            callback(session.user);
          });
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      } else if (event === 'USER_UPDATED' && session) {
        // ユーザー情報が更新された場合も同期
        this.syncUserToPrisma(session.user, undefined, session.access_token)
          .then(() => {
            callback(session.user);
          });
      }
    });
    
    return () => {
      this.authStateListener?.data?.subscription.unsubscribe();
    };
  }
  
  // ログイン
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // 一度ログアウトしてからログイン実行（クリーンな状態でログイン）
      await supabaseSignOut();
      
      const { data, error } = await supabaseSignIn(email, password);
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
      
      // セッションが得られたことを確認
      if (!data.session) {
        return {
          success: false,
          error: 'セッションの作成に失敗しました',
        };
      }
      
      // ログイン成功時にユーザー同期を実行
      if (data.user) {
        await this.syncUserToPrisma(data.user, undefined, data.session.access_token);
      }
      
      // 認証成功
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: 'ログイン処理中に予期せぬエラーが発生しました',
      };
    }
  }
  
  // ログアウト
  async logout(): Promise<AuthResult> {
    try {
      const { error } = await supabaseSignOut();
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'ログアウト処理中に予期せぬエラーが発生しました',
      };
    }
  }
  
  // 会員登録
  async register(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      // Supabaseで認証ユーザーを作成
      const { data, error } = await supabaseSignUp(email, password, name);
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
      
      // Supabase認証が成功し、ユーザーが得られたら、Prismaにも同じユーザーを同期
      if (data.user) {
        await this.syncUserToPrisma(data.user, name, data.session?.access_token);
      }
      
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: '会員登録処理中に予期せぬエラーが発生しました',
      };
    }
  }
  
  // ユーザー同期関数 - 内部処理のため非公開
  private async syncUserToPrisma(
    user: User, 
    name?: string, 
    accessToken?: string
  ): Promise<boolean> {
    if (!user) return false;
    
    try {
      // 同期APIを呼び出し
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // トークンがあれば認証ヘッダーに設定
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        // エラーはログに記録するが、認証フローは中断しない
        console.warn('ユーザー同期エラー:', errorText);
        return false;
      }
      
      const result = await response.json();
      return true;
    } catch (error) {
      console.warn('ユーザー同期処理でエラーが発生:', error);
      return false;
    }
  }
  
  // 現在のセッションを取得
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data, error } = await getSession();
      
      if (error || !data.session) {
        return null;
      }
      
      return data.session;
    } catch (error) {
      return null;
    }
  }
  
  // 現在のユーザーを取得
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      return data.user;
    } catch (error) {
      return null;
    }
  }
  
  // パスに基づいて認証が必要かどうかを判断
  isPublicPath(path: string): boolean {
    return this.publicPaths.some(publicPath => 
      path === publicPath || 
      path.startsWith(`${publicPath}/`) ||
      path.startsWith('/api/auth')
    );
  }
}

// シングルトンインスタンスとしてエクスポート
export const authService = new AuthService();