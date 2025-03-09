// 実際のユーザー登録スクリプト
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('エラー: Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createRealUser() {
  console.log('実際のユーザー登録を開始します...');
  
  const email = 'shiraishi.tatsuya@mikoto.co.jp';
  const password = 'Mikoto@123'; // 実際に試していたパスワードに修正
  
  // まず既存のユーザーを確認
  try {
    const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (!checkError && existingUser) {
      console.log('ユーザーは既に存在しており、認証情報も有効です。');
      return;
    }
  } catch (e) {
    // エラーの場合は新規作成を試みる
  }

  console.log(`ユーザーを新規作成します: ${email}...`);
  
  // 新規ユーザー作成
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { 
        name: '白石達也',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('ユーザー作成エラー:', error.message);
  } else {
    console.log('ユーザーが作成されました。データ:', data);
    console.log('注: メール確認が必要な設定になっている場合は、確認メールをチェックしてください。');
    
    // 管理者権限がある場合は、メール確認をスキップする方法もありますが、
    // 今回は標準的な確認フローを使用します。
  }
}

createRealUser();