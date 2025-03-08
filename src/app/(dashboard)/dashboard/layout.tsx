import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ダッシュボード - 多変量テストLP作成システム',
  description: 'LPの管理、テスト結果の確認、会員管理などができます。',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}