// モックデータを有効化するスクリプト
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
}

// USE_MOCK_DATA設定をtrueに変更
let updatedEnv = existingEnv;
if (updatedEnv.includes('USE_MOCK_DATA=')) {
  updatedEnv = updatedEnv.replace(/USE_MOCK_DATA=([^\r\n]*)/g, 'USE_MOCK_DATA=true');
} else {
  updatedEnv += '\n# モックデータ使用設定\nUSE_MOCK_DATA=true\n';
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, updatedEnv);
console.log('.env.localファイルを更新しました');
console.log('USE_MOCK_DATA=true を設定しました');

console.log('\n開発サーバーを再起動してください！');
console.log('コマンド: npm run dev');