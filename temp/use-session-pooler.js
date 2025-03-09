// セッションプーラー接続に設定するスクリプト
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// 既存の.env.localファイルの内容を取得
let envContent = '';
try {
  envContent = fs.readFileSync(envFilePath, 'utf8');
  console.log('環境変数ファイルを読み込みました');
} catch (error) {
  console.log('環境変数ファイルが見つかりません。新規作成します');
  envContent = '';
}

// セッションプーラー接続文字列
const sessionPoolerUrl = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto%40123@aws-0-ap-northeast-1.pooler.supabase.co:5432/postgres';

// DATABASE_URL更新
let updatedEnv = envContent;
if (updatedEnv.includes('DATABASE_URL=')) {
  // 既存の設定を更新
  updatedEnv = updatedEnv.replace(
    /DATABASE_URL=.+(\r?\n|$)/g,
    `DATABASE_URL=${sessionPoolerUrl}$1`
  );
} else {
  // 新規に設定を追加
  updatedEnv += `\n# データベース接続設定 (セッションプーラー)\nDATABASE_URL=${sessionPoolerUrl}\n`;
}

// USE_MOCK_DATA設定をfalseに変更
if (updatedEnv.includes('USE_MOCK_DATA=')) {
  updatedEnv = updatedEnv.replace(/USE_MOCK_DATA=.*(\r?\n|$)/g, 'USE_MOCK_DATA=false$1');
} else {
  updatedEnv += '\n# モックデータ使用設定\nUSE_MOCK_DATA=false\n';
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, updatedEnv);
console.log('.env.localファイルを更新しました');
console.log('DATABASE_URL接続文字列をセッションプーラーに変更しました');
console.log('USE_MOCK_DATA=false を設定しました');

console.log('\n次のステップ:');
console.log('1. Prismaクライアントを再生成: npx prisma generate');
console.log('2. スキーマをデータベースにプッシュ: DATABASE_URL="' + sessionPoolerUrl + '" npx prisma db push --accept-data-loss');
console.log('3. 開発サーバーを再起動: npm run dev');