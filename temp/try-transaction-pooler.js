require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('===== トランザクションプーラー接続テスト =====');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '設定あり' : '未設定');
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? '設定あり' : '未設定');
  console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS:', process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || 'false');
  
  try {
    // 環境変数を明示的に設定
    process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS = 'true';
    
    console.log('PrismaClientを初期化します...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    console.log('データベース接続テスト中...');
    
    // 単純なクエリで接続テスト
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    
    console.log('✅ データベース接続成功:', result[0].connection_test);
    
    // テーブル一覧の取得
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('\n--- 現在のテーブル一覧 ---');
    if (tables.length === 0) {
      console.log('テーブルがありません');
    } else {
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });