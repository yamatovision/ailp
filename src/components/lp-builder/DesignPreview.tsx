'use client';

import { useState } from 'react';
import { Smartphone, Monitor, Wand2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// セクションの型
interface Section {
  id: string;
  name: string;
  status: string;
  variants: string[];
  active: string;
}

// セクションデータは実際のデータベースから取得するため、モックデータは削除

// デフォルトのHTMLテンプレート - APIから実際のデータで置き換え
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
    <p>このセクションのHTMLコンテンツはAPIから取得する必要があります。</p>
  </div>
</body>
</html>
`;

// バリアントBも同様にAPIから取得

type DesignPreviewProps = {
  onComplete: () => void;
};

export default function DesignPreview({ onComplete }: DesignPreviewProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [activeVariant, setActiveVariant] = useState('A');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [sectionHtmlA, setSectionHtmlA] = useState<string>(defaultHtmlTemplate);
  const [sectionHtmlB, setSectionHtmlB] = useState<string>(defaultHtmlTemplate);
  const [isLoadingHtml, setIsLoadingHtml] = useState<boolean>(false);

  // コンポーネントマウント時にAPIからセクションデータを取得
  useEffect(() => {
    const fetchSections = async () => {
      try {
        // 仮のAPIエンドポイント - 実際の実装ではこれを正しいものに置き換える
        const response = await fetch('/api/lp/current/components');
        if (response.ok) {
          const data = await response.json();
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
          }
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    
    fetchSections();
  }, []);

  // セクション選択ハンドラ
  const handleSectionSelect = (id: string) => {
    setSelectedSection(id);
    
    // セクションを変更したら、そのセクションのアクティブバリアントに合わせる
    const section = sections.find(s => s.id === id);
    if (section) {
      setActiveVariant(section.active);
      fetchSectionHtml(id);
    }
  };
  
  // APIからセクションHTMLを取得
  const fetchSectionHtml = async (sectionId: string) => {
    setIsLoadingHtml(true);
    try {
      const response = await fetch(`/api/lp/current/components/${sectionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.html) {
          setSectionHtmlA(data.html);
        }
        
        // バリアントBが存在すれば取得
        const currentSection = sections.find(s => s.id === sectionId);
        if (currentSection?.variants.includes('B')) {
          const variantResponse = await fetch(`/api/lp/current/components/${sectionId}/variants`);
          if (variantResponse.ok) {
            const variantData = await variantResponse.json();
            if (variantData.variants && variantData.variants.length > 0) {
              setSectionHtmlB(variantData.variants[0].html);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch section HTML:', error);
    } finally {
      setIsLoadingHtml(false);
    }
  };

  // バリアント選択ハンドラ
  const handleVariantSelect = (variant: string) => {
    setActiveVariant(variant);
  };

  // バリアントB作成ハンドラ
  const handleCreateVariantB = () => {
    // 実際はAPIコールなどで生成
    setIsModifying(true);
    setTimeout(() => {
      const updatedSections = mockSections.map(section => {
        if (section.id === selectedSection && !section.variants.includes('B')) {
          return {
            ...section,
            variants: [...section.variants, 'B']
          };
        }
        return section;
      });
      
      // ここでモックデータでは実際のステート更新ができないため、
      // 実際の実装では状態を更新する
      setActiveVariant('B');
      setIsModifying(false);
      setShowVariantDialog(false);
    }, 1500);
  };

  // 修正適用ハンドラ
  const handleApplyModification = () => {
    // 実際はAPIコールなどで修正
    setIsModifying(true);
    setTimeout(() => {
      setIsModifying(false);
      setModificationPrompt('');
    }, 1500);
  };

  // プレビューするHTMLの取得
  const getPreviewHtml = () => {
    if (isLoadingHtml) {
      return defaultHtmlTemplate.replace(
        '<h2>セクションのHTMLを生成中...</h2>',
        '<h2>セクションのHTMLを読み込み中...</h2>'
      );
    }
    
    if (activeVariant === 'A') {
      return sectionHtmlA || defaultHtmlTemplate;
    } else {
      return sectionHtmlB || defaultHtmlTemplate;
    }
  };

  // ステータスアイコンの取得
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <div className="h-2 w-2 rounded-full bg-green-500"></div>;
      case 'in_progress':
        return <div className="h-2 w-2 rounded-full bg-blue-500"></div>;
      case 'pending':
        return <div className="h-2 w-2 rounded-full bg-gray-400"></div>;
      default:
        return null;
    }
  };

  // セクションのアクティブ状態の取得
  const isSectionActive = (id: string) => {
    return id === selectedSection;
  };

  return (
    <div className="flex flex-col h-full">
      {/* メインコンテンツ - プレビュー */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex space-x-2 mr-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                    isSectionActive(section.id)
                      ? 'bg-primary text-white font-medium'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => handleSectionSelect(section.id)}
                >
                  {section.variants.length > 1 && (
                    <span className="mr-1.5 w-2 h-2 bg-green-400 rounded-full"></span>
                  )}
                  {section.name.replace('セクション', '')}
                </button>
              ))}
            </div>
          </div>
          
          <ButtonGroup>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              モバイル
            </Button>
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="h-4 w-4 mr-1" />
              デスクトップ
            </Button>
          </ButtonGroup>
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
                {sections.find(s => s.id === selectedSection)?.name || 'セクション未選択'} - バリアント{activeVariant}
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
              <ButtonGroup>
                <Button
                  variant={activeVariant === 'A' ? 'default' : 'outline'}
                  onClick={() => handleVariantSelect('A')}
                >
                  バリアントA
                </Button>
                
                {sections.find(s => s.id === selectedSection)?.variants.includes('B') ? (
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
              </ButtonGroup>
            </div>
            
            {/* 完了ボタン */}
            <Button 
              size="lg"
              onClick={onComplete}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">バリアントBの作成</h3>
              <p className="text-sm text-muted-foreground mb-4">
                現在のセクションの別バージョンを作成します。AIに指示を与えるか、AIにおまかせすることができます。
              </p>
              
              <Textarea
                placeholder="バリアントBの指示を入力... (例: 「より説得力のある表現にして」「違うレイアウトで」)"
                className="mb-4"
                rows={3}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVariantDialog(false)}
                >
                  キャンセル
                </Button>
                
                <Button
                  variant="outline"
                  className="bg-secondary/50 hover:bg-secondary/70"
                  onClick={handleCreateVariantB}
                  disabled={isModifying}
                >
                  AIにおまかせ
                </Button>
                
                <Button
                  onClick={handleCreateVariantB}
                  disabled={isModifying}
                >
                  {isModifying ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      生成中...
                    </>
                  ) : (
                    'バリアントB作成'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}