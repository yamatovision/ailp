'use client';

import { Suspense } from 'react';
import AssistantForm from '@/components/members/AssistantForm';

// ローディングコンポーネント
function LoadingComponent() {
  return (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function CreateAssistantPage() {
  return (
    <main className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">新規アシスタント作成</h1>
      <Suspense fallback={<LoadingComponent />}>
        <AssistantForm />
      </Suspense>
    </main>
  );
}