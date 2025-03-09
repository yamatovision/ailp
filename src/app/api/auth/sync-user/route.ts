import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/db/prisma';

/**
 * SupabaseとPrismaのユーザー同期API
 * Supabaseで認証されたユーザーをPrismaのUserテーブルと同期します
 */
export async function POST(req: Request) {
  try {
    // ボディからユーザー情報を取得
    const { userId, email, name } = await req.json();
    
    if (!userId || !email) {
      return NextResponse.json({ error: 'userIdとemailは必須です' }, { status: 400 });
    }
    
    // 認証セッションの確認
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    // AuthorizationヘッダーからのトークンもチェックBackリクエストの場合
    const authHeader = req.headers.get('Authorization');
    let backendAuth = false;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data } = await supabase.auth.getUser(token);
        backendAuth = !!data.user;
      } catch (e) {
        // トークン検証に失敗した場合は続行（他の認証方法を試す）
      }
    }
    
    // ユーザーIDの確認（セキュリティチェック）
    // フロントエンドからのリクエストの場合、認証済みセッションのユーザーIDと一致する必要がある
    if (session && session.user.id !== userId && !backendAuth) {
      return NextResponse.json({ 
        error: '権限がありません: ユーザーIDが一致しません' 
      }, { status: 403 });
    }
    
    // 既存ユーザーの検索
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      // すでに存在するユーザーの場合
      if (existingUser.id !== userId) {
        try {
          // メールアドレスは同じだがIDが異なる場合は更新
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { 
              id: userId, // IDをSupabaseのIDに更新
              name: name || existingUser.name,
              updatedAt: new Date()
            }
          });
          
          return NextResponse.json({ 
            message: 'ユーザー情報を更新しました',
            userId
          });
        } catch (updateError) {
          // 更新失敗の場合は削除して再作成
          try {
            await prisma.user.delete({
              where: { id: existingUser.id }
            });
          } catch (deleteError) {
            return NextResponse.json({ 
              error: 'ユーザー更新に失敗しました' 
            }, { status: 500 });
          }
        }
      } else {
        // IDが同じ場合は何もしない
        return NextResponse.json({ 
          message: 'ユーザーはすでに存在します',
          userId
        });
      }
    }
    
    // 新規ユーザーの作成
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        password: null, // パスワードはSupabaseで管理
      }
    });
    
    return NextResponse.json({
      message: 'ユーザーを同期しました',
      userId: newUser.id
    });
    
  } catch (error) {
    console.error('ユーザー同期エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー同期処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}