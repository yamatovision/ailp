// PgBouncer設定でのPrisma接続テスト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// 環境変数の確認
console.log('===== Prisma PgBouncer接続テスト =====');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '設定あり' : '未設定'}`);
console.log(`DIRECT_URL: ${process.env.DIRECT_URL ? '設定あり' : '未設定'}`);
console.log(`PRISMA_CLIENT_NO_PREPARED_STATEMENTS: ${process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || 'false'}`);

// Prismaクライアントインスタンスを作成
console.log('\nPrismaクライアントを初期化しています...');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  try {
    // 単純なクエリでテスト
    console.log('データベースに接続中...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`✅ 接続成功: ${result[0].test}`);
    
    // ユーザーテーブルを確認
    const userCount = await prisma.user.count();
    console.log(`ユーザー数: ${userCount}`);
    
    // LPプロジェクト数を確認
    const projectCount = await prisma.lpProject.count();
    console.log(`LPプロジェクト数: ${projectCount}`);
    
    // テーブル構造の確認
    console.log('\n--- データベース構造の確認 ---');
    const tables = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    
    // テーブルごとにグループ化して表示
    const tableColumns = {};
    tables.forEach(col => {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(`${col.column_name} (${col.data_type})`);
    });
    
    Object.keys(tableColumns).forEach(tableName => {
      console.log(`\nテーブル: ${tableName}`);
      tableColumns[tableName].forEach(col => console.log(`- ${col}`));
    });
    
    return true;
  } catch (error) {
    console.error('❌ 接続エラー:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(success => {
    console.log(success 
      ? '\n✅ Prisma接続テストが成功しました' 
      : '\n❌ Prisma接続テストが失敗しました');
  })
  .catch(error => {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  });