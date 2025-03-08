// テストユーザー作成スクリプト
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('エラー: Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('テストユーザー作成を開始します...');
  
  // まず既存のテストユーザーを確認
  const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
    email: 'test123@mailinator.com',
    password: 'password123',
  });

  if (!checkError) {
    console.log('テストユーザーは既に存在しており、認証情報も有効です。');
    return;
  }

  console.log('テストユーザーを新規作成します...');
  
  // 新規ユーザー作成
  const { data, error } = await supabase.auth.signUp({
    email: 'test123@mailinator.com', // 一時メールサービスを使用
    password: 'password123',
    options: {
      data: { 
        name: 'テストユーザー',
        role: 'user'
      }
    }
  });

  if (error) {
    console.error('ユーザー作成エラー:', error.message);
  } else {
    console.log('テストユーザーが作成されました:', data);
    
    // メール確認が必要ない場合、自動的に確認済みにする
    // 注意: この部分は管理者権限が必要で、通常のアノニムキーでは実行できません
    console.log('注意: メール確認が必要な設定になっている場合は、Supabaseダッシュボードで手動で確認するか、メール確認が不要になるように設定を変更してください。');
  }
}

createTestUser();