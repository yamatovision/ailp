import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'アカウント登録 - 多変量テストLP作成システム',
  description: '新規アカウントを作成して、多変量テストLP作成システムを始めましょう。',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">アカウント登録</h1>
        <p className="text-sm text-muted-foreground">
          以下の情報を入力して、アカウントを作成してください
        </p>
      </div>
      <RegisterForm />
      <div className="text-sm text-muted-foreground">
        既にアカウントをお持ちの方は
        <Link href="/login" className="ml-1 underline">
          ログイン
        </Link>
        してください。
      </div>
    </div>
  );
}