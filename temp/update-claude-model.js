// .env.localファイルのモデル設定を更新する
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// .env.localのパス
const envPath = path.resolve(process.cwd(), '.env.local');

// ファイルの内容を読み込む
if (!fs.existsSync(envPath)) {
  console.error('.env.localファイルが見つかりません');
  process.exit(1);
}

// 既存のファイル内容を読み込む
let envContent = fs.readFileSync(envPath, 'utf8');

// 既存のモデル設定を確認
const oldModelMatch = envContent.match(/CLAUDE_API_MODEL=([^\n]+)/);
const oldModel = oldModelMatch ? oldModelMatch[1] : 'なし';

// モデル設定を最新のClaude 3.7 Sonnetに更新
const newModel = 'claude-3-7-sonnet-20250219';
if (oldModelMatch) {
  // 既存の設定を置き換え
  envContent = envContent.replace(/CLAUDE_API_MODEL=([^\n]+)/, `CLAUDE_API_MODEL=${newModel}`);
} else {
  // 設定が存在しない場合は追加
  envContent += `\nCLAUDE_API_MODEL=${newModel}`;
}

// 更新した内容を書き戻す
fs.writeFileSync(envPath, envContent);

console.log('Claude APIモデル設定を更新しました:');
console.log(`- 旧設定: ${oldModel}`);
console.log(`- 新設定: ${newModel}`);
console.log('\n.env.localファイルが更新されました。サーバーを再起動してください。');
