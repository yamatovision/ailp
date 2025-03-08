'use client';

import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// フェーズの型
type BuildPhase = 'chat' | 'generate' | 'design';

type BuilderHeaderProps = {
  title: string;
  currentPhase: BuildPhase;
  onPhaseChange: (phase: BuildPhase) => void;
  onBack: () => void;
  onPublish: () => void;
};

export default function BuilderHeader({
  title,
  currentPhase,
  onPhaseChange,
  onBack,
  onPublish
}: BuilderHeaderProps) {
  const [publishing, setPublishing] = useState(false);

  // 公開ボタンクリックハンドラ
  const handlePublish = async () => {
    setPublishing(true);
    
    try {
      // 実際はAPIを呼び出す
      // ここではモック動作のため setTimeout を使用
      setTimeout(() => {
        onPublish();
        setPublishing(false);
      }, 1500);
    } catch (error) {
      console.error('Publishing error:', error);
      setPublishing(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b p-4 bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      
      <Tabs 
        value={currentPhase} 
        onValueChange={(value) => onPhaseChange(value as BuildPhase)} 
        className="mx-auto"
      >
        <TabsList className="grid grid-cols-3 w-[500px]">
          <TabsTrigger value="chat">
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
  );
}