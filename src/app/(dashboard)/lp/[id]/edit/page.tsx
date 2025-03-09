'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditLPRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    // 生成ページに自動リダイレクト
    router.replace(`/lp/${params.id}/edit/generate`);
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}