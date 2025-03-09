const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('データベース接続リセットスクリプトを実行しています...');

// 環境変数を確認
console.log('環境変数:');
console.log(`DATABASE_URL=${process.env.DATABASE_URL || '未設定'}`);
console.log(`DIRECT_URL=${process.env.DIRECT_URL || '未設定'}`);
console.log(`PRISMA_CLIENT_NO_PREPARED_STATEMENTS=${process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || '未設定'}`);

// Prismaスキーマを確認
try {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  console.log('\nPrismaスキーマ:');
  console.log('データソース設定:');
  const datasourceMatch = schema.match(/datasource\s+db\s+{[^}]+}/s);
  if (datasourceMatch) {
    console.log(datasourceMatch[0]);
  } else {
    console.log('データソース設定が見つかりません');
  }
} catch (err) {
  console.error('Prismaスキーマの読み取りに失敗しました:', err.message);
}

// Prismaクライアントを再生成
try {
  console.log('\nPrismaクライアントを再生成しています...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prismaクライアントの再生成に成功しました');
} catch (err) {
  console.error('Prismaクライアントの再生成に失敗しました:', err);
}

// データベース接続テスト
try {
  console.log('\nデータベース接続をテストしています...');
  const testScript = `
  const { PrismaClient } = require('@prisma/client');
  
  async function testConnection() {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    try {
      console.log('データベースに接続しています...');
      const result = await prisma.$queryRaw\`SELECT 1 as test\`;
      console.log('接続成功:', result);
      
      await prisma.$disconnect();
      return true;
    } catch (err) {
      console.error('接続テスト失敗:', err.message);
      await prisma.$disconnect();
      return false;
    }
  }
  
  testConnection()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('エラー:', err);
      process.exit(1);
    });
  `;
  
  // 一時ファイルに保存して実行
  const testFile = path.join(__dirname, 'temp-db-test.js');
  fs.writeFileSync(testFile, testScript);
  
  try {
    execSync('node ' + testFile, { stdio: 'inherit' });
    console.log('データベース接続テストに成功しました');
  } catch (err) {
    console.error('データベース接続テストに失敗しました');
  } finally {
    fs.unlinkSync(testFile);
  }
} catch (err) {
  console.error('接続テスト実行中にエラーが発生しました:', err.message);
}

console.log('\n次のステップ:');
console.log('1. データベース接続に成功した場合: npx prisma db push を実行してスキーマを同期');
console.log('2. 接続に失敗した場合: .env ファイルの接続文字列を確認し修正してください');
console.log('3. サーバーを再起動: npm run dev');