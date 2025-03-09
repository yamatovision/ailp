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

// セクションデータは実際のデータベースや状態から取得するため、モックデータは削除

// デフォルトのHTMLテンプレート - 後でAPIから実際のデータで置き換え
const defaultHtmlTemplate = `
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
  </style>
</head>
<body>
  <div style="padding: 30px; text-align: center; background-color: #f0f0f0;">
    <h2>セクションのHTMLを生成中...</h2>
    <p>このセクションのHTMLコンテンツはAPI呼び出しによって生成されます。</p>
  </div>
</body>
</html>
`;

// バリアントBも同様にデフォルトテンプレート

type DesignPreviewInterfaceProps = {
  lpId: string;
};

export default function DesignPreviewInterface({ lpId }: DesignPreviewInterfaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { state, completePhase } = useLPBuilder();
  
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('hero');
  const [activeVariant, setActiveVariant] = useState('A');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);

  // API呼び出しでセクションデータを取得
  useEffect(() => {
    // デバッグログを追加
    console.log('DesignPreviewInterface - Current state:', state);
    
    const fetchSections = async () => {
      try {
        // LPのセクション情報を取得
        const response = await fetch(`/api/lp/${lpId}/components`);
        if (!response.ok) {
          throw new Error('セクションデータの取得に失敗しました');
        }
        
        const data = await response.json();
        console.log('Fetched section data:', data);
        
        // セクションデータを状態に設定
        if (data.components && data.components.length > 0) {
          const formattedSections = data.components.map((comp: any) => ({
            id: comp.id,
            name: comp.name || `${comp.componentType}セクション`,
            status: 'completed',
            variants: comp.variants ? ['A', 'B'] : ['A'],
            active: 'A'
          }));
          
          setSections(formattedSections);
          
          // 最初のセクションを選択
          if (formattedSections.length > 0) {
            setSelectedSection(formattedSections[0].id);
          }
        } else {
          // データがない場合は構造ページから取得
          toast({
            title: "セクションデータがありません",
            description: "先に構造を設定してください",
            variant: "destructive"
          });
          
          // 構造ページにリダイレクト
          setTimeout(() => {
            router.push(`/lp/${lpId}/edit/structure`);
          }, 1500);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
        toast({
          title: "エラーが発生しました",
          description: error instanceof Error ? error.message : "セクションデータの取得に失敗しました",
          variant: "destructive"
        });
      }
    };
    
    fetchSections();
  }, [lpId, router, toast, state]);

  // セクション選択ハンドラ
  const handleSectionSelect = (id: string) => {
    console.log('Selected section with ID:', id);
    
    // IDが存在するか確認
    const section = sections.find(s => s.id === id);
    if (section) {
      setSelectedSection(id);
      setActiveVariant(section.active);
    } else {
      console.error('Invalid section ID selected:', id);
      // 最初のセクションをデフォルトで選択
      if (sections.length > 0) {
        setSelectedSection(sections[0].id);
        setActiveVariant(sections[0].active);
      }
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
      // 現在選択中のセクションのHTMLを取得（実際のAPIから取得したHTML）
      const selectedSectionHtml = await getSelectedSectionHtml();
      
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
      // 現在選択中のセクションのHTMLを取得（実際のAPIから取得）
      const selectedSectionHtml = await getSelectedSectionHtml();
      
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

  // 選択中のセクションのHTMLを取得（APIから）
  const [sectionHtmlA, setSectionHtmlA] = useState<string>(defaultHtmlTemplate);
  const [sectionHtmlB, setSectionHtmlB] = useState<string>(defaultHtmlTemplate);
  const [isLoadingHtml, setIsLoadingHtml] = useState<boolean>(false);

  // 選択されたセクションが変更されたらHTMLを取得
  useEffect(() => {
    if (selectedSection) {
      fetchSectionHtml();
    }
  }, [selectedSection]);

  // APIからセクションHTMLを取得（エラーハンドリング強化）
  const fetchSectionHtml = async () => {
    setIsLoadingHtml(true);
    console.log('Fetching HTML for section:', selectedSection, 'from sections:', sections);
    
    // 選択されているセクションが文字列の場合（例："hero"）、IDを見つける
    let sectionId = selectedSection;
    if (typeof selectedSection === 'string' && sections.length > 0) {
      // 念のため、IDとして使えるか確認
      const sectionById = sections.find(s => s.id === selectedSection);
      if (!sectionById) {
        // IDとして見つからない場合、名前に含まれるかチェック
        const sectionByType = sections.find(s => 
          s.name?.toLowerCase().includes(selectedSection.toLowerCase())
        );
        if (sectionByType) {
          sectionId = sectionByType.id;
          console.log('Mapped section type to ID:', selectedSection, '->', sectionId);
        } else if (sections.length > 0) {
          // 見つからなければ最初のセクションを使用
          sectionId = sections[0].id;
          console.log('Section not found, using first section instead:', sectionId);
        }
      }
    }
    
    try {
      // セクションIDが無効な場合に早期リターン
      if (!sectionId) {
        console.error('Invalid section ID, cannot fetch HTML');
        setSectionHtmlA(defaultHtmlTemplate.replace(
          '<h2>セクションのHTMLを生成中...</h2>',
          '<h2>セクションが見つかりません</h2>'
        ));
        setSectionHtmlB(defaultHtmlTemplate.replace(
          '<h2>セクションのHTMLを生成中...</h2>',
          '<h2>セクションが見つかりません</h2>'
        ));
        return;
      }
      
      // バリアントAのHTML取得
      try {
        const responseA = await fetch(`/api/lp/${lpId}/components/${sectionId}`);
        if (responseA.ok) {
          const dataA = await responseA.json();
          if (dataA.html) {
            setSectionHtmlA(dataA.html);
          } else {
            console.warn('HTML content missing in API response');
            setSectionHtmlA(defaultHtmlTemplate.replace(
              '<h2>セクションのHTMLを生成中...</h2>',
              '<h2>セクションのHTMLが見つかりません</h2>'
            ));
          }
        } else {
          console.error('Error fetching section HTML:', responseA.status, responseA.statusText);
          // エラーメッセージを表示するHTMLを設定
          setSectionHtmlA(defaultHtmlTemplate.replace(
            '<h2>セクションのHTMLを生成中...</h2>',
            `<h2>セクションHTMLの取得に失敗しました: ${responseA.status}</h2>
             <p>サーバーエラーが発生しました。もう一度試すか、管理者に問い合わせてください。</p>`
          ));
        }
      } catch (errorA) {
        console.error('Exception fetching variant A HTML:', errorA);
        setSectionHtmlA(defaultHtmlTemplate.replace(
          '<h2>セクションのHTMLを生成中...</h2>',
          '<h2>ネットワークエラー</h2><p>サーバーに接続できませんでした。</p>'
        ));
      }
      
      // バリアントBが存在すれば取得
      try {
        const currentSection = sections.find(s => s.id === sectionId);
        if (currentSection?.variants?.includes('B')) {
          const responseB = await fetch(`/api/lp/${lpId}/components/${sectionId}/variants`);
          if (responseB.ok) {
            const dataB = await responseB.json();
            if (dataB.variants && dataB.variants.length > 0) {
              setSectionHtmlB(dataB.variants[0].html);
            } else {
              console.warn('No variant B found for section', sectionId);
              setSectionHtmlB(defaultHtmlTemplate.replace(
                '<h2>セクションのHTMLを生成中...</h2>',
                '<h2>バリアントBはまだ作成されていません</h2>'
              ));
            }
          } else {
            console.error('Error fetching variant B:', responseB.status, responseB.statusText);
            setSectionHtmlB(defaultHtmlTemplate.replace(
              '<h2>セクションのHTMLを生成中...</h2>',
              `<h2>バリアントBの取得に失敗しました: ${responseB.status}</h2>`
            ));
          }
        } else {
          console.log('No variant B available for section', sectionId);
          setSectionHtmlB(defaultHtmlTemplate.replace(
            '<h2>セクションのHTMLを生成中...</h2>',
            '<h2>バリアントBはまだ作成されていません</h2>'
          ));
        }
      } catch (errorB) {
        console.error('Exception fetching variant B HTML:', errorB);
        setSectionHtmlB(defaultHtmlTemplate.replace(
          '<h2>セクションのHTMLを生成中...</h2>',
          '<h2>バリアントBの読み込みに失敗しました</h2>'
        ));
      }
    } catch (error) {
      console.error('Overall error fetching section HTML:', error);
      // エラーメッセージを設定
      setSectionHtmlA(defaultHtmlTemplate.replace(
        '<h2>セクションのHTMLを生成中...</h2>',
        '<h2>エラーが発生しました</h2><p>HTMLの読み込み中に問題が発生しました。</p>'
      ));
      setSectionHtmlB(defaultHtmlTemplate.replace(
        '<h2>セクションのHTMLを生成中...</h2>',
        '<h2>エラーが発生しました</h2><p>HTMLの読み込み中に問題が発生しました。</p>'
      ));
    } finally {
      setIsLoadingHtml(false);
    }
  };

  // 現在選択中のセクションのHTMLを取得
  const getSelectedSectionHtml = async (): Promise<string> => {
    // APIから最新のHTMLを取得
    await fetchSectionHtml();
    // 現在のバリアントに応じたHTMLを返す
    return activeVariant === 'A' ? sectionHtmlA : sectionHtmlB;
  };

  // プレビューするHTMLの取得（Tailwindベースのアプローチに対応）
  const getPreviewHtml = () => {
    if (isLoadingHtml) {
      return defaultHtmlTemplate.replace(
        '<h2>セクションのHTMLを生成中...</h2>',
        '<h2>セクションのHTMLを読み込み中...</h2>'
      );
    }
    
    // 表示するHTML
    const htmlContent = activeVariant === 'A' ? sectionHtmlA : sectionHtmlB;
    
    // HTMLが存在しない場合は代替表示
    if (!htmlContent) {
      return defaultHtmlTemplate.replace(
        '<h2>セクションのHTMLを生成中...</h2>',
        '<h2>このセクションのHTMLはまだ生成されていません</h2>'
      );
    }
    
    // すでに完全なHTMLドキュメントの場合はそのまま返す
    if (htmlContent.includes('<!DOCTYPE html>') || htmlContent.includes('<html')) {
      return htmlContent;
    }
    
    // HTMLコンテンツのみの場合はラッパーで包む
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#8B5CF6',
            secondary: '#2DD4FF'
          }
        }
      }
    }
  </script>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
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