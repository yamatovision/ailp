/**
 * LP作成のデバッグスクリプト
 * 
 * この問題のデバッグステップ:
 * 1. 環境変数がNode.jsプロセスに正しく読み込まれているか確認
 * 2. Prisma接続のテスト
 * 3. LP作成のテスト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// 環境変数確認
console.log('環境変数チェック:');
console.log('DATABASE_URL存在:', process.env.DATABASE_URL ? true : false);
console.log('NEXT_PUBLIC_SUPABASE_URL存在:', process.env.NEXT_PUBLIC_SUPABASE_URL ? true : false);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY存在:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? true : false);

// PrismaClientインスタンス作成
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugLpCreation() {
  try {
    console.log('\nPrisma接続テスト...');
    // データベース接続テスト
    const users = await prisma.user.findMany({
      take: 1,
    });
    console.log('ユーザー数:', users.length);
    
    if (users.length > 0) {
      const userId = users[0].id;
      console.log('テスト用ユーザーID:', userId);
      
      // LP作成テスト
      console.log('\nLPプロジェクト作成テスト...');
      const lp = await prisma.lpProject.create({
        data: {
          userId,
          title: 'デバッグ用テストLP',
          description: 'デバッグスクリプトから作成',
          status: 'draft',
        },
      });
      
      console.log('LP作成成功:', lp);
    } else {
      console.log('エラー: テスト用ユーザーが見つかりません。');
      
      // テストユーザー作成
      console.log('\nテストユーザー作成...');
      const testUser = await prisma.user.create({
        data: {
          name: 'テストユーザー',
          email: 'test@example.com',
          password: 'hashed_password_here',
        },
      });
      
      console.log('テストユーザー作成成功:', testUser);
      
      // LP作成テスト
      console.log('\nLPプロジェクト作成テスト...');
      const lp = await prisma.lpProject.create({
        data: {
          userId: testUser.id,
          title: 'デバッグ用テストLP',
          description: 'デバッグスクリプトから作成',
          status: 'draft',
        },
      });
      
      console.log('LP作成成功:', lp);
    }
  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLpCreation().catch(console.error);
