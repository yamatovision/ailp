import { NextResponse } from 'next/server';
import { signUp } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '名前、メールアドレス、パスワードは必須です' },
        { status: 400 }
      );
    }

    const { data, error } = await signUp(email, password, name);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: data.user,
      message: '登録確認メールを送信しました。メールを確認してアカウントを有効化してください。'
    });
  } catch (error) {
    console.error('登録エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー登録処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}