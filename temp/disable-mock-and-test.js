// モックデータ無効化テスト
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// ファイル内容を読み取り
let envContent = fs.readFileSync(envFilePath, 'utf8');

// USE_MOCK_DATAをfalseに変更
if (envContent.includes('USE_MOCK_DATA=')) {
  envContent = envContent.replace(/USE_MOCK_DATA=true/g, 'USE_MOCK_DATA=false');
  console.log('USE_MOCK_DATA=false に設定しました');
} else {
  envContent += '\n# モックデータ使用設定\nUSE_MOCK_DATA=false\n';
  console.log('USE_MOCK_DATA=false を追加しました');
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, envContent);

console.log('.env.localファイルを更新しました');
console.log('サーバーの再起動が必要です');
