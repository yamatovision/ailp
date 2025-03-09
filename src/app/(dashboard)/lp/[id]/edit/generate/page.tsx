'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { getLP } from '@/lib/api/lp';

import LPBuilderLayout from '@/components/lp-builder/LPBuilderLayout';
import GenerateInterface from '@/components/lp-builder/generate/GenerateInterface';
import { LPBuilderProvider } from '@/components/lp-builder/LPBuilderContext';

export default function LPGeneratePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('ランディングページ作成');

  // サーバーから取得したLP内容
  const [lpContent, setLpContent] = useState('');

  // LPデータの読み込み
  useEffect(() => {
    const fetchLP = async () => {
      try {
        setLoading(true);
        const data = await getLP(params.id);
        setTitle(data.title);
        
        // description（サーバーに保存されたLP内容）があれば設定
        if (data.description) {
          console.log('サーバーから取得したLP内容:', data.description);
          setLpContent(data.description);
        }
        
        // タイトル入力を求めるメッセージを表示しない
        // 開発中は何度も表示されるとうっとうしいため、コメントアウト
        // if (data.title === '新規LP' || data.title === '新規AI作成LP') {
        //   toast({
        //     title: 'LP名を設定してください',
        //     description: 'LP作成を開始するには、まずLP名を入力してください。',
        //   });
        // }
      } catch (error) {
        console.error('LPの読み込みに失敗しました:', error);
        toast({
          title: 'エラー',
          description: 'LPの読み込みに失敗しました。',
          variant: 'destructive',
        });
        router.push('/lp');
      } finally {
        setLoading(false);
      }
    };

    fetchLP();
  }, [params.id, router, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LPBuilderProvider 
      initialLpId={params.id} 
      initialTitle={title}
      initialLpContent={lpContent} // サーバーから取得したLP内容を初期値として渡す
    >
      <LPBuilderLayout currentPhase="generate" lpId={params.id} title={title}>
        <GenerateInterface lpId={params.id} initialContent={lpContent} />
      </LPBuilderLayout>
    </LPBuilderProvider>
  );
}