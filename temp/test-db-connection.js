// データベース接続テスト
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('データベース接続テスト開始');
  console.log('DATABASE_URL環境変数:', process.env.DATABASE_URL ? '設定されています' : '設定されていません');

  try {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    console.log('Prismaクライアント作成完了');

    // 接続テスト
    console.log('データベース接続テスト実行中...');
    const users = await prisma.user.findMany({
      take: 5,
    });

    console.log('ユーザー取得成功:', users.length);
    console.log('ユーザーデータサンプル:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));

    await prisma.$disconnect();
    console.log('データベース接続テスト成功');
  } catch (error) {
    console.error('データベース接続エラー:', error);
  }
}

main();