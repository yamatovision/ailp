// Prismaデバッグスクリプト
// 実行: node temp/prisma-debug.js

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

console.log(`DATABASE_URL: ${databaseUrl.substring(0, 20)}...`);

// プリズマスキーマをチェック
try {
  console.log('\n1. Prismaスキーマを検証しています...');
  execSync('npx prisma validate', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  });
  console.log('✅ Prismaスキーマは有効です');
} catch (error) {
  console.error('❌ Prismaスキーマ検証エラー:', error.message);
}

// データベース接続をチェック
try {
  console.log('\n2. データベース接続をテストしています...');
  
  // 一時的なチェックスクリプトを作成
  const tempScript = `
  const { PrismaClient } = require('@prisma/client');
  
  async function testConnection() {
    const prisma = new PrismaClient();
    try {
      // 単純なクエリでデータベース接続をテスト
      const result = await prisma.$queryRaw\`SELECT 1 as test\`;
      console.log('✅ データベース接続成功:', result);
      
      // データベースの状態を確認
      try {
        const users = await prisma.user.findMany({ take: 3 });
        console.log(\`✅ ユーザーテーブル: \${users.length}件のレコードを取得\`);
      } catch (e) {
        console.log('❓ ユーザーテーブルは存在しない可能性があります:', e.message);
      }
      
      try {
        const lpProjects = await prisma.lpProject.findMany({ take: 3 });
        console.log(\`✅ LPプロジェクトテーブル: \${lpProjects.length}件のレコードを取得\`);
      } catch (e) {
        console.log('❓ LPプロジェクトテーブルは存在しない可能性があります:', e.message);
      }
      
      // 現在のデータベーススキーマについて
      const tables = await prisma.$queryRaw\`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      \`;
      console.log('✅ 現在のデータベーステーブル:', tables.map(t => t.table_name).join(', '));
      
    } catch (error) {
      console.error('❌ データベース接続エラー:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  testConnection().catch(console.error);
  `;
  
  fs.writeFileSync(path.join(__dirname, 'temp-db-check.js'), tempScript);
  
  // 接続テストを実行
  execSync('node temp/temp-db-check.js', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  });
  
  // 一時ファイルを削除
  fs.unlinkSync(path.join(__dirname, 'temp-db-check.js'));
  
} catch (error) {
  console.error('❌ データベーステストエラー:', error.message);
}

// Prisma DBプッシュを試行
try {
  console.log('\n3. データベースにPrismaスキーマを適用しますか？ (y/N)');
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('> ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('\nデータベースにPrismaスキーマを適用しています...');
      try {
        execSync('npx prisma db push --accept-data-loss', {
          env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: 'inherit'
        });
        console.log('✅ Prismaスキーマの適用が完了しました');
      } catch (error) {
        console.error('❌ Prismaスキーマ適用エラー:', error.message);
      }
    } else {
      console.log('操作をキャンセルしました');
    }
    rl.close();
  });
} catch (error) {
  console.error('❌ エラー:', error.message);
}