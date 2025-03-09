import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/types/database';

// 環境変数のチェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 開発環境のみで警告を表示
if (process.env.NODE_ENV !== 'production') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '警告: Supabase環境変数が設定されていません。.env.localファイルに適切な値を設定してください。'
    );
  }
  
  // デバッグ情報
  console.log('Supabase初期化:', { 
    url: supabaseUrl.substring(0, 15) + '...', 
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length || 0
  });
}

// クライアントコンポーネント用のクライアント
export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }
  });
};

// 汎用的なAPIクライアント (主にサーバーサイドでの利用向け)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// クライアント側で直接使用しない - auth/services/auth-service.tsを使用すること
export const _authUtils = {
  getSupabaseClient: () => {
    if (typeof window === 'undefined') {
      // サーバーサイド
      return supabase;
    } else {
      // クライアントサイド
      return createBrowserClient();
    }
  }
};