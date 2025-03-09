/**
 * 手動でPrismaデータベースにユーザーを作成するスクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// Prismaクライアント初期化
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 手動で入力するSupabaseユーザー情報
// ※実際のユーザーIDはブラウザのコンソールやAPIログから確認してください
const USER_ID = 'bc73ced2-08bb-44c9-b1ca-0a53fbcc3c2c'; // ブラウザのコンソールで表示されたユーザーID
const EMAIL = 'metavicer@gmail.com';
const NAME = 'MetavicerUser';

async function createUserWithId() {
  try {
    console.log(`手動でPrismaユーザーを作成します (ID: ${USER_ID})...`);

    // すでに存在するか確認
    const existingUser = await prisma.user.findUnique({
      where: {
        id: USER_ID
      }
    });

    if (existingUser) {
      console.log('ユーザーはすでに存在します:', existingUser);
      return existingUser;
    }

    // 同じメールアドレスのユーザーが存在するか確認
    const existingEmailUser = await prisma.user.findFirst({
      where: {
        email: EMAIL
      }
    });

    if (existingEmailUser) {
      console.log('同じメールアドレスのユーザーが存在します:', existingEmailUser);
      
      // 既存ユーザーを削除
      console.log('既存ユーザーを削除します...');
      await prisma.user.delete({
        where: {
          id: existingEmailUser.id
        }
      });
      console.log('既存ユーザーを削除しました');
    }

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        id: USER_ID,
        name: NAME,
        email: EMAIL,
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

createUserWithId()
  .then(user => {
    console.log('完了しました。このユーザーIDでLPが作成できるようになります:', user.id);
  })
  .catch(console.error);