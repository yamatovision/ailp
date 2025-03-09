/**
 * 特定のユーザーをデータベースから削除するスクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// Prismaクライアント初期化
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 削除対象のメールアドレス
const emailsToDelete = [
  'shirahishi.tatsuya@mikoto.co.jp',
  'shiraishi.tatsuya@mikoto.co.jp', // 表記ゆれも対応
  'license@mikoto.co.jp'
];

async function deleteUsers() {
  try {
    console.log('データベースからユーザーを削除します...');

    // 削除前の全ユーザーを表示
    const allUsers = await prisma.user.findMany();
    console.log('削除前のユーザー一覧:', allUsers);

    // 指定したメールアドレスのユーザーを検索
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          in: emailsToDelete
        }
      }
    });

    if (usersToDelete.length === 0) {
      console.log('削除対象のユーザーは存在しません');
      return;
    }

    console.log(`${usersToDelete.length}人のユーザーが見つかりました:`, usersToDelete);

    // ユーザーIDのリストを作成
    const userIds = usersToDelete.map(user => user.id);
    
    // ユーザーを削除
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    console.log(`${deletedUsers.count}人のユーザーを削除しました`);

    // 削除後の全ユーザーを表示
    const remainingUsers = await prisma.user.findMany();
    console.log('削除後のユーザー一覧:', remainingUsers);

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUsers().catch(console.error);