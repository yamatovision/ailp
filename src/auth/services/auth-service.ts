import { _authUtils } from '@/lib/supabase';

// 認証サービス - Supabase認証機能のラッパー
export const authService = {
  // ユーザー登録
  signUp: async (email: string, password: string, name: string) => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailConfirm: true,
        },
      });
      
      return { data, error, success: !error };
    } catch (error) {
      console.error('アカウント登録エラー:', error);
      return { 
        data: null, 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
  
  // ログイン
  signIn: async (email: string, password: string) => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      // ログイン処理
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('ログインエラー:', error);
        return { data, error, success: false };
      }
      
      return { data, error: null, success: true };
    } catch (error) {
      console.error('ログイン例外:', error);
      return { 
        data: null, 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
  
  // ログアウト
  signOut: async () => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      const { error } = await client.auth.signOut();
      return { error, success: !error };
    } catch (error) {
      console.error('ログアウトエラー:', error);
      return { 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
  
  // セッション取得
  getSession: async () => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.getSession();
      return { 
        session: data.session, 
        error, 
        success: !error && !!data.session 
      };
    } catch (error) {
      console.error('セッション取得エラー:', error);
      return { 
        session: null, 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
  
  // ユーザー情報取得
  getUser: async () => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.getUser();
      return { 
        user: data.user, 
        error, 
        success: !error && !!data.user 
      };
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return { 
        user: null, 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
  
  // パスワードリセットメール送信
  resetPassword: async (email: string) => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { data, error, success: !error };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return { 
        data: null, 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
  
  // 新しいパスワードの設定
  updatePassword: async (password: string) => {
    const client = _authUtils.getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.updateUser({
        password,
      });
      
      return { data, error, success: !error };
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      return { 
        data: null, 
        error: { message: '予期せぬエラーが発生しました' }, 
        success: false 
      };
    }
  },
};