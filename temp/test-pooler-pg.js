// Node.jsのpgモジュールを使ったプーラー接続テスト
require('dotenv').config();
const { Pool } = require('pg');

async function testPoolerConnection() {
  console.log('===== PostgreSQLプーラー接続テスト =====');
  
  // 接続情報を取得
  const poolerUrl = process.env.DATABASE_URL;
  console.log(`接続文字列: ${poolerUrl ? poolerUrl.replace(/:[^:]*@/, ':***@') : '未設定'}`);
  
  if (!poolerUrl) {
    console.error('❌ DATABASE_URLが設定されていません');
    return false;
  }
  
  // PostgreSQLプールを作成
  const pool = new Pool({
    connectionString: poolerUrl,
  });
  
  try {
    console.log('接続テスト中...');
    
    // 接続テスト
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT 1 as test');
      console.log(`✅ 接続成功: ${result.rows[0].test}`);
      
      // テーブル一覧の取得
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\n--- 現在のテーブル一覧 ---');
      if (tables.rowCount === 0) {
        console.log('テーブルがありません');
      } else {
        tables.rows.forEach(row => {
          console.log(`- ${row.table_name}`);
        });
      }
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ 接続エラー:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// テスト実行
testPoolerConnection()
  .then(success => {
    console.log(success 
      ? '✅ データベース接続テストが成功しました' 
      : '❌ データベース接続テストが失敗しました');
  })
  .catch(error => {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  });