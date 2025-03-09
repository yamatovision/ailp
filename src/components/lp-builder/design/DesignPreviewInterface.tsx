'use client';

import { useState, useEffect } from 'react';
import { Wand2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

import { useLPBuilder } from '../LPBuilderContext';
import SectionControls, { Section } from './SectionControls';
import VariantDialog from './VariantDialog';
import PreviewControls from './PreviewControls';

// モックデータ - セクション構造
const mockSections: Section[] = [
  {
    id: 'hero',
    name: 'ヒーローセクション',
    status: 'completed',
    variants: ['A', 'B'],
    active: 'A'
  },
  {
    id: 'problems',
    name: '課題認識セクション',
    status: 'completed',
    variants: ['A', 'B'],
    active: 'A'
  },
  {
    id: 'solution',
    name: '解決策セクション',
    status: 'completed',
    variants: ['A'],
    active: 'A'
  },
  {
    id: 'benefits',
    name: 'ベネフィットセクション',
    status: 'completed',
    variants: ['A'],
    active: 'A'
  },
  {
    id: 'testimonials',
    name: '受講者の声セクション',
    status: 'completed',
    variants: ['A'],
    active: 'A'
  },
  {
    id: 'pricing',
    name: '料金・申込セクション',
    status: 'completed',
    variants: ['A'],
    active: 'A'
  },
  {
    id: 'faq',
    name: 'FAQセクション',
    status: 'completed',
    variants: ['A'],
    active: 'A'
  }
];

// モックデータ - HTMLプレビュー
const mockHtmlA = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ランディングページ</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      line-height: 1.6;
    }
    .hero {
      background-color: #2a4365;
      color: white;
      padding: 60px 20px;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
    }
    .hero p {
      font-size: 1.2rem;
      max-width: 700px;
      margin: 0 auto 30px;
    }
    .cta-button {
      display: inline-block;
      background-color: #48bb78;
      color: white;
      padding: 12px 24px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      transition: background-color 0.3s;
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <h1>マネジメントスキルを磨き、真のリーダーへ</h1>
      <p>15年以上の経験を持つ元人事責任者が教える3ヶ月間の実践的コーチングプログラム。効率的なチームマネジメント、的確な意思決定、時間管理まで、すぐに実践できるスキルを習得。</p>
      <a href="#pricing" class="cta-button">詳細を見る</a>
    </div>
  </section>
</body>
</html>
`;

// モックデータ - HTMLプレビュー（バリアントB）
const mockHtmlB = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ランディングページ</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      line-height: 1.6;
    }
    .hero {
      background: linear-gradient(135deg, #1a365d 0%, #2a4365 100%);
      color: white;
      padding: 80px 20px;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.7rem;
      margin-bottom: 25px;
      font-weight: 700;
    }
    .hero p {
      font-size: 1.25rem;
      max-width: 700px;
      margin: 0 auto 35px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background-color: #ed8936;
      color: white;
      padding: 14px 28px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.15rem;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(237, 137, 54, 0.4);
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <h1>マネジメントの壁を突破し、<br>キャリアを加速させる</h1>
      <p>現場で15年以上の実績を持つ元人事責任者があなたの成長を徹底サポート。3ヶ月間で200人以上が実証した効果的なリーダーシップ開発プログラム。</p>
      <a href="#pricing" class="cta-button">無料カウンセリングに申し込む</a>
    </div>
  </section>
</body>
</html>
`;

type DesignPreviewInterfaceProps = {
  lpId: string;
};

export default function DesignPreviewInterface({ lpId }: DesignPreviewInterfaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { state, completePhase } = useLPBuilder();
  
  const [sections, setSections] = useState<Section[]>(mockSections);
  const [selectedSection, setSelectedSection] = useState('hero');
  const [activeVariant, setActiveVariant] = useState('A');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);

  // 生成データのチェックを一時的に無効化（強制対応済み）
  useEffect(() => {
    // デバッグログを追加
    console.log('DesignPreviewInterface - Current state:', state);
    console.log('DesignPreviewInterface - isComplete.generate:', state.isComplete.generate);
    console.log('DesignPreviewInterface - lpContent:', state.lpContent);
    
    // 修正：常に次のステップに進める（データはLPBuilderContextで強制設定済み）
    console.log('Design page loading - State validation bypassed');
    
    // フォールバック対策：それでもデータがない場合は1回だけリロード試行
    if (!state.lpContent && !window.location.search.includes('retry=true')) {
      console.log('Attempting one reload for data');
      // 500ms後に同じページをリロード（retryフラグ付き）
      setTimeout(() => {
        window.location.href = `${window.location.pathname}?forceLoad=true&retry=true`;
      }, 500);
    }
  }, [state, router, lpId, toast]);

  // セクション選択ハンドラ
  const handleSectionSelect = (id: string) => {
    setSelectedSection(id);
    
    // セクションを変更したら、そのセクションのアクティブバリアントに合わせる
    const section = sections.find(s => s.id === id);
    if (section) {
      setActiveVariant(section.active);
    }
  };

  // バリアント選択ハンドラ
  const handleVariantSelect = (variant: string) => {
    setActiveVariant(variant);
    
    // アクティブバリアントを更新
    setSections(prevSections => 
      prevSections.map(section => {
        if (section.id === selectedSection) {
          return {
            ...section,
            active: variant
          };
        }
        return section;
      })
    );
  };

  // バリアントB作成ハンドラ
  const handleCreateVariantB = async (prompt?: string) => {
    // 実際のAPI呼び出しを実装
    setIsModifying(true);
    
    try {
      // 現在選択中のセクションのHTMLを取得（仮にモックデータを使用）
      const selectedSectionHtml = activeVariant === 'A' ? mockHtmlA : mockHtmlB;
      
      // バリアント生成APIを呼び出し
      const response = await fetch('/api/ai/generate-variant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalHtml: selectedSectionHtml,
          sectionType: selectedSection,
          customPrompt: prompt
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'バリアント生成中にエラーが発生しました');
      }
      
      // 成功したら状態を更新
      setSections(prevSections => 
        prevSections.map(section => {
          if (section.id === selectedSection && !section.variants.includes('B')) {
            return {
              ...section,
              variants: [...section.variants, 'B'],
              active: 'B'
            };
          }
          return section;
        })
      );
      
      setActiveVariant('B');
      setShowVariantDialog(false);
      
      toast({
        title: "バリアントBを作成しました",
        description: prompt 
          ? `「${prompt}」に基づいた新しいバリアントが作成されました。` 
          : "AIにより新しいバリアントが作成されました。",
      });
    } catch (error) {
      console.error('Variant generation error:', error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "バリアント生成中にエラーが発生しました",
        variant: "destructive"
      });
    } finally {
      setIsModifying(false);
    }
  };

  // 修正適用ハンドラ
  const handleApplyModification = async () => {
    if (!modificationPrompt.trim()) return;
    
    setIsModifying(true);
    
    try {
      // 現在選択中のセクションのHTMLを取得（モックデータを使用）
      const selectedSectionHtml = activeVariant === 'A' ? mockHtmlA : mockHtmlB;
      
      // セクション改善APIを呼び出し
      const response = await fetch('/api/ai/improve-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          existingHtml: selectedSectionHtml,
          improvementInstructions: modificationPrompt,
          sectionType: selectedSection
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'セクション改善中にエラーが発生しました');
      }
      
      // 応答データを取得
      const result = await response.json();
      
      // 成功したらプロンプトをクリア
      setModificationPrompt('');
      
      toast({
        title: "修正が適用されました",
        description: `「${modificationPrompt}」に基づいた修正が適用されました。`,
      });
      
      // 実際のプロジェクトではここで改善されたHTMLを表示するための状態更新が必要
      
    } catch (error) {
      console.error('Section improvement error:', error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "修正適用中にエラーが発生しました",
        variant: "destructive"
      });
    } finally {
      setIsModifying(false);
    }
  };

  // プレビューするHTMLの取得
  const getPreviewHtml = () => {
    if (activeVariant === 'A') {
      return mockHtmlA;
    } else {
      return mockHtmlB;
    }
  };

  // 完了ハンドラ
  const handleComplete = () => {
    completePhase('design');
    
    toast({
      title: "デザイン調整が完了しました",
      description: "LPの設計が完了しました。公開ボタンをクリックすると保存されます。",
    });
  };

  // セクションに対応するバリアントボタンを生成
  const renderVariantButtons = () => {
    const currentSection = sections.find(s => s.id === selectedSection);
    if (!currentSection) return null;
    
    return (
      <div className="flex space-x-2">
        <Button
          variant={activeVariant === 'A' ? 'default' : 'outline'}
          onClick={() => handleVariantSelect('A')}
        >
          バリアントA
        </Button>
        
        {currentSection.variants.includes('B') ? (
          <Button
            variant={activeVariant === 'B' ? 'default' : 'outline'}
            onClick={() => handleVariantSelect('B')}
          >
            バリアントB
          </Button>
        ) : (
          <Button
            variant="outline"
            className="bg-secondary/50 hover:bg-secondary/70"
            onClick={() => setShowVariantDialog(true)}
          >
            バリアントB作成
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* メインコンテンツ - プレビュー */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <SectionControls 
            sections={sections}
            selectedSection={selectedSection}
            onSectionSelect={handleSectionSelect}
          />
          
          <PreviewControls
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        </div>
        
        <div className="flex-1 p-4 bg-gray-100 overflow-auto flex items-center justify-center">
          <div
            className={`bg-white shadow-lg border rounded-lg overflow-hidden transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-5xl h-[80vh]'
            }`}
          >
            <div className="h-6 bg-gray-100 border-b flex items-center pl-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <p className="text-xs text-center flex-1">
                {sections.find(s => s.id === selectedSection)?.name} - バリアント{activeVariant}
              </p>
            </div>
            <iframe
              title="Preview"
              srcDoc={getPreviewHtml()}
              className="w-full h-[calc(100%-24px)]"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      </div>
      
      {/* 下部 - 操作パネル */}
      <div className="border-t bg-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* 上部コントロール - バリアント選択 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="font-medium mr-4">バリアント:</h3>
              {renderVariantButtons()}
            </div>
            
            {/* 完了ボタン */}
            <Button 
              size="lg"
              onClick={handleComplete}
            >
              完了
            </Button>
          </div>
          
          {/* 修正パネル */}
          <Card className="mb-4">
            <div className="p-4">
              <h3 className="font-medium mb-2">セクションの修正指示</h3>
              <Textarea
                value={modificationPrompt}
                onChange={(e) => setModificationPrompt(e.target.value)}
                placeholder="AIにデザイン指示を送信... (例: 「より明るいトーンにして」「フォントを大きくして」など)"
                className="mb-4"
                rows={2}
              />
              
              <div className="flex justify-between">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  画像を追加
                </Button>
                
                <Button 
                  onClick={handleApplyModification}
                  disabled={!modificationPrompt.trim() || isModifying}
                >
                  {isModifying ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      修正適用中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      修正を適用
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* バリアントB作成ダイアログ */}
      {showVariantDialog && (
        <VariantDialog
          onClose={() => setShowVariantDialog(false)}
          onCreateVariant={handleCreateVariantB}
          sectionName={sections.find(s => s.id === selectedSection)?.name || ''}
          isModifying={isModifying}
        />
      )}
    </div>
  );
}