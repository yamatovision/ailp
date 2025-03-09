'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import AssistantForm from '@/components/members/AssistantForm';
import { Assistant } from '@/components/members/AssistantList';

// ローディングコンポーネント
function LoadingComponent() {
  return (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function EditAssistantPage() {
  const params = useParams();
  const { toast } = useToast();
  const [assistant, setAssistant] = useState<Assistant | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/assistants/${params.id}`);
        
        if (!response.ok) {
          throw new Error('アシスタント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setAssistant(data);
      } catch (error) {
        console.error('アシスタント情報取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'アシスタント情報の取得に失敗しました',
          variant: 'destructive',
        });
        
        // 開発用ダミーデータ
        setAssistant({
          id: params.id as string,
          name: 'web-assistant',
          title: 'Webサイト・LP',
          description: 'Webサイトやランディングページの文章作成',
          systemPrompt: 'LP・Webサイト向け文章作成モードです。商品・サービスの特徴、ターゲット層、訴求ポイントなどを教えてください。',
          initialMessage: 'こんにちは！Webサイトやランディングページの文章作成をお手伝いします。どのような内容についてサポートが必要ですか？',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchAssistant();
    }
  }, [params.id, toast]);

  return (
    <main className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">アシスタント編集</h1>
      {isLoading ? (
        <LoadingComponent />
      ) : (
        <Suspense fallback={<LoadingComponent />}>
          <AssistantForm initialData={assistant} isEditing />
        </Suspense>
      )}
    </main>
  );
}