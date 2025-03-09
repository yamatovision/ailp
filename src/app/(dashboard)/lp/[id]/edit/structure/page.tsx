'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getLP } from '@/lib/api/lp';

import LPBuilderLayout from '@/components/lp-builder/LPBuilderLayout';
import { LPBuilderProvider } from '@/components/lp-builder/LPBuilderContext';
import StructureInterface from '@/components/lp-builder/structure/StructureInterface';

export default function LPStructurePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('ランディングページ作成');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // LPデータの読み込み
  useEffect(() => {
    const fetchLP = async () => {
      try {
        setLoading(true);
        const data = await getLP(params.id);
        setTitle(data.title);
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

  // 構造分析を実行
  const handleAnalyze = () => {
    console.log('構造ページ: 構造分析ボタンがクリックされました');
    setIsAnalyzing(true);
    // 実際の分析はStructureInterfaceコンポーネント内で行われる
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LPBuilderProvider initialLpId={params.id} initialTitle={title}>
      <LPBuilderLayout 
        currentPhase="generate" 
        lpId={params.id} 
        title={title} 
        onPublish={handleAnalyze}
        customPublishButton={
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 h-4 w-4" />
                AIで構造を作成
              </>
            )}
          </Button>
        }
      >
        <StructureInterface lpId={params.id} onAnalyzeTriggered={isAnalyzing} />
      </LPBuilderLayout>
    </LPBuilderProvider>
  );
}