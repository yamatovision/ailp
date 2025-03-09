// データベース接続環境変数更新スクリプト
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// 環境変数ファイルの内容を取得
let envContent = '';
try {
  envContent = fs.readFileSync(envFilePath, 'utf8');
  console.log('環境変数ファイルを読み込みました');
} catch (error) {
  console.log('環境変数ファイルが見つかりません。新規作成します');
  envContent = '';
}

// 修正済みの接続情報
// Supabase direct connection - pooling connection might have different behavior
const directConnString = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto%40123@db.qdjikxdmpctkfpvkqaof.supabase.co:5432/postgres';

// 環境変数を更新
async function updateEnv() {
  console.log('\n現在の接続設定:');
  if (envContent.includes('DATABASE_URL=')) {
    const match = envContent.match(/DATABASE_URL=(.+)(\r?\n|$)/);
    if (match) {
      console.log('DATABASE_URL:', match[1]);
    }
  } else {
    console.log('DATABASE_URL: 未設定');
  }
  
  console.log('\nプーリング接続ではなく直接接続に変更します。');
  console.log('使用するURL:', directConnString);
  
  const answer = await new Promise(resolve => {
    rl.question('環境変数を更新しますか？(y/N): ', ans => resolve(ans.toLowerCase()));
  });
  
  if (answer === 'y' || answer === 'yes') {
    // DATABASE_URL設定を更新
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(
        /DATABASE_URL=.+(\r?\n|$)/g,
        `DATABASE_URL=${directConnString}$1`
      );
    } else {
      envContent += `\n# データベース接続設定\nDATABASE_URL=${directConnString}\n`;
    }
    
    // モックデータ設定をfalseに
    if (envContent.includes('USE_MOCK_DATA=')) {
      envContent = envContent.replace(
        /USE_MOCK_DATA=.+(\r?\n|$)/g,
        'USE_MOCK_DATA=false$1'
      );
    } else {
      envContent += '\n# モックデータ設定\nUSE_MOCK_DATA=false\n';
    }
    
    // ファイルに書き込み
    fs.writeFileSync(envFilePath, envContent);
    console.log('\n.env.localファイルを更新しました');
    console.log('DATABASE_URLを直接接続に変更しました');
    console.log('USE_MOCK_DATA=false を設定しました');
    
    // NODE_ENV設定（明示的にdevelopmentに）
    if (!envContent.includes('NODE_ENV=')) {
      const updatedEnv = `NODE_ENV=development\n${envContent}`;
      fs.writeFileSync(envFilePath, updatedEnv);
      console.log('NODE_ENV=development を設定しました');
    }
  } else {
    console.log('\n更新をキャンセルしました');
  }
  
  console.log('\n次のステップ:');
  console.log('1. スキーマをプッシュ: npx prisma db push --accept-data-loss');
  console.log('2. 開発サーバーを再起動: npm run dev');
  
  rl.close();
}

// 実行
updateEnv().catch(console.error);