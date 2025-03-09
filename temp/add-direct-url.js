// DIRECT_URL設定追加スクリプト
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// ファイル内容を読み取り
let envContent = fs.readFileSync(envFilePath, 'utf8');

// 現在のDATABASE_URL取得
let databaseUrl = '';
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.*?)["']?(\r?\n|$)/);
if (dbUrlMatch && dbUrlMatch[1]) {
  databaseUrl = dbUrlMatch[1];
}

// DIRECT_URL追加（DATABASE_URLと同じ値を使用）
if (envContent.includes('DIRECT_URL=')) {
  envContent = envContent.replace(/DIRECT_URL=.*(\r?\n|$)/g, `DIRECT_URL="${databaseUrl}"$1`);
  console.log('DIRECT_URLを更新しました');
} else {
  envContent += `\n# 直接接続URL\nDIRECT_URL="${databaseUrl}"\n`;
  console.log('DIRECT_URLを追加しました');
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, envContent);

console.log('.env.localファイルを更新しました');
console.log('サーバーの再起動が必要です');
