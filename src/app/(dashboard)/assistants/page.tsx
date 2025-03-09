'use client';

import { Suspense } from 'react';
import AssistantList from '@/components/members/AssistantList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

// ローディングコンポーネント
function LoadingComponent() {
  return (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function AssistantsPage() {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500">アシスタントの管理・作成ができます</p>
        </div>
        <Link href="/assistants/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<LoadingComponent />}>
        <AssistantList />
      </Suspense>
    </>
  );
}