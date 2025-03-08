import { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'パスワード更新 - 多変量テストLP作成システム',
  description: '新しいパスワードを設定してアカウントにアクセスできるようにします。',
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">パスワードの更新</h1>
        <p className="text-sm text-muted-foreground">
          新しいパスワードを設定してください
        </p>
      </div>
      <ResetPasswordForm />
      <div className="text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          ログインページに戻る
        </Link>
      </div>
    </div>
  );
}