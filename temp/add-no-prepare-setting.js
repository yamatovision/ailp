// プリペアドステートメント無効化設定追加
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// ファイル内容を読み取り
let envContent = fs.readFileSync(envFilePath, 'utf8');

// PRISMA_CLIENT_NO_PREPARED_STATEMENTSをtrueに設定
if (envContent.includes('PRISMA_CLIENT_NO_PREPARED_STATEMENTS=')) {
  envContent = envContent.replace(/PRISMA_CLIENT_NO_PREPARED_STATEMENTS=.*(\r?\n|$)/g, 'PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true$1');
  console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true に更新しました');
} else {
  envContent += '\n# Prismaプリペアドステートメント無効化設定\nPRISMA_CLIENT_NO_PREPARED_STATEMENTS=true\n';
  console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true を追加しました');
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, envContent);

console.log('.env.localファイルを更新しました');
