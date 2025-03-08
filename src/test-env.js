// 環境変数接続テストスクリプト
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

async function testEnvironmentVariables() {
  console.log('環境変数接続テストを開始します...\n');

  // 1. サーバー設定のテスト
  console.log('==== サーバー設定テスト ====');
  console.log(`PORT: ${process.env.PORT} - [${process.env.PORT ? '✓' : '✗'}]`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV} - [${process.env.NODE_ENV ? '✓' : '✗'}]`);
  console.log('');

  // 2. Supabase接続テスト
  console.log('==== Supabase接続テスト ====');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '設定済み' : '未設定'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '設定済み' : '未設定'}`);
  
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.from('_dummy_query').select('*').limit(1);
      
      if (error && error.code === 'PGRST116') {
        // テーブルが存在しないエラーは良い兆候（接続は成功している）
        console.log('Supabase接続: 成功 [✓]');
      } else if (error) {
        console.log('Supabase接続: 失敗 [✗]');
        console.log('エラー:', error.message);
      } else {
        console.log('Supabase接続: 成功 [✓]');
      }
    } catch (error) {
      console.log('Supabase接続: 失敗 [✗]');
      console.log('エラー:', error.message);
    }
  } else {
    console.log('Supabase接続: スキップ (認証情報が不完全) [!]');
  }
  console.log('');

  // 3. データベース接続テスト
  console.log('==== データベース接続テスト ====');
  const dbUrl = process.env.DATABASE_URL;
  console.log(`DATABASE_URL: ${dbUrl ? '設定済み' : '未設定'}`);
  
  if (dbUrl) {
    try {
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('データベース接続: 成功 [✓]');
      
      // テーブル一覧を取得して表示（オプション）
      const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
      console.log('利用可能なテーブル:');
      tables.forEach(table => console.log(`- ${table.tablename}`));
      
      await prisma.$disconnect();
    } catch (error) {
      console.log('データベース接続: 失敗 [✗]');
      console.log('エラー:', error.message);
    }
  } else {
    console.log('データベース接続: スキップ (接続情報が不完全) [!]');
  }
  console.log('');

  console.log('環境変数接続テストが完了しました');
}

testEnvironmentVariables().catch(console.error);