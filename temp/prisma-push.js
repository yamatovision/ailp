// Prismaスキーマをデータベースにプッシュする
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// .env.localファイルから環境変数を取得
function getEnvVar(name) {
  try {
    const envFilePath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const match = envContent.match(new RegExp(`${name}=([^\\r\\n]+)`));
    return match ? match[1] : null;
  } catch (err) {
    console.error(`環境変数取得エラー (${name}):`, err.message);
    return null;
  }
}

// データベース接続URL
const dbUrl = getEnvVar('DATABASE_URL');
if (!dbUrl) {
  console.error('DATABASE_URL環境変数が見つかりません');
  process.exit(1);
}

console.log(`DATABASE_URL: ${dbUrl.substring(0, 30)}...`);

// スキーマをプッシュ
try {
  console.log('\nスキーマをデータベースにプッシュしています...');
  execSync('npx prisma db push --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
  
  console.log('\n✅ スキーマのプッシュが完了しました！');
  console.log('\n次のステップ:');
  console.log('1. モックデータ無効化: node temp/disable-mock.js');
  console.log('2. 開発サーバーを再起動: npm run dev');
} catch (error) {
  console.error('\n❌ スキーマプッシュ中にエラーが発生しました:', error.message);
  console.log('\nデータベース接続情報を確認してください:');
  console.log('- DATABASE_URLが正しいかチェック');
  console.log('- Supabase管理画面でデータベース設定と権限を確認');
}