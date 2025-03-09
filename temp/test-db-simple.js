// シンプルなデータベース接続テスト
const { PrismaClient } = require('@prisma/client');

// プリペアードステートメントを無効化（CLAUDEで推奨）
process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS = 'true';

const prisma = new PrismaClient({
  // デバッグ用のログ設定
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Database connection test starting...');
    console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 40)}...`);
    console.log(`Using DIRECT_URL: ${process.env.DIRECT_URL?.substring(0, 40)}...`);
    
    console.log('Executing simple query...');
    // 単純なSQL実行
    const result = await prisma.$queryRaw`SELECT current_timestamp as time, current_database() as db`;
    console.log('Connection successful!');
    console.log('Query result:', result);
    
    // モデルへのアクセスをテスト
    console.log('Checking User model...');
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();