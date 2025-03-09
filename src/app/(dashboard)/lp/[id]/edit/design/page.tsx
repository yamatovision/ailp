'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { getLP } from '@/lib/api/lp';

import LPBuilderLayout from '@/components/lp-builder/LPBuilderLayout';
import DesignPreviewInterface from '@/components/lp-builder/design/DesignPreviewInterface';
import { LPBuilderProvider } from '@/components/lp-builder/LPBuilderContext';

export default function LPDesignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('ランディングページ作成');
  const [forceRender, setForceRender] = useState(false);

  // ローカルストレージから状態を確認（連携対策）- 強制パラメータ対応
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // URLからforceLoadを確認
      const forceParam = window.location.search.includes('forceLoad=true');
      const retryParam = window.location.search.includes('retry=true');
      
      // ローディング中は早期リダイレクトしない
      if (loading) return;
      
      // forceLoad=trueがある場合は検証をスキップ
      if (forceParam) {
        console.log('Design Page - Bypassing validation due to forceLoad parameter');
        return;
      }
      
      // retryモードの場合はロードを続行
      if (retryParam) {
        console.log('Design Page - Retry mode, continuing load');
        return;
      }
      
      // Cookieを確認
      const hasCookie = document.cookie.includes(`lpbuilder_${params.id}=true`);
      
      // LocalStorageを確認
      const savedState = localStorage.getItem(`lp_builder_${params.id}`);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          console.log('Design Page - Checking saved state:', parsedState);
          
          // 生成完了フラグが立っていない場合も、Cookie確認
          if ((!parsedState.isComplete?.generate || !parsedState.lpContent) && !hasCookie) {
            console.log('Design Page - Invalid state detected, redirecting to generate page');
            toast({
              title: "LP内容が不足しています",
              description: "LP生成ページに戻ります。内容を入力してください。",
              variant: "destructive",
            });
            router.push(`/lp/${params.id}/edit/generate`);
            return;
          } else {
            console.log('Design Page - Valid state or cookie found');
          }
        } catch (e) {
          console.error('Error parsing state:', e);
        }
      } else if (!hasCookie) {
        console.log('Design Page - No saved state found, redirecting to generate page');
        toast({
          title: "セッションデータがありません",
          description: "LP生成ページに戻ります。",
          variant: "destructive",
        });
        router.push(`/lp/${params.id}/edit/generate`);
        return;
      }
      
      // わざと再レンダリングを1回トリガー（状態の同期を確保するため）
      setTimeout(() => setForceRender(true), 100);
    }
  }, [params.id, router, toast, loading]);

  // LPデータの読み込み
  useEffect(() => {
    const fetchLP = async () => {
      try {
        setLoading(true);
        const data = await getLP(params.id);
        setTitle(data.title);
        console.log('Design Page - Loaded LP data from API:', data);
        
        // LPデータから内容を抽出し強制的にlocalStorageに保存
        if (data.description) {
          try {
            // 既存のlocalStorageデータを取得
            const savedState = localStorage.getItem(`lp_builder_${params.id}`);
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              
              // LP内容がない場合、descriptionから抽出
              if (!parsedState.lpContent) {
                const descMatch = /# LP内容の概要\s*([\s\S]*)/i.exec(data.description);
                if (descMatch && descMatch[1]) {
                  const extractedContent = descMatch[1].trim();
                  
                  // 抽出したコンテンツを保存
                  parsedState.lpContent = extractedContent;
                  parsedState.designStyle = parsedState.designStyle || 'corporate';
                  parsedState.isComplete = {
                    ...parsedState.isComplete,
                    info: true,
                    generate: true
                  };
                  
                  // 更新したデータを保存
                  localStorage.setItem(`lp_builder_${params.id}`, JSON.stringify(parsedState));
                  console.log('Design Page - Extracted and saved LP content from API data');
                  
                  // Cookieも設定
                  document.cookie = `lpbuilder_${params.id}=true; path=/; max-age=3600`;
                }
              }
            }
          } catch (e) {
            console.error('Error processing LP data:', e);
          }
        }
      } catch (error) {
        console.error('LPの読み込みに失敗しました:', error);
        toast({
          title: 'エラー',
          description: 'LPの読み込みに失敗しました。',
          variant: 'destructive',
        });
        
        // パラメータがある場合は進行中のため、エラー表示のみ
        if (window.location.search.includes('forceLoad=true') || 
            window.location.search.includes('retry=true')) {
          console.log('Continuing despite error due to force parameters');
        } else {
          router.push('/lp');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLP();
  }, [params.id, router, toast, forceRender]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LPBuilderProvider initialLpId={params.id} initialTitle={title}>
      <LPBuilderLayout currentPhase="design" lpId={params.id} title={title}>
        <DesignPreviewInterface lpId={params.id} />
      </LPBuilderLayout>
    </LPBuilderProvider>
  );
}