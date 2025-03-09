// データベース接続文字列解析スクリプト
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// .env.localファイルの内容を取得
let envContent = '';
try {
  envContent = fs.readFileSync(envFilePath, 'utf8');
  console.log('環境変数ファイルを読み込みました');
} catch (error) {
  console.log('環境変数ファイルが見つかりません');
  process.exit(1);
}

// DATABASE_URLを取得
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)(\r?\n|$)/);
if (!dbUrlMatch) {
  console.log('DATABASE_URL変数が見つかりません');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1].trim();
console.log('取得したDATABASE_URL:', dbUrl);

// 接続文字列の解析
try {
  // postgresql://username:password@hostname:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/;
  const match = dbUrl.match(regex);

  if (match) {
    const [_, username, password, hostname, port, database, queryParams] = match;
    
    // デコードされたパスワードを取得（デバッグ用）
    const decodedPassword = decodeURIComponent(password);
    
    console.log('接続情報:');
    console.log('ユーザー名:', username);
    console.log('パスワード:', password.substring(0, 3) + '***');
    console.log('デコードされたパスワード:', decodedPassword.substring(0, 3) + '***');
    console.log('ホスト名:', hostname);
    console.log('ポート:', port);
    console.log('データベース名:', database);
    console.log('クエリパラメータ:', queryParams || 'なし');

    // psql用の接続文字列を生成
    console.log('\npsqlコマンド用の接続文字列:');
    console.log(`PGPASSWORD="${decodedPassword}" psql -h ${hostname} -p ${port} -U ${username} -d ${database}`);
    
    console.log('\nすべての特殊文字がエスケープされたデータベースURL:');
    // パスワードを再エンコード
    const fullyEncodedPassword = encodeURIComponent(decodedPassword);
    const encodedUrl = `postgresql://${username}:${fullyEncodedPassword}@${hostname}:${port}/${database}${queryParams || ''}`;
    console.log(encodedUrl);
    
    // 内容に変更があれば更新
    if (encodedUrl !== dbUrl) {
      console.log('\n接続文字列が異なります。URLエンコードを更新しますか？(y/N)');
      process.stdout.write('> ');
      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
          const updatedEnvContent = envContent.replace(
            /DATABASE_URL=(.+)(\r?\n|$)/,
            `DATABASE_URL=${encodedUrl}$2`
          );
          fs.writeFileSync(envFilePath, updatedEnvContent);
          console.log('\n.env.localファイルのDATABASE_URLを更新しました');
        } else {
          console.log('\n更新をスキップしました');
        }
        process.exit(0);
      });
    } else {
      console.log('\n接続文字列は正しくURLエンコードされています');
    }
  } else {
    console.log('接続文字列の形式が認識できません');
  }
} catch (error) {
  console.error('エラー:', error);
}