import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'パスワードリセット - 多変量テストLP作成システム',
  description: 'パスワードをリセットして、アカウントへのアクセスを回復します。',
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">パスワードをお忘れですか？</h1>
        <p className="text-sm text-muted-foreground">
          登録したメールアドレスを入力して、パスワードリセットリンクを受け取ってください
        </p>
      </div>
      <ForgotPasswordForm />
      <div className="text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          ログインページに戻る
        </Link>
      </div>
    </div>
  );
}