'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, ArrowRight, LayoutGrid, 
  AlertTriangle, RefreshCw, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

import { useLPBuilder } from '../LPBuilderContext';
import { analyzeStructure } from '@/lib/api/lp';
import { Section } from '@/types/structure';
import DirectoryTree from './DirectoryTree';
import SectionPreview from './SectionPreview';

type StructureInterfaceProps = {
  lpId: string;
  onAnalyzeTriggered?: boolean;
};

export default function StructureInterface({ lpId, onAnalyzeTriggered }: StructureInterfaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { state, setSections, completePhase } = useLPBuilder();
  
  // 構造分析の状態
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sections, setSectionsState] = useState<Section[]>(state.sections || []);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 親コンポーネントからのトリガーを監視
  useEffect(() => {
    if (onAnalyzeTriggered) {
      console.log('StructureInterface: 親コンポーネントから分析トリガーを受信');
      handleAnalyze();
    }
  }, [onAnalyzeTriggered]);

  // LP情報が変更されたら更新
  useEffect(() => {
    if (state.sections && state.sections.length > 0) {
      setSectionsState(state.sections);
      
      // 最初のセクションを選択
      if (!selectedSection && state.sections.length > 0) {
        setSelectedSection(state.sections[0].id);
        setExpandedSection(state.sections[0].id);
      }
    }
  }, [state.sections, selectedSection]);

  // AIに構造を分析させる
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    
    console.log('構造分析開始: handleAnalyzeが呼び出されました');
    
    // プログレスアニメーション
    const interval = setInterval(() => {
      setProgress(prev => {
        // 95%まで自動進行、残りはAPIレスポンス後に更新
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);
    
    try {
      // API呼び出しパラメータの準備
      const data = {
        serviceInfo: state.lpContent || 'ランディングページの内容がありません。',
        targetAudience: state.designDescription || '',
        goals: 'コンバージョン率の向上'
      };
      
      console.log('構造分析APIリクエスト準備完了:', data);
      
      // 構造分析APIを呼び出し
      console.log('analyzeStructure API関数を呼び出します');
      const result = await analyzeStructure(data);
      console.log('構造分析APIレスポンス受信:', result);
      
      // セクションを更新
      if (result.sections && result.sections.length > 0) {
        setSectionsState(result.sections);
        setSections(result.sections);
        
        // 最初のセクションを選択状態に
        setSelectedSection(result.sections[0].id);
        setExpandedSection(result.sections[0].id);
        
        // 完了通知
        toast({
          title: "構造分析完了",
          description: `${result.sections.length}個のセクションが生成されました。`,
        });
        
        // 構造フェーズ完了をマーク
        completePhase('structure');
      } else {
        throw new Error('セクションが生成されませんでした');
      }
    } catch (error) {
      console.error('Structure analysis error:', error);
      setError((error as Error).message || '構造分析中にエラーが発生しました');
      
      toast({
        title: "エラーが発生しました",
        description: (error as Error).message || "構造分析中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 500);
    }
  };

  // デザイン生成ページへ進む
  const handleProceed = () => {
    if (sections.length === 0) {
      toast({
        title: "セクションがありません",
        description: "AIで構造を作成してからデザイン生成へ進んでください。",
        variant: "destructive",
      });
      return;
    }
    
    // 構造フェーズ完了をマーク
    completePhase('structure');
    
    // デザイン生成ページへ遷移
    router.push(`/lp/${lpId}/edit/design`);
  };

  // セクションの編集
  const handleEditSection = (id: string, field: string, value: any) => {
    setSectionsState(prev => {
      const updated = prev.map(section => 
        section.id === id 
          ? { ...section, [field]: value } 
          : section
      );
      
      // グローバルステートも更新
      setSections(updated);
      
      return updated;
    });
  };

  // セクションの削除
  const handleRemoveSection = (id: string) => {
    setSectionsState(prev => {
      const updated = prev.filter(section => section.id !== id);
      
      // 選択中のセクションを削除した場合、別のセクションを選択
      if (selectedSection === id && updated.length > 0) {
        setSelectedSection(updated[0].id);
        setExpandedSection(updated[0].id);
      } else if (updated.length === 0) {
        setSelectedSection(null);
        setExpandedSection(null);
      }
      
      // グローバルステートも更新
      setSections(updated);
      
      return updated;
    });
  };

  // 新規セクションの追加
  const handleAddSection = () => {
    const newId = `section-${Date.now()}`;
    const newPosition = sections.length > 0 
      ? Math.max(...sections.map(s => s.position)) + 1 
      : 0;
    
    const newSection: Section = {
      id: newId,
      type: 'custom',
      componentName: 'Custom',
      title: '新しいセクション',
      content: 'このセクションの内容を編集してください',
      position: newPosition,
      isTestable: false
    };
    
    setSectionsState(prev => {
      const updated = [...prev, newSection];
      
      // グローバルステートも更新
      setSections(updated);
      
      return updated;
    });
    
    // 新しいセクションを選択・展開
    setSelectedSection(newId);
    setExpandedSection(newId);
  };

  // セクションの並べ替え
  const handleReorderSections = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // positionプロパティを更新
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setSectionsState(updatedItems);
    
    // グローバルステートも更新
    setSections(updatedItems);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 分析中のプログレスバー */}
      {isAnalyzing && (
        <div className="px-6 py-3 bg-amber-50 border-b">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center mb-2">
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-amber-700" />
              <p className="text-sm font-medium text-amber-800">AIがLPの最適構造を分析中...</p>
            </div>
            <div className="flex items-center">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="ml-2 text-xs text-amber-700 font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && !isAnalyzing && (
        <div className="px-6 py-3 bg-red-50 border-b">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <p className="text-sm font-medium">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-red-700" 
                onClick={() => setError(null)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                再試行
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 左側: セクションリスト */}
        <div className="w-1/2 border-r bg-slate-50 overflow-y-auto p-6">
          <DirectoryTree 
            sections={sections}
            expandedSection={expandedSection}
            onToggleSection={setExpandedSection}
            onEditSection={handleEditSection}
            onRemoveSection={handleRemoveSection}
            onAddSection={handleAddSection}
            onReorderSections={handleReorderSections}
            onSelectSection={setSelectedSection}
            selectedSection={selectedSection}
          />
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="w-full"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  再分析中...
                </>
              ) : (
                <>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  AIで再分析
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 右側: プレビュー */}
        <div className="w-1/2 bg-white overflow-y-auto p-6">
          <SectionPreview 
            sections={sections}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
          />

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleProceed} 
              className="px-10 py-6 text-lg"
              disabled={sections.length === 0}
            >
              次のステップへ進む
            </Button>
          </div>
        </div>
      </div>

      {/* モバイル表示時のボトムナビゲーション */}
      <div className="md:hidden border-t p-4 bg-white">
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/lp/${lpId}/edit/generate`)}>
            戻る
          </Button>
          <Button onClick={handleProceed} disabled={sections.length === 0}>
            次のステップへ進む
          </Button>
        </div>
      </div>
    </div>
  );
}