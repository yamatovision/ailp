// 簡易データベースセットアップスクリプト
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// .env.localファイルから環境変数を読み込む
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('簡易データベースセットアップを開始します...');
  
  const prisma = new PrismaClient();
  
  try {
    // データベース接続テスト
    console.log('データベース接続をテストしています...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('データベース接続成功:', result);
    
    // 現在のテーブル一覧を取得
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('現在のデータベーステーブル:', tables.map(t => t.table_name).join(', '));
    
    // テストユーザーの作成・確認
    console.log('\nテストユーザーを作成中...');
    try {
      const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
          email: 'test@example.com',
          name: 'テストユーザー',
          password: 'password123',
        },
      });
      console.log('ユーザー作成/更新完了:', user.id);
    } catch (e) {
      console.log('ユーザーテーブルの操作に失敗しました:', e.message);
    }
    
    // テストLPの作成
    console.log('\nテストLPを作成中...');
    try {
      // テストユーザーID取得
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      
      if (user) {
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
      } else {
        console.log('テストユーザーが見つからないためLPの作成をスキップします');
      }
    } catch (e) {
      console.log('LPプロジェクトテーブルの操作に失敗しました:', e.message);
    }
    
    console.log('\n✅ データベースセットアップが完了しました!');
    console.log('次のコマンドを実行して開発サーバーを再起動してください:');
    console.log('npm run dev');
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
setupDatabase();