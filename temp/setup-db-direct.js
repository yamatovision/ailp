// データベース直接セットアップスクリプト
// 実行: node temp/setup-db-direct.js

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

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

// DATABASE_URLを取得
const databaseUrl = getEnvVar('DATABASE_URL');
if (!databaseUrl) {
  console.error('DATABASE_URL環境変数が見つかりませんでした。');
  process.exit(1);
}

console.log(`DatabaseURL: ${databaseUrl.substring(0, 20)}...`);

// Prismaスキーマを直接適用
console.log('\nデータベースにPrismaスキーマを適用しています...');

try {
  const command = `npx prisma db push --accept-data-loss`;
  execSync(command, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  });
  console.log('✅ Prismaスキーマの適用が完了しました');
  
  // テスト用ダミーデータを作成
  console.log('\nテスト用ダミーデータを作成します...');
  
  // テストスクリプトを作成
  const tempScript = `
  const { PrismaClient } = require('@prisma/client');
  
  async function createTestData() {
    const prisma = new PrismaClient();
    try {
      // テストユーザーを作成
      console.log('テストユーザーを作成中...');
      const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
          email: 'test@example.com',
          name: 'テストユーザー',
          password: 'password123',
        },
      });
      console.log('ユーザー作成完了:', user.id);
      
      // テストLP作成
      console.log('テストLPを作成中...');
      const lp1 = await prisma.lpProject.create({
        data: {
          userId: user.id,
          title: 'テストLP 1',
          description: 'これはテスト用のLPです',
          status: 'draft',
        },
      });
      console.log('LP作成完了:', lp1.id);
      
      const lp2 = await prisma.lpProject.create({
        data: {
          userId: user.id,
          title: 'テストLP 2',
          description: '公開中のテスト用LP',
          status: 'active',
        },
      });
      console.log('LP作成完了:', lp2.id);
      
      console.log('テスト用ダミーデータの作成が完了しました');
    } catch (error) {
      console.error('データ作成エラー:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  createTestData().catch(console.error);
  `;
  
  fs.writeFileSync(path.join(__dirname, 'create-test-data.js'), tempScript);
  
  // テストデータ作成を実行
  execSync('node temp/create-test-data.js', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  });
  
  // 一時ファイルを削除
  fs.unlinkSync(path.join(__dirname, 'create-test-data.js'));
  
  console.log('\n✅ セットアップ完了!');
  console.log('次のコマンドを実行して開発サーバーを再起動してください:');
  console.log('npm run dev');
  
} catch (error) {
  console.error('❌ エラー:', error.message);
  console.log('\n問題が発生しました。次のステップを試してください:');
  console.log('1. Prismaキャッシュをクリア: npx prisma generate');
  console.log('2. 開発サーバーを再起動: npm run dev');
}