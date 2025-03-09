// 直接接続用URLでデータベース接続テスト
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// 直接接続用のクライアント（DIRECTURLを使用）
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function testConnection() {
  console.log('=== データベース直接接続テスト ===');
  console.log('接続URL:', process.env.DIRECT_URL);
  
  try {
    // データベースに接続テスト
    console.log('接続試行中...');
    // 単純なクエリを実行
    const users = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('接続成功\!', users);
    return true;
  } catch (error) {
    console.error('接続エラー:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().then(success => {
  console.log('テスト結果:', success ? '成功' : '失敗');
  process.exit(success ? 0 : 1);
});
