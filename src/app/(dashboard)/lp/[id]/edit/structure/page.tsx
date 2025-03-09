'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutGrid, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getLP, updateLP } from '@/lib/api/lp';

import LPBuilderLayout from '@/components/lp-builder/LPBuilderLayout';
import { LPBuilderProvider } from '@/components/lp-builder/LPBuilderContext';
import StructureInterface from '@/components/lp-builder/structure/StructureInterface';

export default function LPStructurePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('ランディングページ作成');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);
  const [lpContent, setLpContent] = useState('');
  const [triggerAnalyze, setTriggerAnalyze] = useState(false);

  // URL パラメータをチェックして自動分析フラグを設定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const autoAnalyze = url.searchParams.get('autoAnalyze');
      
      if (autoAnalyze === 'true') {
        console.log('自動構造分析が要求されました');
        setShouldAutoAnalyze(true);
      }
    }
  }, []);

  // LPデータの読み込み
  useEffect(() => {
    const fetchLP = async () => {
      try {
        setLoading(true);
        const data = await getLP(params.id);
        setTitle(data.title);
        
        // descriptionがある場合は保存
        if (data.description) {
          console.log('サーバーから取得したLP内容:', data.description);
          setLpContent(data.description);
        }
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
  
  // データ読み込み完了後、自動分析フラグがtrueなら分析を開始
  useEffect(() => {
    if (!loading && shouldAutoAnalyze) {
      console.log('ページ読み込み完了後、自動構造分析を開始します');
      // 子コンポーネントの分析機能をトリガー
      setTriggerAnalyze(true);
      // URL からパラメータを消去（履歴を汚さないため）
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('autoAnalyze');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [loading, shouldAutoAnalyze]);

  // 構造データを保存 - StructureInterfaceのsaveStructureメソッドを呼び出すため参照を追加
  const structureRef = React.useRef<{ saveStructure: () => Promise<any> }>(null);

  const handleSave = async () => {
    console.log('構造ページ: 保存ボタンがクリックされました');
    
    try {
      // StructureInterfaceのsaveStructureメソッドを呼び出す
      if (structureRef.current) {
        await structureRef.current.saveStructure();
        console.log('StructureInterfaceを通じて構造データを保存しました');
      } else {
        // フォールバック: 基本情報のみ保存
        const result = await updateLP(params.id, { 
          title: title,
          description: lpContent
        });
        console.log('LPデータをサーバーに保存しました:', result);
        
        toast({
          title: "保存完了",
          description: "基本情報のみ保存されました (コンポーネント保存に失敗)",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error('保存エラー:', error);
      toast({
        title: "エラー",
        description: "保存中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LPBuilderProvider 
      initialLpId={params.id} 
      initialTitle={title}
      initialLpContent={lpContent}
    >
      <LPBuilderLayout 
        currentPhase="structure" 
        lpId={params.id} 
        title={title} 
        onPublish={handleSave}
        customPublishButton={
          <Button
            onClick={handleSave}
            className="px-6"
          >
            <>
              <Save className="mr-2 h-4 w-4" />
              保存
            </>
          </Button>
        }
      >
        <StructureInterface 
          ref={structureRef}
          lpId={params.id} 
          onAnalyzeTriggered={triggerAnalyze}
          initialContent={lpContent}
          onAnalyzeComplete={() => setTriggerAnalyze(false)}
        />
      </LPBuilderLayout>
    </LPBuilderProvider>
  );
}