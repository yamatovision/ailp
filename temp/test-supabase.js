// Supabase接続テスト
const { createClient } = require('@supabase/supabase-js');

// .env.localから環境変数を読み込む
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('テスト開始: Supabase接続');
console.log(`URL: ${supabaseUrl}`);
console.log(`ANON_KEY: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'undefined'}`);

async function testSupabaseConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('エラー: Supabase環境変数が設定されていません');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 認証サービスの動作確認
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('認証エラー:', authError.message);
    } else {
      console.log('認証サービス: 正常に接続できました');
      console.log('セッション情報:', authData.session ? '有効なセッションあり' : 'セッションなし');
    }

    // データベースの接続テスト
    const { data, error } = await supabase
      .from('test')
      .select('*')
      .limit(1);

    if (error) {
      // テーブルが存在しない場合も確認
      if (error.code === '42P01') {
        console.log('データベース接続: 正常に接続できました（テストテーブルは存在しません）');
      } else {
        console.error('データベースエラー:', error.message);
      }
    } else {
      console.log('データベース接続: 正常に接続できました');
      console.log('取得データ:', data);
    }

    // ストレージの接続テスト
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('ストレージエラー:', bucketsError.message);
    } else {
      console.log('ストレージ接続: 正常に接続できました');
      console.log('バケット数:', buckets.length);
    }

  } catch (error) {
    console.error('予期しないエラーが発生しました:', error.message);
  }
}

testSupabaseConnection();