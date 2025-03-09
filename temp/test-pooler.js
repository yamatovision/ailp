// Prismaクライアントを使用したトランザクションプーラー接続テスト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('===== Supabase Pooler接続テスト =====');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '設定あり' : '未設定'}`);
  console.log(`DIRECT_URL: ${process.env.DIRECT_URL ? '設定あり' : '未設定'}`);
  console.log(`NO_PREPARED_STATEMENTS: ${process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || 'false'}`);
  
  // Prismaの初期化
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  try {
    // シンプルなクエリで接続テスト - クエリの構文を変更
    console.log('データベース接続テスト開始...');
    const result = await prisma.$executeRaw`SELECT 1;`;
    console.log(`✅ 接続成功: ${result}`);
    
    return true;
  } catch (error) {
    console.error('❌ 接続エラー:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// テスト実行
testConnection()
  .then(success => {
    console.log(success 
      ? '✅ データベース接続テストが成功しました' 
      : '❌ データベース接続テストが失敗しました');
  })
  .catch(error => {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  });