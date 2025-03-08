import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">多変量テストLP作成システム</span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight">
              アカウント管理
            </h2>
          </div>
          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-muted">
          <div className="flex h-full items-center justify-center">
            <div className="px-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                AIで簡単にA/Bテスト
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                技術レベルが高くなくても、AIがあなたに代わって最適なランディングページを作成。多変量テストで効果を最大化します。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}