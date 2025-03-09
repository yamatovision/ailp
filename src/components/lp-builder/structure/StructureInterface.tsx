'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, ArrowRight, LayoutGrid, 
  AlertTriangle, RefreshCw, FileCode, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

import { useLPBuilder } from '../LPBuilderContext';
import { 
  analyzeStructure, 
  updateLP,
  createComponent,
  updateComponent,
  deleteComponent,
  updateComponentPositions,
  getComponents
} from '@/lib/api/lp';
import { Section } from '@/types/structure';
import DirectoryTree from './DirectoryTree';
import SectionPreview from './SectionPreview';

type StructureInterfaceProps = {
  lpId: string;
  onAnalyzeTriggered?: boolean;
  initialContent?: string;
  onAnalyzeComplete?: () => void;
};

// forwardRef を使用して外部からsaveStructureメソッドを呼び出せるようにする
const StructureInterface = React.forwardRef(({ lpId, onAnalyzeTriggered, initialContent = '', onAnalyzeComplete }: StructureInterfaceProps, ref) => {
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
  const [loading, setLoading] = useState(true);
  
  // コンポーネントの初期化
  useEffect(() => {
    // 初期読み込み完了のタイミングを制御
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);
  
  // 初期コンテンツが渡された場合にLPBuilderContextに反映
  useEffect(() => {
    if (initialContent && !state.lpContent) {
      console.log('StructureInterface: 初期コンテンツをコンテキストに設定', initialContent);
      // lpContentを直接使用するためのヘルパー関数がないため、外部から直接コンテキストに設定
      if (typeof window !== 'undefined') {
        try {
          const savedState = localStorage.getItem(`lp_builder_${lpId}`);
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            parsedState.lpContent = initialContent;
            localStorage.setItem(`lp_builder_${lpId}`, JSON.stringify(parsedState));
            console.log('初期LP内容をlocalStorageに保存しました');
            
            // 強制リロード - コンテキストを更新するため
            window.location.reload();
          }
        } catch (e) {
          console.error('初期コンテンツの設定エラー:', e);
        }
      }
    }
  }, [initialContent, state.lpContent, lpId]);
  
  // ページロード時にデータベースからコンポーネントをロード
  useEffect(() => {
    const initializeFromDatabase = async () => {
      // 初期読み込み中かつセクションが空の場合は、データベースからロード
      if (!loading && sections.length === 0) {
        try {
          console.log('データベースからコンポーネントをロードします...');
          const loaded = await loadComponentsFromDatabase();
          
          if (!loaded) {
            console.log('データベースにコンポーネントがないか、ロードに失敗しました');
            // データベースにセクションがない場合は、localStorage/contextが存在するか確認
            if (state.sections && state.sections.length > 0) {
              console.log('コンテキストからセクションをロードします:', state.sections.length, '個');
              setSectionsState(state.sections);
            } else {
              console.log('利用可能なセクションデータがありません');
            }
          }
        } catch (error) {
          console.error('初期化エラー:', error);
        }
      }
    };
    
    initializeFromDatabase();
  }, [loading, lpId]);

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
  
  // ローカルのセクションデータが変更されたらコンテキストを更新
  useEffect(() => {
    // 初回レンダリング時は更新しない
    if (!loading && sections.length > 0) {
      // 非同期にコンテキストを更新
      const updateContext = setTimeout(() => {
        setSections(sections);
      }, 0);
      
      return () => clearTimeout(updateContext);
    }
  }, [sections, loading, setSections]);
  
  // データベースからコンポーネントデータをロード
  const loadComponentsFromDatabase = async () => {
    try {
      console.log('データベースからコンポーネントをロード中...');
      
      // getComponentsでLPに関連付けられたコンポーネントを取得
      const components = await getComponents(lpId);
      
      if (components && components.length > 0) {
        console.log(`${components.length}個のコンポーネントをデータベースから取得しました`);
        
        // コンポーネントデータをSection形式に変換
        const loadedSections: Section[] = components.map((comp, index) => {
          // aiPromptまたはaiParametersからセクションデータを復元
          let title = '', content = '';
          
          try {
            if (comp.aiParameters) {
              const params = typeof comp.aiParameters === 'string' 
                ? JSON.parse(comp.aiParameters) 
                : comp.aiParameters;
                
              title = params.title || '';
              content = params.content || '';
            } else if (comp.aiPrompt) {
              const params = JSON.parse(comp.aiPrompt);
              title = params.title || '';
              content = params.content || '';
            }
          } catch (e) {
            console.error('コンポーネントパラメータの解析エラー:', e);
          }
          
          return {
            id: comp.id,
            type: comp.componentType || 'section',
            componentName: comp.componentType || 'Section',
            title: title || `セクション ${index + 1}`,
            content: content || '',
            position: comp.position || index
          };
        });
        
        // ソート
        loadedSections.sort((a, b) => a.position - b.position);
        
        // セクションデータを更新
        if (loadedSections.length > 0) {
          setSectionsState(loadedSections);
          
          // 最初のセクションを選択
          setSelectedSection(loadedSections[0].id);
          setExpandedSection(loadedSections[0].id);
          
          console.log('データベースからロードしたセクションデータで更新しました');
          return true;
        }
      } else {
        console.log('データベースにコンポーネントがありません');
      }
      
      return false;
    } catch (error) {
      console.error('コンポーネントのロードエラー:', error);
      return false;
    }
  };

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
      // コンテキストの現在の状態を確認
      console.log('コンテキスト内のLP情報:', {
        lpContent: state.lpContent,
        designStyle: state.designStyle,
        designDescription: state.designDescription
      });
      
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
        if (onAnalyzeComplete) {
          onAnalyzeComplete();
        }
      }, 500);
    }
  };

  // セクションデータをJSON文字列に変換
  const serializeSections = () => {
    try {
      // セクションデータをJSON形式で保存できるよう文字列に変換
      return JSON.stringify(sections);
    } catch (error) {
      console.error('セクションシリアライズエラー:', error);
      return '';
    }
  };
  
  // LPの基本情報のみを保存（SECTIONS_DATA付与なし）
  const saveLPBasicInfo = async () => {
    try {
      // LPの基本情報のみを更新
      const result = await updateLP(lpId, {
        title: state.title,
        // SECTIONS_DATAのみを別途保存するため、ここでは本来のコンテンツのみ
        description: state.lpContent || ''
      });
      
      return result;
    } catch (error) {
      console.error('LP基本情報の保存エラー:', error);
      throw error;
    }
  };

  // セクションデータをLpComponentテーブルに保存（並列処理から逐次処理に変更）
  const saveComponentsToDatabase = async () => {
    try {
      // 進捗表示
      const startSaving = performance.now();
      console.log('コンポーネントの保存を開始:', sections.length, '個のセクション');
      
      // デバッグ：全セクションの詳細をログ出力
      console.log('保存予定のセクション詳細:', sections.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        position: s.position
      })));
      
      // 保存結果の統計
      let savedComponents = [];
      let successCount = 0;
      let failedSections = [];
      
      // 各セクションを一つずつ順番に保存（エラーを個別に処理）
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        try {
          // 保存の前にコンポーネントが有効かチェック
          if (!section || !section.id) {
            console.error(`セクション ${i+1} は無効です:`, section);
            failedSections.push({ index: i, reason: 'Invalid section data' });
            continue;
          }
          
          // コンポーネントタイプをPrismaモデルに合わせる
          const componentType = section.type || 'section';
          
          // AIプロンプト情報
          const aiParams = {
            title: section.title,
            content: section.content
          };
          
          console.log(`セクション ${i+1}/${sections.length} (${section.title}) の保存開始...`);
          
          // 新規コンポーネントを作成（一つずつ保存）
          const component = await createComponent(lpId, {
            componentType: componentType,
            position: section.position || i,
            aiPrompt: JSON.stringify(aiParams),
            aiParameters: aiParams
          });
          
          console.log(`セクション ${i+1}/${sections.length} を保存完了:`, component.id);
          savedComponents.push(component);
          successCount++;
        } catch (err) {
          console.error(`セクション ${i+1} (${section?.title || 'unknown'}) の保存に失敗:`, err);
          failedSections.push({ index: i, section: section, error: err });
        }
      }
      
      const endSaving = performance.now();
      console.log(
        'すべてのコンポーネント保存完了:', 
        successCount, '個成功 / ', 
        failedSections.length, '個失敗, 処理時間:', 
        Math.round(endSaving - startSaving), 'ms'
      );
      
      // 失敗したセクションがある場合は通知
      if (failedSections.length > 0) {
        console.error(`${failedSections.length}個のセクションの保存に失敗しました:`, failedSections);
        
        toast({
          title: `${failedSections.length}個のセクションが保存できませんでした`,
          description: "一部のセクションの保存に失敗しました。もう一度お試しください。",
          variant: "warning",
        });
      } else if (successCount > 0) {
        toast({
          title: "保存完了",
          description: `${successCount}個のセクションを正常に保存しました`,
        });
      }
      
      return savedComponents;
    } catch (error) {
      console.error('コンポーネント全体の保存処理でエラー:', error);
      throw error;
    }
  };
  
  // 既存のコンポーネントを削除
  const clearExistingComponents = async () => {
    try {
      // 既存のコンポーネントを取得
      const existingComponents = await getComponents(lpId);
      
      if (existingComponents.length > 0) {
        console.log(`${existingComponents.length}個の既存コンポーネントを削除します...`);
        
        // 既存コンポーネントを削除
        await Promise.all(
          existingComponents.map(comp => deleteComponent(comp.id))
        );
        
        console.log(`${existingComponents.length}個の既存コンポーネントを削除しました`);
      } else {
        console.log('削除すべき既存コンポーネントがありません');
      }
      
      return true;
    } catch (error) {
      console.error('既存コンポーネント削除エラー:', error);
      return false;
    }
  };
  
  // 保存中フラグを追加
  const [isSaving, setIsSaving] = useState(false);

  // ref経由で外部から呼び出せるようにする
  React.useImperativeHandle(ref, () => ({
    saveStructure: async () => saveStructure()
  }));

  // セクションデータを保存（デバウンスとフラグ付き実装）
  const saveStructure = async () => {
    // 既に保存中なら処理をスキップ
    if (isSaving) {
      console.log('既に保存処理中のため、新しい保存リクエストはスキップします');
      return;
    }

    try {
      // 保存中フラグを設定
      setIsSaving(true);
      
      // 保存開始
      console.log('===== 構造データの保存を開始 =====');
      console.log(`保存するセクション数: ${sections.length}個`);
      
      // セクションの概要をログ出力
      sections.forEach((section, index) => {
        console.log(`セクション ${index + 1}: ID=${section.id}, タイトル="${section.title}", タイプ=${section.type}`);
      });
      
      // 1. LPの基本情報を保存
      const lpInfo = await saveLPBasicInfo();
      console.log('LP基本情報を保存しました:', lpInfo);
      
      // 2. 既存のコンポーネントを削除（新規作成のため）
      await clearExistingComponents();
      
      // 3. 新しいセクションをコンポーネントとして保存
      console.log('新しいセクションをコンポーネントとして保存します...');
      const savedComponents = await saveComponentsToDatabase();
      console.log('保存完了したコンポーネント:', savedComponents);
      
      // 4. LocalStorageにはSECTIONS_DATAとしてのみ保存する
      if (typeof window !== 'undefined') {
        try {
          // セクションデータのみをHTML形式でコメントとして保存
          const sectionsJson = JSON.stringify(sections);
          const sectionsData = `<!-- SECTIONS_DATA: ${sectionsJson} -->`;
          
          // LP descriptionフィールドの末尾にSECTIONS_DATAを追加
          await updateLP(lpId, {
            description: `${state.lpContent || ''}\n\n${sectionsData}`
          });
          
          console.log('SECTIONS_DATAをLP descriptionの末尾に保存しました');
        } catch (e) {
          console.error('SECTIONS_DATA保存エラー:', e);
        }
      }
      
      console.log(`===== 構造データの保存完了: ${savedComponents?.length || 0}個のセクションを保存 =====`);
      
      // 成功通知
      toast({
        title: "構造データを保存しました",
        description: `${savedComponents?.length || 0}個のセクションをデータベースに保存しました`,
      });
      
      return savedComponents;
    } catch (error) {
      console.error('構造データ保存エラー:', error);
      toast({
        title: "保存エラー",
        description: "構造データの保存中にエラーが発生しました",
        variant: "destructive"
      });
      
      // エラー通知も行うが、次ステップに進むなど一部処理は続行させるため、エラーは再スローしない
    } finally {
      // 処理完了後にフラグを解除
      setIsSaving(false);
    }
  };

  // デザイン生成ページへ進む
  const handleProceed = async () => {
    if (sections.length === 0) {
      toast({
        title: "セクションがありません",
        description: "AIで構造を作成してからデザイン生成へ進んでください。",
        variant: "destructive",
      });
      return;
    }
    
    // 既に保存処理中なら通知だけして進む
    if (isSaving) {
      toast({
        title: "保存処理中",
        description: "データを保存中です。デザイン生成ページに進みます。",
      });
      
      // 構造フェーズ完了をマーク
      completePhase('structure');
      
      // 保存を待たずに遷移
      router.push(`/lp/${lpId}/edit/design`);
      return;
    }
    
    // 構造フェーズ完了をマーク
    completePhase('structure');
    
    try {
      // 保存中フラグを設定
      setIsSaving(true);
      
      // データを保存
      await saveStructure();
      
      // デザイン生成ページへ遷移
      router.push(`/lp/${lpId}/edit/design`);
    } finally {
      // 処理完了後にフラグを解除
      setIsSaving(false);
    }
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
      position: newPosition
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
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="w-full"
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    AIで構造作成
                  </>
                )}
              </Button>
              
              <Button 
                onClick={saveStructure} 
                className="w-full"
                variant="outline"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 右側: プレビュー */}
        <div className="w-1/2 bg-white overflow-y-auto p-6">
          <SectionPreview 
            sections={sections}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
          />

          <div className="mt-6 flex justify-between">
            <Button 
              onClick={saveStructure} 
              variant="outline"
              className="px-6"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
            
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
          <Button variant="outline" onClick={saveStructure} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
          <Button onClick={handleProceed} disabled={sections.length === 0}>
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
});

// 表示名を設定
StructureInterface.displayName = "StructureInterface";

export default StructureInterface;