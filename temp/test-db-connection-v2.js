// データベース接続テストスクリプト v2
// 実行方法: node temp/test-db-connection-v2.js

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

// PrismaClientのインポートを遅延させる
async function main() {
  console.log('データベース接続テストを開始します...');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('DATABASE_URL設定有無:', process.env.DATABASE_URL ? '設定あり' : '設定なし');
  
  if (!process.env.DATABASE_URL) {
    console.error('エラー: DATABASE_URL環境変数が設定されていません');
    process.exit(1);
  }
  
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 40)}...`);
  
  try {
    // PrismaClientをここでインポート（シングルトンパターンを使用）
    let { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    console.log('Prismaクライアントを初期化しました', { version: require('@prisma/client').Prisma.prismaVersion.client });
    
    // 接続テスト（prepared statementエラー回避）
    console.log('\nデータベース接続をテストしています...');
    try {
      // ダイレクトクエリでテスト
      const result = await prisma.$executeRawUnsafe('SELECT 1 AS test');
      console.log('✅ データベース接続成功:', result);
      
      // スキーマプッシュを試行
      console.log('\nPrismaスキーマをプッシュしますか？（データベーステーブルを作成します）(y/N)');
      process.stdout.write('> ');
      
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
          try {
            console.log('\nスキーマをプッシュするには次のコマンドを実行します:');
            console.log('npx prisma db push --accept-data-loss\n');
            
            const { execSync } = require('child_process');
            execSync('npx prisma db push --accept-data-loss', { 
              stdio: 'inherit',
              env: process.env
            });
            
            console.log('\n✅ スキーマのプッシュが完了しました！');
            
            // 正常終了
            await prisma.$disconnect();
            console.log('\n開発サーバーを再起動してください: npm run dev');
            process.exit(0);
          } catch (e) {
            console.error('❌ スキーマプッシュエラー:', e.message);
            await prisma.$disconnect();
            process.exit(1);
          }
        } else {
          console.log('スキーマプッシュをスキップします');
          
          // テーブル確認だけ行う
          try {
            console.log('\n現在のデータベーステーブルを検索しています...');
            const tablesResult = await prisma.$executeRawUnsafe(
              "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            );
            console.log('テーブル数:', tablesResult);
          } catch (e) {
            console.error('❌ テーブル一覧取得エラー:', e.message);
          }
          
          // 正常終了
          await prisma.$disconnect();
          process.exit(0);
        }
      });
      
    } catch (e) {
      console.error('❌ データベース接続エラー:', e);
      console.log('\n問題が検出されました。以下を確認してください:');
      console.log('1. DATABASE_URLが正しいか（特に特殊文字がURLエンコードされているか）');
      console.log('2. Supabaseの接続設定（IP制限など）');
      console.log('3. データベースサーバーが稼働しているか');
      
      try {
        await prisma.$disconnect();
      } catch (err) {
        console.error('切断エラー:', err.message);
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Prisma初期化エラー:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('未処理エラー:', err);
  process.exit(1);
});