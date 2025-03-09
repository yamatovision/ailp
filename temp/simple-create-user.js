// シンプルなユーザー作成スクリプト
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 環境変数の出力（セキュリティに注意）
console.log('環境変数:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定あり' : '未設定');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定あり' : '未設定');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('必要な環境変数が設定されていません。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleUser() {
  try {
    // テスト用認証情報
    const email = 'testuser@example.com'; // ドメインをexample.comに変更
    const password = 'TestPassword123!'; // 複雑なパスワード

    console.log(`\nユーザー作成を試みます: ${email}`);

    // ユーザー作成
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: 'Test User',
        }
      }
    });

    if (error) {
      console.error('ユーザー作成エラー:', error.message);
      
      // すでに存在するかどうかをチェック
      console.log('サインインを試みます...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('サインインエラー:', signInError.message);
      } else {
        console.log('既存ユーザーとしてサインイン成功:', signInData.user?.id);
        console.log('セッション:', signInData.session ? 'あり' : 'なし');
      }
    } else {
      console.log('ユーザー作成成功:', data.user?.id);
      console.log('セッション:', data.session ? 'あり' : 'なし');
    }

    console.log('\n==========================================');
    console.log('ログイン情報:');
    console.log(`メールアドレス: ${email}`);
    console.log(`パスワード: ${password}`);
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('予期せぬエラー:', error);
  }
}

createSimpleUser();