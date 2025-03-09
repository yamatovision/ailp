'use server';

/**
 * ユーザー同期のサーバーアクション
 * このファイルはクライアントから呼び出され、ユーザーをPrismaデータベースと同期します
 */

import { prisma } from '@/lib/db/prisma';

/**
 * Supabaseユーザー情報をPrismaデータベースと同期するサーバーアクション
 */
export async function syncUser(userData: {
  userId: string;
  email: string;
  name?: string;
}): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    console.log('サーバーアクション: ユーザー同期開始', userData);

    if (!userData.userId || !userData.email) {
      return { 
        success: false, 
        message: 'userIdとemailは必須です' 
      };
    }

    // 既存ユーザーの検索
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.userId },
          { email: userData.email }
        ]
      }
    });

    // ユーザーが存在する場合
    if (existingUser) {
      // IDが一致する場合は何もしない
      if (existingUser.id === userData.userId) {
        return { 
          success: true, 
          message: 'ユーザーは既に存在します',
          userId: existingUser.id
        };
      }

      // メールアドレスは同じだがIDが異なる場合
      try {
        // IDを更新
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            id: userData.userId,
            name: userData.name || existingUser.name,
            updatedAt: new Date()
          }
        });

        return {
          success: true,
          message: 'ユーザー情報を更新しました',
          userId: userData.userId
        };
      } catch (updateError) {
        console.error('ユーザー更新エラー:', updateError);
        
        // 更新に失敗した場合は既存ユーザーを削除して新規作成
        try {
          await prisma.user.delete({
            where: { id: existingUser.id }
          });
        } catch (deleteError) {
          return {
            success: false,
            message: 'ユーザー更新と削除に失敗しました'
          };
        }
      }
    }

    // 新規ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        id: userData.userId,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        password: null, // Supabaseで管理されるため不要
      }
    });

    return {
      success: true,
      message: 'ユーザーを同期しました',
      userId: newUser.id
    };
  } catch (error) {
    console.error('ユーザー同期エラー:', error);
    return {
      success: false,
      message: 'ユーザー同期処理中にエラーが発生しました'
    };
  }
}