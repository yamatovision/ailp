/**
 * Supabaseのユーザー情報を確認するスクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 環境変数の取得と確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase環境変数が設定されていません');
  process.exit(1);
}

// Supabaseクライアントの初期化
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseUsers() {
  try {
    console.log('Supabaseユーザー情報を確認中...');
    
    // シンプルなテスト認証（Adminユーザーで認証を試みる）
    console.log('テスト認証を試みます...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'metavicer@gmail.com',
      password: 'password123' // 実際のパスワードをここに入力
    });
    
    if (authError) {
      console.error('認証エラー:', authError.message);
    } else {
      console.log('認証成功! ユーザー情報:');
      console.log('- ユーザーID:', authData.user.id);
      console.log('- メールアドレス:', authData.user.email);
      console.log('- ユーザーメタデータ:', authData.user.user_metadata);
      console.log('- 最終サインイン:', authData.user.last_sign_in_at);
      
      // このユーザーIDをメモして、手動で同期する際に使用できます
      console.log('\n=== 手動同期用データ ===');
      console.log(`ユーザーID: ${authData.user.id}`);
      console.log(`メールアドレス: ${authData.user.email}`);
      console.log(`名前: ${authData.user.user_metadata?.name || 'User'}`);
    }
    
  } catch (error) {
    console.error('エラー発生:', error);
  }
}

checkSupabaseUsers().catch(console.error);