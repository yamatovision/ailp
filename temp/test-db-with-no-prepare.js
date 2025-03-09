// プリペアドステートメント無効化テスト
require('dotenv').config({ path: '.env.local' });

console.log('===== データベース接続テスト（プリペアドステートメント無効） =====');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('DATABASE_URL設定有無:', process.env.DATABASE_URL ? '設定あり' : '設定なし');
console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS:', process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || 'Not set');

// プリペアドステートメント設定の確認
if (process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS !== 'true') {
  console.error('警告: PRISMA_CLIENT_NO_PREPARED_STATEMENTSがtrueに設定されていません');
  process.exit(1);
}

async function testConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    console.log('PrismaClientを初期化します...');
    
    // 新しいPrismaClientインスタンスを作成して設定を反映
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    console.log('データベース接続テスト中...');
    await prisma.$queryRaw`SELECT 1 AS test`;
    console.log('✅ データベース接続に成功しました！');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ データベース接続エラー:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConnection();
