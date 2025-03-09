// 最小限のデータベース接続テスト
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

console.log('===== 最小限のデータベース接続テスト =====');
console.log('環境変数:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '設定あり' : '設定なし');
console.log('- DIRECT_URL:', process.env.DIRECT_URL ? '設定あり' : '設定なし');
console.log('- PRISMA_CLIENT_NO_PREPARED_STATEMENTS:', process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || 'Not set');
console.log('- USE_MOCK_DATA:', process.env.USE_MOCK_DATA || 'Not set');

async function testConnection() {
  try {
    console.log('\nPrismaClientを初期化中...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    console.log('\nデータベース接続テスト中...');
    console.log('テストクエリ実行: SELECT 1');
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 AS test`;
      console.log('✅ クエリ成功:', result);
      
      console.log('\nテーブルリスト取得中...');
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('テーブル一覧:', tables);
      
      return { success: true, message: 'データベース接続テスト成功' };
    } catch (queryError) {
      console.error('❌ クエリエラー:', queryError);
      return { success: false, error: queryError };
    } finally {
      await prisma.$disconnect();
    }
  } catch (initError) {
    console.error('❌ Prisma初期化エラー:', initError);
    return { success: false, error: initError };
  }
}

// テスト実行
testConnection()
  .then(result => {
    console.log('\n===== テスト結果 =====');
    console.log(result);
    if (!result.success) {
      console.log('\n問題解決の提案:');
      console.log('1. 接続文字列の確認（ユーザー名、パスワード、ホスト、ポート）');
      console.log('2. ネットワーク接続の確認');
      console.log('3. データベースサーバーが稼働しているか確認');
      console.log('4. IPアドレス制限がないか確認');
      console.log('5. 一時的な解決策として、モックデータモードに戻す');
      
      // モックデータに戻すコマンドを表示
      console.log('\nモックデータモードに戻すには:');
      console.log('node temp/re-enable-mock.js');
    }
  })
  .catch(err => {
    console.error('テスト実行エラー:', err);
  });
