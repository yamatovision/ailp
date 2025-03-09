// Supabase環境変数更新スクリプト
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

// 最新のSupabase環境変数
const supabaseUrl = 'https://qdjikxdmpctkfpvkqaof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkamlreGRtcGN0a2ZwdmtxYW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MDAyNTQsImV4cCI6MjA1Njk3NjI1NH0.tGF7_2wNeG-lXCnDES36RpLf9TpSQ60USP0GmmDHqDk';

// 最新のデータベース接続文字列
const dbUrl = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto%40123@db.qdjikxdmpctkfpvkqaof.supabase.co:5432/postgres';

// 環境変数を更新
let updatedEnv = existingEnv;

// Supabase URL更新
if (updatedEnv.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
  updatedEnv = updatedEnv.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.+(\r?\n|$)/g,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}$1`
  );
} else {
  updatedEnv += `\n# Supabase設定\nNEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}\n`;
}

// Supabase ANON KEY更新
if (updatedEnv.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
  updatedEnv = updatedEnv.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.+(\r?\n|$)/g,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}$1`
  );
} else {
  updatedEnv += `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}\n`;
}

// DATABASE_URL更新
if (updatedEnv.includes('DATABASE_URL=')) {
  updatedEnv = updatedEnv.replace(
    /DATABASE_URL=.+(\r?\n|$)/g,
    `DATABASE_URL=${dbUrl}$1`
  );
} else {
  updatedEnv += `\n# データベース接続設定\nDATABASE_URL=${dbUrl}\n`;
}

// USE_MOCK_DATA設定をfalseに変更
if (updatedEnv.includes('USE_MOCK_DATA=')) {
  updatedEnv = updatedEnv.replace(/USE_MOCK_DATA=.*(\r?\n|$)/g, 'USE_MOCK_DATA=false$1');
} else {
  updatedEnv += '\n# モックデータ使用設定\nUSE_MOCK_DATA=false\n';
}

// NODE_ENV設定（明示的にdevelopmentに）
if (updatedEnv.includes('NODE_ENV=')) {
  updatedEnv = updatedEnv.replace(/NODE_ENV=.*(\r?\n|$)/g, 'NODE_ENV=development$1');
} else {
  updatedEnv = `NODE_ENV=development\n${updatedEnv}`;
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, updatedEnv);
console.log('.env.localファイルを更新しました');
console.log('Supabase接続情報を最新に更新しました');
console.log('DATABASE_URL接続文字列を更新しました');
console.log('USE_MOCK_DATA=false を設定しました');
console.log('NODE_ENV=development を設定しました');

console.log('\n次のステップ:');
console.log('1. Prismaキャッシュをクリア・再生成: npx prisma generate');
console.log('2. 開発サーバーを再起動: npm run dev');