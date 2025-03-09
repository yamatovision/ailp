// auth-session.js
// このスクリプトはSupabaseセッションの状態を診断します
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません。.env.localファイルを確認してください。');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anonymous Key:', supabaseAnonKey.substring(0, 5) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSession() {
  try {
    console.log('セッション情報を取得中...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('セッション取得エラー:', error);
      return;
    }
    
    if (!data.session) {
      console.log('有効なセッションが存在しません');
      return;
    }
    
    console.log('セッション情報:');
    console.log('- セッションID:', data.session.id);
    console.log('- 有効期限:', new Date(data.session.expires_at * 1000).toISOString());
    console.log('- トークンタイプ:', data.session.token_type);
    console.log('- アクセストークン存在:', !!data.session.access_token);
    console.log('- リフレッシュトークン存在:', !!data.session.refresh_token);
    
    if (data.session.user) {
      console.log('ユーザー情報:');
      console.log('- ユーザーID:', data.session.user.id);
      console.log('- メールアドレス:', data.session.user.email);
      console.log('- 最終サインイン:', data.session.user.last_sign_in_at);
    }
  } catch (e) {
    console.error('予期せぬエラー:', e);
  }
}

checkSession();