'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LPDetailRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  useEffect(() => {
    // LP一覧ページにリダイレクト
    router.push('/lp');
  }, [router]);
  
  // リダイレクト中の表示
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}