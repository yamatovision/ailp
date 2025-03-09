// データベース接続のURLを標準形式に修正する
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// 環境変数の正しい値
const correctDatabaseUrl = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto@123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const correctDirectUrl = 'postgresql://postgres:Mikoto@123@db.qdjikxdmpctkfpvkqaof.supabase.co:5432/postgres';

// 現在の値を取得
const currentDbUrl = process.env.DATABASE_URL;
const currentDirectUrl = process.env.DIRECT_URL;

console.log('=== データベース接続情報の確認と修正 ===');
console.log('現在のDATABASE_URL:', currentDbUrl);
console.log('現在のDIRECT_URL:', currentDirectUrl);

// .env.localファイルのパス
const envPath = path.resolve(process.cwd(), '.env.local');

// ファイルの内容を読み込む
if (!fs.existsSync(envPath)) {
  console.error('.env.localファイルが見つかりません');
  process.exit(1);
}

// 既存の設定を読み込む
let envContent = fs.readFileSync(envPath, 'utf8');

// 設定値の比較
const dbUrlMatches = currentDbUrl === correctDatabaseUrl;
const directUrlMatches = currentDirectUrl === correctDirectUrl;

console.log('\n=== 照合結果 ===');
console.log('DATABASE_URL 一致:', dbUrlMatches ? 'はい' : 'いいえ');
console.log('DIRECT_URL 一致:', directUrlMatches ? 'はい' : 'いいえ');

// 必要に応じて更新
if (dbUrlMatches && directUrlMatches) {
  console.log('\n両方の接続URLは既に正しい形式です。修正は必要ありません。');
} else {
  if (!dbUrlMatches) {
    // DATABASE_URLを修正
    envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `DATABASE_URL="${correctDatabaseUrl}"\n`);
  }
  
  if (!directUrlMatches) {
    // DIRECT_URLを修正
    envContent = envContent.replace(/DIRECT_URL=.*(\r?\n|$)/g, `DIRECT_URL="${correctDirectUrl}"\n`);
  }
  
  // 変更を保存
  fs.writeFileSync(envPath, envContent);
  console.log('\n接続URL情報を修正しました。変更を保存しました。');
}

console.log('\n=== DATABASE_URL チェック ===');
console.log('パスワードに@文字が含まれている:', correctDatabaseUrl.includes(':Mikoto@123@') ? 'はい' : 'いいえ');
console.log('URLエンコードされている:', correctDatabaseUrl.includes(':Mikoto%40123@') ? 'はい' : 'いいえ');

console.log('\n=== DIRECT_URL チェック ===');
console.log('パスワードに@文字が含まれている:', correctDirectUrl.includes(':Mikoto@123@') ? 'はい' : 'いいえ');
console.log('URLエンコードされている:', correctDirectUrl.includes(':Mikoto%40123@') ? 'はい' : 'いいえ');

// PRISMA_CLIENT_NO_PREPARED_STATEMENTSの確認
const prepareStatement = process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS;
console.log('\n=== プリペアードステートメント設定 ===');
console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS:', prepareStatement || '未設定');

if (prepareStatement !== 'true') {
  // 設定を追加または更新
  if (envContent.includes('PRISMA_CLIENT_NO_PREPARED_STATEMENTS=')) {
    // 既存の設定を更新
    envContent = envContent.replace(/PRISMA_CLIENT_NO_PREPARED_STATEMENTS=.*(\r?\n|$)/g, 'PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true\n');
  } else {
    // 設定を追加
    envContent += '\nPRISMA_CLIENT_NO_PREPARED_STATEMENTS=true\n';
  }
  
  // 変更を保存
  fs.writeFileSync(envPath, envContent);
  console.log('プリペアードステートメントを無効化設定を追加しました。');
} else {
  console.log('プリペアードステートメントは既に無効化されています。');
}

console.log('\n=== データベース接続設定修正完了 ===');
