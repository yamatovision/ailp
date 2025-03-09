'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { updateLP } from '@/lib/api/lp';
import { useLPBuilder } from './LPBuilderContext';

// フェーズの型
type BuildPhase = 'generate' | 'structure' | 'design';

type LPBuilderLayoutProps = {
  children: React.ReactNode;
  title: string;
  currentPhase: BuildPhase;
  lpId: string;
  onPublish?: () => void;
  customPublishButton?: React.ReactNode;
};

export default function LPBuilderLayout({
  children,
  title,
  currentPhase,
  lpId,
  onPublish,
  customPublishButton
}: LPBuilderLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useLPBuilder();
  const [publishing, setPublishing] = useState(false);

  // フェーズ変更ハンドラ
  const handlePhaseChange = (phase: BuildPhase) => {
    // 各ページに遷移
    router.push(`/lp/${lpId}/edit/${phase}`);
  };

  // 戻るボタンのハンドラ - 一覧ページに直接戻る
  const handleBack = () => {
    router.push('/lp');
  };

  // 保存ボタンクリックハンドラ
  const handlePublish = async () => {
    setPublishing(true);
    
    try {
      // カスタム処理があれば実行
      if (onPublish) {
        await onPublish();
      }
      
      // 常にサーバーに保存する処理
      if (lpId) {
        console.log('サーバーにLPデータを保存中...');
        console.log('state内容:', state);
        
        // LP情報をサーバーに保存
        const lpContent = state.lpContent || '';
        console.log('保存するLP内容:', lpContent);
        
        await updateLP(lpId, { 
          title: state.title,
          description: lpContent
        });
        console.log('LPデータがサーバーに保存されました');
      }
      
      // 成功メッセージを表示
      toast({
        title: "LPを保存しました",
        description: "LPが正常に保存されました。",
      });
      // 保存後も同じページに留まる
      // router.push(`/lp/${lpId}`);
    } catch (error) {
      console.error('Saving error:', error);
      toast({
        title: "エラー",
        description: "保存中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between border-b p-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        
        <Tabs 
          value={currentPhase} 
          onValueChange={(value) => handlePhaseChange(value as BuildPhase)} 
          className="mx-auto"
        >
          <TabsList className="grid grid-cols-3 w-[650px]">
            <TabsTrigger value="generate">
              <span className="font-semibold mr-1.5">1.</span> LP作成
            </TabsTrigger>
            <TabsTrigger value="structure">
              <span className="font-semibold mr-1.5">2.</span> 構造作成
            </TabsTrigger>
            <TabsTrigger value="design">
              <span className="font-semibold mr-1.5">3.</span> デザイン調整
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {customPublishButton || (
          <Button
            onClick={handlePublish}
            disabled={publishing}
            className="px-6"
          >
            {publishing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}