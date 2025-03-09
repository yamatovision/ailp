'use client';

import { Suspense } from 'react';
import WritingAssistant from '@/components/writing/WritingAssistant';

// ローディングコンポーネント
function LoadingComponent() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-100px)] bg-[#f5f7fa]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f51b5]"></div>
    </div>
  );
}

export default function WritingPage() {
  return (
    <main className="p-0 -m-4 md:-m-6 overflow-hidden h-screen">
      <Suspense fallback={<LoadingComponent />}>
        <WritingAssistant />
      </Suspense>
    </main>
  );
}