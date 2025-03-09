// 環境変数をプーリング接続に設定してスキーマをプッシュする
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 最新のプーリングデータベース接続文字列
const dbUrl = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto%40123@aws-0-ap-northeast-1.pooler.supabase.co:6543/postgres';

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// .env.localファイルの内容を取得・更新
let envContent = '';
try {
  envContent = fs.readFileSync(envFilePath, 'utf8');
  console.log('環境変数ファイルを読み込みました');
  
  // DATABASE_URL更新
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL=.+(\r?\n|$)/g,
      `DATABASE_URL=${dbUrl}$1`
    );
  } else {
    envContent += `\n# データベース接続設定\nDATABASE_URL=${dbUrl}\n`;
  }
  
  // ファイルに書き込み
  fs.writeFileSync(envFilePath, envContent);
  console.log('DATABASE_URL接続文字列をプーリング接続に更新しました');
  
} catch (error) {
  console.error('環境変数ファイル処理中にエラーが発生しました:', error.message);
  process.exit(1);
}

// モックに切り替えスクリプト用意
console.log('\nモックモードも準備します...');
try {
  // モックに切り替えるスクリプトを上書き
  const mockScript = `// モックデータに切り替えるスクリプト
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// 既存の.env.localファイルの内容を取得
let existingEnv = '';
try {
  existingEnv = fs.readFileSync(envFilePath, 'utf8');
  console.log('既存の.env.localファイルを読み込みました');
} catch (error) {
  console.log('既存の.env.localファイルが見つかりません。新規作成します');
  existingEnv = '';
}

// USE_MOCK_DATA設定をtrueに変更
let updatedEnv = existingEnv;
if (updatedEnv.includes('USE_MOCK_DATA=')) {
  // 既存の設定を更新
  updatedEnv = updatedEnv.replace(/USE_MOCK_DATA=.*(\r?\n|$)/g, 'USE_MOCK_DATA=true$1');
} else {
  // 新規に設定を追加
  updatedEnv += '\\n# モックデータ使用設定\\nUSE_MOCK_DATA=true\\n';
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, updatedEnv);
console.log('.env.localファイルを更新しました');
console.log('USE_MOCK_DATA=true を設定しました');

console.log('\\n開発サーバーを再起動してください！');
console.log('コマンド: npm run dev');`;

  fs.writeFileSync(path.join(__dirname, 'use-mock.js'), mockScript);
  console.log('モック使用スクリプトを作成しました: temp/use-mock.js');
} catch (err) {
  console.error('モックスクリプト作成エラー:', err.message);
}

// コマンドに直接環境変数を指定してスキーマをプッシュ
console.log('\nプーリング接続でスキーマをプッシュしています...');
try {
  // macOS/Linux
  execSync(`DATABASE_URL="${dbUrl}" npx prisma db push --accept-data-loss`, {
    stdio: 'inherit'
  });
  
  console.log('\n✅ スキーマのプッシュが完了しました！');
  console.log('\n実データを使用するには:');
  console.log('1. USE_MOCK_DATA=false に設定する。');
  console.log('2. 開発サーバーを再起動: npm run dev');
  console.log('\nモックデータを使用するには:');
  console.log('1. node temp/use-mock.js を実行する。');
  console.log('2. 開発サーバーを再起動: npm run dev');
} catch (error) {
  console.error('\n❌ スキーマプッシュ中にエラーが発生しました');
  console.log('\nデータベース接続の問題が続いています。一時的にモックデータを使用することをお勧めします:');
  console.log('1. node temp/use-mock.js を実行する。');
  console.log('2. 開発サーバーを再起動: npm run dev');
  console.log('\n後ほどSupabaseのデータベース設定を確認し、接続情報を修正してください。');
}