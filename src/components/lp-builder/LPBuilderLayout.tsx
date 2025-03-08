'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

// フェーズの型
type BuildPhase = 'info' | 'generate' | 'design';

type LPBuilderLayoutProps = {
  children: React.ReactNode;
  title: string;
  currentPhase: BuildPhase;
  lpId: string;
  onPublish?: () => void;
};

export default function LPBuilderLayout({
  children,
  title,
  currentPhase,
  lpId,
  onPublish
}: LPBuilderLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);

  // フェーズ変更ハンドラ
  const handlePhaseChange = (phase: BuildPhase) => {
    // 各ページに遷移
    router.push(`/lp/${lpId}/edit/${phase}`);
  };

  // 戻るボタンのハンドラ
  const handleBack = () => {
    router.push(`/lp/${lpId}`);
  };

  // 公開ボタンクリックハンドラ
  const handlePublish = async () => {
    setPublishing(true);
    
    try {
      if (onPublish) {
        await onPublish();
      } else {
        // デフォルトの公開処理
        toast({
          title: "LPを公開しました",
          description: "LPが正常に公開されました。",
        });
        router.push(`/lp/${lpId}`);
      }
    } catch (error) {
      console.error('Publishing error:', error);
      toast({
        title: "エラー",
        description: "公開中にエラーが発生しました。",
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
          <TabsList className="grid grid-cols-3 w-[500px]">
            <TabsTrigger value="info">
              <span className="font-semibold mr-1.5">1.</span> 文章作成
            </TabsTrigger>
            <TabsTrigger value="generate">
              <span className="font-semibold mr-1.5">2.</span> LP生成
            </TabsTrigger>
            <TabsTrigger value="design">
              <span className="font-semibold mr-1.5">3.</span> デザイン調整
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          onClick={handlePublish}
          disabled={publishing}
          className="px-6"
        >
          {publishing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              公開中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              公開
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}