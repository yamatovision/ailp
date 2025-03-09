// モックデータモードを再度有効化
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// ファイル内容を読み取り
let envContent = fs.readFileSync(envFilePath, 'utf8');

// USE_MOCK_DATAをtrueに変更
if (envContent.includes('USE_MOCK_DATA=')) {
  envContent = envContent.replace(/USE_MOCK_DATA=.*(\r?\n|$)/g, 'USE_MOCK_DATA=true$1');
  console.log('USE_MOCK_DATA=true に設定しました');
} else {
  envContent += '\n# モックデータ使用設定\nUSE_MOCK_DATA=true\n';
  console.log('USE_MOCK_DATA=true を追加しました');
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, envContent);

console.log('.env.localファイルを更新しました');
console.log('サーバーを再起動してください');
