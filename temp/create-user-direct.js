/**
 * 特定のユーザーIDを直接データベースに追加するスクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// Prismaクライアント初期化
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Middlewareのログから取得したSupabaseユーザーID
const SUPABASE_USER_ID = 'd2f977f1-421e-44fb-9cbb-224f7b130ba5';

async function createUserDirect() {
  try {
    console.log('ユーザーをデータベースに直接作成します...');

    // すでに存在するか確認
    const existingUser = await prisma.user.findUnique({
      where: {
        id: SUPABASE_USER_ID
      }
    });

    if (existingUser) {
      console.log('ユーザーはすでに存在します:', existingUser);
      return existingUser;
    }

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        id: SUPABASE_USER_ID,
        name: 'SupabaseユーザーID直接登録',
        email: 'shirahishi.tatsuya@mikoto.co.jp', // ログインに使用しているメールアドレス
        password: null, // Supabaseで管理されるため不要
      }
    });

    console.log('ユーザーを作成しました:', user);
    return user;
  } catch (error) {
    console.error('エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUserDirect()
  .then(user => {
    console.log('完了しました。このユーザーIDでLPが作成できるようになります:', user.id);
  })
  .catch(console.error);