import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'ログイン - 多変量テストLP作成システム',
  description: 'アカウントにログインして、多変量テストLP作成システムを利用します。',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ログイン</h1>
        <p className="text-sm text-muted-foreground">
          メールアドレスとパスワードを入力してログインしてください
        </p>
      </div>
      <LoginForm />
      <div className="flex flex-col space-y-4 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline">
          パスワードをお忘れですか？
        </Link>
        <div>
          アカウントをお持ちでない場合は
          <Link href="/register" className="ml-1 underline">
            新規登録
          </Link>
          してください。
        </div>
      </div>
    </div>
  );
}