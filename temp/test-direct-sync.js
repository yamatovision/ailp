/**
 * Prismaデータベースに直接ユーザーを同期するテストスクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Prismaクライアント初期化
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// テスト用アカウント情報 - 実際に存在するユーザーのIDを指定
const USER_ID = process.argv[2] || 'bc73ced2-08bb-44c9-b1ca-0a53fbcc3c2c'; // CLIから指定するか、デフォルト値
const EMAIL = 'metavicer@gmail.com';
const NAME = 'MetavicerUser';

async function directSyncUser() {
  console.log('======== Prismaデータベースへの直接同期テスト ========');
  console.log(`ユーザーID: ${USER_ID}`);
  console.log(`メールアドレス: ${EMAIL}`);

  try {
    // 既存ユーザーを確認
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: USER_ID },
          { email: EMAIL }
        ]
      }
    });

    console.log('既存ユーザー検索結果:', existingUser);

    // 既存ユーザーが見つかった場合
    if (existingUser) {
      // IDが一致する場合
      if (existingUser.id === USER_ID) {
        console.log('✅ ユーザーは既に存在し、IDが一致しています');
        return existingUser;
      }

      // メールアドレスが一致するがIDが異なる場合
      console.log('⚠️ 同じメールアドレスの別ユーザーが存在します。削除して再作成します...');
      
      // 既存ユーザーを削除
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
      console.log('既存ユーザーを削除しました');
    }

    // ユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        id: USER_ID,
        email: EMAIL,
        name: NAME,
        password: null
      }
    });

    console.log('✅ ユーザーを作成しました:', newUser);
    return newUser;
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('======== 同期テスト終了 ========');
  }
}

directSyncUser().catch(console.error);