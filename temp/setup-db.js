// データベースセットアップスクリプト
// 実行方法: node temp/setup-db.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// 環境変数からデータベースURLを取得
function getDatabaseUrl() {
  // .env.localファイルが存在する場合は読み込む
  if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)(\r?\n|$)/);
    if (dbUrlMatch && dbUrlMatch[1]) {
      return dbUrlMatch[1].trim();
    }
  }
  
  // 環境変数から取得
  return process.env.DATABASE_URL;
}

// ユーザー確認プロンプト
function askForConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// セットアップの実行
async function setupDatabase() {
  console.log('データベースセットアップを開始します...');
  
  // データベースURLを取得
  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    console.error('エラー: DATABASE_URLが設定されていません。');
    console.log('temp/setup-env.js を実行して環境変数を設定してください。');
    rl.close();
    return;
  }
  
  console.log(`データベース接続URL: ${databaseUrl.substring(0, 20)}...`);
  
  // 確認
  const confirmed = await askForConfirmation(
    'データベースにスキーマを適用しますか？(y/n): '
  );
  
  if (!confirmed) {
    console.log('セットアップをキャンセルしました。');
    rl.close();
    return;
  }
  
  try {
    // Prismaスキーマをデータベースに適用
    console.log('Prismaスキーマをデータベースにプッシュします...');
    execSync(`npx prisma db push --accept-data-loss`, { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });
    
    console.log('\nデータベースセットアップが完了しました！');
    
    // テストデータの作成を確認
    const createTestData = await askForConfirmation(
      'テストデータを作成しますか？(y/n): '
    );
    
    if (createTestData) {
      console.log('\nテストデータを作成中...');
      execSync('node temp/create-test-user.js', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl }
      });
    }
    
    console.log('\n次のコマンドを実行してNext.jsサーバーを再起動してください:');
    console.log('npm run dev');
  } catch (error) {
    console.error('\nエラーが発生しました:', error.message);
  } finally {
    rl.close();
  }
}

// 実行
setupDatabase();
