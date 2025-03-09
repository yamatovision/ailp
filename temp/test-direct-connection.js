// DIRECT_URL接続テスト
const { Client } = require('pg');

async function testDirectConnection() {
  // 環境変数からDirectURLを分解
  const directUrl = process.env.DIRECT_URL;
  
  if (!directUrl) {
    console.error('DIRECT_URL is not set in environment variables');
    process.exit(1);
  }
  
  console.log(`Testing connection to: ${directUrl.split('@')[1]}`);
  
  // PostgreSQLクライアント作成
  const client = new Client({
    connectionString: directUrl
  });
  
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Executing query...');
    const result = await client.query('SELECT current_timestamp as time, current_database() as db');
    console.log('Query result:', result.rows[0]);
    
    await client.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Connection error:', error);
    try {
      await client.end();
    } catch (e) {
      // クライアントが接続されていない場合は無視
    }
    process.exit(1);
  }
}

testDirectConnection();