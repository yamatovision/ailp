const fs = require('fs');
const path = require('path');

console.log('環境変数を更新しています...');

// 元の.envファイルを読み込む
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// 新しい環境変数
const updatedEnv = envContent
  // パラメータなしのトランザクションプーラー接続を確保
  .replace(/DATABASE_URL=.*/, 'DATABASE_URL=postgresql://postgres.qdjikxdmpctkfpvkqaof:hKuEFmHQEsbgqOBy@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres')
  // 直接接続用のURLを確保
  .replace(/DIRECT_URL=.*/, 'DIRECT_URL=postgresql://postgres:hKuEFmHQEsbgqOBy@db.qdjikxdmpctkfpvkqaof.supabase.co:5432/postgres')
  // プリペアードステートメントを無効化
  .replace(/PRISMA_CLIENT_NO_PREPARED_STATEMENTS=.*/, 'PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true');

// 更新した内容を.envファイルに書き込む
fs.writeFileSync(envPath, updatedEnv);

console.log('環境変数を更新しました:');
console.log('DATABASE_URL: トランザクションプーラー接続 (ポート6543)');
console.log('DIRECT_URL: 直接接続 (ポート5432)');
console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS: true');

console.log('\n次のステップ:');
console.log('1. サーバーを再起動してください: npm run dev');
console.log('2. Prismaキャッシュをクリアするコマンドを実行: npx prisma generate');