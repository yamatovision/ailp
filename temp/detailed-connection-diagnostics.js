// 詳細な接続診断スクリプト
require('dotenv').config({ path: '.env.local' });
const { exec } = require('child_process');
const dns = require('dns');
const net = require('net');

console.log('===== Supabase接続詳細診断 =====');

// 環境変数の確認
console.log('\n1. 環境変数の確認:');
const DATABASE_URL = process.env.DATABASE_URL || 'Not set';
console.log(`DATABASE_URL: ${DATABASE_URL.includes('@') ? DATABASE_URL.split('@')[0] + '@' + DATABASE_URL.split('@')[1].split('/')[0] : 'Not valid'}`);

// 接続文字列の解析
let connectionDetails = { host: null, port: null, database: null, user: null };
try {
  if (DATABASE_URL && DATABASE_URL !== 'Not set') {
    // postgresql://user:password@host:port/database 形式を解析
    const urlParts = DATABASE_URL.split('@');
    if (urlParts.length > 1) {
      const userPass = urlParts[0].split('://')[1].split(':');
      const hostPortDb = urlParts[1].split('/');
      const hostPort = hostPortDb[0].split(':');
      
      connectionDetails = {
        user: userPass[0],
        host: hostPort[0],
        port: hostPort[1] || '5432',
        database: hostPortDb[1] || 'postgres'
      };
    }
  }
} catch (e) {
  console.error('接続文字列の解析エラー:', e.message);
}

console.log('\n2. 解析された接続詳細:');
console.log(`- ホスト: ${connectionDetails.host}`);
console.log(`- ポート: ${connectionDetails.port}`);
console.log(`- データベース: ${connectionDetails.database}`);
console.log(`- ユーザー: ${connectionDetails.user}`);

// DNSルックアップ
console.log('\n3. DNSルックアップ:');
if (connectionDetails.host) {
  dns.lookup(connectionDetails.host, (err, address, family) => {
    if (err) {
      console.error(`❌ DNSルックアップエラー: ${err.message}`);
    } else {
      console.log(`✅ DNSルックアップ成功: ${connectionDetails.host} -> ${address} (IPv${family})`);
      
      // ポート接続テスト
      console.log('\n4. ポート接続テスト:');
      const socket = new net.Socket();
      const timeout = 5000; // 5秒タイムアウト
      
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        console.log(`✅ ポート接続成功: ${connectionDetails.host}:${connectionDetails.port} is reachable`);
        socket.destroy();
        
        // psqlによる接続テスト
        runPsqlTest();
      });
      
      socket.on('timeout', () => {
        console.error(`❌ ポート接続タイムアウト: ${connectionDetails.host}:${connectionDetails.port} connection timed out`);
        socket.destroy();
        runPsqlTest();
      });
      
      socket.on('error', (err) => {
        console.error(`❌ ポート接続エラー: ${err.message}`);
        runPsqlTest();
      });
      
      try {
        socket.connect(connectionDetails.port, connectionDetails.host);
      } catch (e) {
        console.error(`❌ ソケット接続試行エラー: ${e.message}`);
        runPsqlTest();
      }
    }
  });
} else {
  console.error('❌ ホスト名が解析できませんでした');
  runPsqlTest();
}

// psqlコマンドによる接続テスト
function runPsqlTest() {
  console.log('\n5. psqlコマンドによる接続テスト:');
  if (!connectionDetails.host) {
    console.error('❌ 接続情報が不完全なため、psqlテストをスキップします');
    runNetcatTest();
    return;
  }
  
  const psqlCommand = `PGPASSWORD="${DATABASE_URL.split(':')[2].split('@')[0]}" psql -h ${connectionDetails.host} -p ${connectionDetails.port} -U ${connectionDetails.user} -d ${connectionDetails.database} -c "SELECT 1" -t`;
  console.log(`実行コマンド: psql -h ${connectionDetails.host} -p ${connectionDetails.port} -U ${connectionDetails.user} -d ${connectionDetails.database} -c "SELECT 1" -t`);
  
  exec(psqlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ psql接続エラー: ${error.message}`);
      console.error(`stderr: ${stderr}`);
    } else {
      console.log(`✅ psql接続成功: ${stdout.trim()}`);
    }
    
    runNetcatTest();
  });
}

// netcatによる接続テスト
function runNetcatTest() {
  console.log('\n6. netcatによる接続テスト:');
  if (!connectionDetails.host) {
    console.error('❌ 接続情報が不完全なため、netcatテストをスキップします');
    showRecommendations();
    return;
  }
  
  // まずncコマンドが存在するか確認
  exec('which nc', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ netcat (nc) コマンドが見つかりません - このテストをスキップします');
      showRecommendations();
      return;
    }
    
    const ncCommand = `nc -zv ${connectionDetails.host} ${connectionDetails.port}`;
    console.log(`実行コマンド: ${ncCommand}`);
    
    exec(ncCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ netcat接続エラー: ${error.message}`);
      } else {
        console.log(`✅ netcat接続結果: ${stdout || stderr}`);
      }
      
      showRecommendations();
    });
  });
}

// 解決策と推奨事項の表示
function showRecommendations() {
  console.log('\n===== 診断結果と推奨事項 =====');
  console.log('1. Supabaseダッシュボードで以下を確認:');
  console.log('   - Project Settings -> Database -> Connection Pooling の設定');
  console.log('   - Project Settings -> Database -> Connection Strings の最新情報');
  console.log('   - Database -> Logs でエラーや接続拒否のログを確認');
  
  console.log('\n2. ネットワーク設定の確認:');
  console.log('   - ファイアウォールが外部接続をブロックしていないか');
  console.log('   - VPNやプロキシを使用している場合はそれらの設定を確認');
  console.log('   - ロケーションサービスやネットワーク許可設定を確認');
  
  console.log('\n3. Supabase側の設定確認:');
  console.log('   - IPアドレス制限リストに現在のIPが含まれているか');
  console.log('   - データベースが稼働中か、メンテナンス中でないか');
  console.log('   - プロジェクトの課金状況や制限が影響していないか');
  
  console.log('\n4. 別プロジェクトとの比較:');
  console.log('   - 成功している別プロジェクトの正確な接続文字列と、現在のプロジェクトの接続文字列を比較');
  console.log('   - 特にユーザー名とドメイン名のフォーマットの違いに注目');
  
  console.log('\n5. Supabaseサポートへの問い合わせ:');
  console.log('   - この診断結果を含めて、Supabaseのサポートチームに問い合わせる');
}
