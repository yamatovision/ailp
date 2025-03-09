'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Eye, RefreshCw, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { useLPBuilder } from '../LPBuilderContext';
import { updateLP, generateLP, saveDesignSystem, getDesignSystem } from '@/lib/api/lp';
import { DesignSystemGenerator } from '@/lib/ai/design-system-generator';

// デバッグログを追加
console.log("GenerateInterface: updateLP関数のインポート確認:", typeof updateLP);

// デザインスタイルの型
interface DesignStyle {
  id: string;
  name: string;
  description: string;
  colors: string;
  image?: string;
}

// モックデータ - デザインスタイル選択肢
const designStyles: DesignStyle[] = [
  {
    id: 'modern',
    name: 'モダン',
    description: 'クリーンで洗練されたデザイン。余白を活かした広々としたレイアウト。',
    colors: 'グレー、ホワイト、アクセントカラー',
    image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'corporate',
    name: 'コーポレート',
    description: 'ビジネス向けの堅実なデザイン。信頼感と専門性を強調。',
    colors: 'ブルー、グレー、ネイビー',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'vibrant',
    name: '活気あるデザイン',
    description: '明るい色と動きのあるデザイン。エネルギッシュで魅力的。',
    colors: 'オレンジ、ブルー、グリーン',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'minimal',
    name: 'ミニマル',
    description: 'シンプルで必要最小限のデザイン。情報を明確に伝える。',
    colors: 'モノクロ + 1色のアクセント',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  }
];

type GenerateInterfaceProps = {
  lpId: string;
  initialContent?: string;
};

export default function GenerateInterface({ lpId, initialContent = '' }: GenerateInterfaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { state, setLPContent, setTitle, completePhase } = useLPBuilder();
  
  // コンテンツ自動生成
  const generateContent = () => {
    // AIチャットから情報を抽出して構造化
    let content = '';
    
    // ユーザーメッセージを抽出（単純化のため、すべてのユーザーメッセージを連結）
    const userMessages = state.chatMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
    
    // コンテンツに追加
    content = `# LP内容の概要\n\n${userMessages}`;
    
    return content;
  };

  // 初期値の優先順位: 
  // 1. コンテキストのLP内容
  // 2. propsで渡されたinitialContent
  // 3. 自動生成コンテンツ
  const [lpContent, setContentState] = useState(state.lpContent || initialContent || generateContent());
  
  // コンポーネントマウント時、初期コンテンツをコンテキストに設定
  useEffect(() => {
    console.log('初期LP内容を設定:', lpContent);
    if (lpContent && !state.lpContent) {
      setLPContent(lpContent, state.designStyle || 'corporate', state.designDescription || '');
    }
  }, []);
  const [selectedStyle, setSelectedStyle] = useState(state.designStyle || 'corporate');
  const [designDescription, setDesignDescription] = useState(state.designDescription || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [designSystem, setDesignSystem] = useState(null);
  const [isGeneratingDesignSystem, setIsGeneratingDesignSystem] = useState(false);
  
  // 新しい状態を追加
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#6B7280');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#111827');
  const [selectedFont, setSelectedFont] = useState('inter');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);

  // 初期化処理
  useEffect(() => {
    // この画面が最初のステップなので、特別な初期化は不要
    console.log('Generate interface initialized');
    
    // 既存のスタイルが選択されている場合、初期表示時にデザインシステムを生成
    if (selectedStyle && !designSystem) {
      // 既存のデザインシステムを取得を試みる
      fetchExistingDesignSystem();
    }
  }, []);
  
  // 既存のデザインシステムを取得する関数
  const fetchExistingDesignSystem = useCallback(async () => {
    if (!lpId) return;
    
    try {
      // 1. まずローカルストレージを確認
      if (typeof window !== 'undefined') {
        const storedDesignSystem = localStorage.getItem(`design_system_full_${lpId}`);
        if (storedDesignSystem) {
          const parsedDesignSystem = JSON.parse(storedDesignSystem);
          console.log('ローカルストレージからデザインシステムを読み込みました');
          setDesignSystem(parsedDesignSystem);
          
          // 色情報やフォントなどの追加情報を設定
          updateDesignSettings(parsedDesignSystem);
          return;
        }
      }
      
      // 2. APIからデザインシステムを取得
      const result = await getDesignSystem(lpId);
      if (result && result.designSystem) {
        console.log('APIからデザインシステムを取得しました');
        setDesignSystem(result.designSystem);
        
        // 色情報やフォントなどの追加情報を設定
        updateDesignSettings(result.designSystem);
        
        // コンテキストにも設定
        try {
          const { setDesignSystem } = useLPBuilder();
          if (setDesignSystem) {
            setDesignSystem(result.designSystem);
          }
        } catch (e) {
          console.error('コンテキスト更新エラー:', e);
        }
        
        // ローカルストレージにも保存
        if (typeof window !== 'undefined') {
          localStorage.setItem(`design_system_full_${lpId}`, JSON.stringify(result.designSystem));
        }
        
        return;
      }
      
      // 3. デザインシステムが見つからない場合は新規生成
      console.log('既存のデザインシステムが見つからないため新規生成します');
      generateDesignSystem(selectedStyle, designDescription);
      
    } catch (error) {
      console.error('デザインシステム取得エラー:', error);
      // エラー時は新規生成
      generateDesignSystem(selectedStyle, designDescription);
    }
  }, [lpId, selectedStyle, designDescription]);
  
  // デザインシステムから色情報やフォントなどの設定を更新する関数
  const updateDesignSettings = useCallback((designSystemData: any) => {
    if (!designSystemData) return;
    
    try {
      // 色情報があれば設定
      if (designSystemData.colors) {
        if (designSystemData.colors.primary) {
          setPrimaryColor(designSystemData.colors.primary);
        }
        if (designSystemData.colors.secondary) {
          setSecondaryColor(designSystemData.colors.secondary);
        }
        if (designSystemData.colors.accent) {
          setAccentColor(designSystemData.colors.accent);
        }
        if (designSystemData.colors.background) {
          setBackgroundColor(designSystemData.colors.background);
        }
        if (designSystemData.colors.text) {
          setTextColor(designSystemData.colors.text);
        }
      }
      
      // フォント情報があれば設定
      if (designSystemData.typography?.fontFamily?.sans) {
        const fontFamily = designSystemData.typography.fontFamily.sans.toLowerCase();
        if (fontFamily.includes('inter')) {
          setSelectedFont('inter');
        } else if (fontFamily.includes('roboto')) {
          setSelectedFont('roboto');
        } else if (fontFamily.includes('poppins')) {
          setSelectedFont('poppins');
        } else if (fontFamily.includes('montserrat')) {
          setSelectedFont('montserrat');
        } else {
          setSelectedFont('inter'); // デフォルト
        }
      }
    } catch (e) {
      console.error('デザイン設定の更新に失敗:', e);
    }
  }, []);
  
  // デザインシステム生成関数
  const generateDesignSystem = async (style, description) => {
    if (isGeneratingDesignSystem) return;
    
    setIsGeneratingDesignSystem(true);
    try {
      console.log('デザインシステム生成開始:', style, description);
      
      // 選択されたカラーを使用して生成
      let industry = 'general';
      let userPrimaryColor = primaryColor;
      
      // スタイルごとのデフォルト設定
      switch (style) {
        case 'modern':
          industry = 'technology';
          if (primaryColor === '#3B82F6') { // デフォルト値の場合のみ更新
            userPrimaryColor = '#3B82F6'; // ブルー
          }
          break;
        case 'corporate':
          industry = 'business';
          if (primaryColor === '#3B82F6') { // デフォルト値の場合のみ更新
            userPrimaryColor = '#1E40AF'; // ダークブルー
          }
          break;
        case 'vibrant':
          industry = 'creative';
          if (primaryColor === '#3B82F6') { // デフォルト値の場合のみ更新
            userPrimaryColor = '#F59E0B'; // オレンジ
          }
          break;
        case 'minimal':
          industry = 'professional';
          if (primaryColor === '#3B82F6') { // デフォルト値の場合のみ更新
            userPrimaryColor = '#6B7280'; // グレイ
          }
          break;
        default:
          industry = 'general';
          if (primaryColor === '#3B82F6') { // デフォルト値の場合のみ更新
            userPrimaryColor = '#8B5CF6'; // パープル
          }
      }
      
      // DesignSystemGeneratorを使ってデザインシステム生成
      const result = await DesignSystemGenerator.generate({
        industry,
        primaryColor: userPrimaryColor,
        secondaryColor: secondaryColor,
        accentColor: accentColor,
        textColor: textColor,
        backgroundColor: backgroundColor,
        fontFamily: selectedFont,
        style,
        brandPersonality: description || 'professional yet approachable',
        targetAudience: description ? `People who are ${description}` : 'general audience'
      });
      
      console.log('デザインシステム生成完了:', result);
      setDesignSystem(result);
      
      // 色情報やフォントなどの設定を更新
      updateDesignSettings(result);
      
      // 構造・セクション生成時に使えるようにローカルストレージに保存
      if (typeof window !== 'undefined') {
        try {
          // 基本的なデザインシステム情報を保存
          localStorage.setItem(`design_system_${lpId}`, JSON.stringify(result));
          // 詳細なデザインシステム情報も保存
          localStorage.setItem(`design_system_full_${lpId}`, JSON.stringify(result));
          console.log('デザインシステムをローカルストレージに保存:', lpId);
        } catch (e) {
          console.error('デザインシステムの保存に失敗:', e);
        }
      }
      
      // コンテキストにデザインシステムを設定（LPBuilderContext内でも保存される）
      try {
        const { setDesignSystem } = useLPBuilder();
        if (setDesignSystem) {
          setDesignSystem(result);
          console.log('デザインシステムをコンテキストに保存しました');
        }
      } catch (e) {
        console.error('デザインシステムのコンテキスト保存に失敗:', e);
      }
      
      // データベースにデザインシステムを保存
      try {
        const saveResult = await saveDesignSystem(lpId, {
          designSystem: result,
          designStyle: style
        });
        console.log('デザインシステムをデータベースに保存しました:', lpId, saveResult);
      } catch (e) {
        console.error('デザインシステムのデータベース保存に失敗:', e);
        // データベース保存に失敗してもUI処理は続行
      }
      
      // 成功トースト表示
      toast({
        title: "デザインシステム生成完了",
        description: "あなたのLPに最適なデザインシステムを生成しました",
      });
      
      // プレビューを表示
      setShowPreview(true);
      
      return result;
    } catch (error) {
      console.error('デザインシステム生成エラー:', error);
      toast({
        title: "デザインシステム生成エラー",
        description: "デザインシステムの生成中にエラーが発生しました",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingDesignSystem(false);
    }
  };
  
  // 色やフォントが変更されたときにデザインシステムを更新する関数
  const updateDesignSystemWithUserSettings = useCallback(async () => {
    if (!designSystem || isGeneratingDesignSystem) return;
    
    setIsGeneratingDesignSystem(true);
    try {
      // 既存のデザインシステムをベースに新しい設定で更新
      const updatedDesignSystem = {
        ...designSystem,
        colors: {
          ...designSystem.colors,
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: backgroundColor,
          text: textColor,
        },
        typography: {
          ...designSystem.typography,
          fontFamily: {
            ...designSystem.typography?.fontFamily,
            sans: selectedFont === 'inter' ? 'Inter, sans-serif' :
                  selectedFont === 'roboto' ? 'Roboto, sans-serif' :
                  selectedFont === 'poppins' ? 'Poppins, sans-serif' :
                  selectedFont === 'montserrat' ? 'Montserrat, sans-serif' :
                  'Inter, sans-serif'
          }
        }
      };
      
      console.log('デザインシステムを更新:', updatedDesignSystem);
      setDesignSystem(updatedDesignSystem);
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(`design_system_full_${lpId}`, JSON.stringify(updatedDesignSystem));
      }
      
      // コンテキストに保存
      try {
        const { setDesignSystem } = useLPBuilder();
        if (setDesignSystem) {
          setDesignSystem(updatedDesignSystem);
        }
      } catch (e) {
        console.error('コンテキスト更新エラー:', e);
      }
      
      // データベースに保存
      try {
        await saveDesignSystem(lpId, {
          designSystem: updatedDesignSystem,
          designStyle: selectedStyle
        });
        console.log('更新したデザインシステムをデータベースに保存しました');
      } catch (e) {
        console.error('デザインシステムの保存に失敗:', e);
      }
      
      return updatedDesignSystem;
    } catch (error) {
      console.error('デザインシステム更新エラー:', error);
      return null;
    } finally {
      setIsGeneratingDesignSystem(false);
    }
  }, [lpId, designSystem, primaryColor, secondaryColor, accentColor, backgroundColor, textColor, selectedFont, selectedStyle]);

  const handleGenerate = async () => {
    console.log('Generate button clicked');
    setIsGenerating(true);
    
    try {
      // デバッグ用のログ
      console.log('LP Content:', lpContent);
      console.log('Selected Style:', selectedStyle);
      console.log('Design Description:', designDescription);
      console.log('Current Title:', state.title);
      
      // AI API呼び出し - 統合APIを使用
      try {
        // 統合APIを呼び出す
        const lpResponse = await generateLP({
          serviceInfo: lpContent,
          targetAudience: designDescription,
          style: selectedStyle
        });
        
        console.log('LP generated successfully:', lpResponse);
        
      } catch (aiError) {
        console.error('AI API error:', aiError);
        // エラーがあってもフロー継続（UI側の動作は維持）
      }
      
      // グローバルステートに保存
      setLPContent(lpContent, selectedStyle, designDescription);
      
      // フェーズ完了をマーク
      completePhase('generate');
      console.log('Marked generate phase as complete');
      
      // 以下はlocalStorageにも直接反映するためのハック
      // LPBuilderContextの非同期更新の問題を回避
      if (typeof window !== 'undefined') {
        const initialData = {
          lpId: lpId,
          title: state.title,
          chatMessages: state.chatMessages || [],
          lpContent: lpContent,
          designStyle: selectedStyle,
          designDescription: designDescription,
          isComplete: {
            generate: true,
            design: false
          }
        };
        
        // 強制的に新しい状態をlocalStorageに保存
        localStorage.setItem(`lp_builder_${lpId}`, JSON.stringify(initialData));
        console.log('Updated localStorage manually with complete data:', initialData);
        
        // Cookieにも保存して二重保険（別のタブでも共有できる）
        document.cookie = `lpbuilder_${lpId}=true; path=/; max-age=3600`;
      }
      
      // APIを使用してLPを更新（タイトル、内容、デザイン情報）
      try {
        await updateLP(lpId, { 
          title: state.title,
          description: lpContent.substring(0, 500) // 説明文として内容の一部を使用
        });
        console.log('LP data saved to server');
      } catch (updateError) {
        console.error('LP update error:', updateError);
      }
      
      // 非同期の状態更新が完了するまで待機対策は別で実装済み
      console.log('Current State After Direct Update (expected to still show old state):', state);
      
      // 完了マークが反映されるまで少し待つ（非同期更新対策）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 成功メッセージ
      toast({
        title: "LP生成完了",
        description: "構造作成ページに移動します",
      });
      
      // 次ページへ遷移（forceLoadパラメータ付き - ローカルストレージから確実に読み込ませる）
      console.log('Navigating to:', `/lp/${lpId}/edit/structure?forceLoad=true&autoAnalyze=true`);
      
      // まず直接lpContentをもう一度設定（直前確認）
      if (typeof window !== 'undefined') {
        let savedState = localStorage.getItem(`lp_builder_${lpId}`);
        if (savedState) {
          try {
            let parsed = JSON.parse(savedState);
            if (!parsed.lpContent) {
              parsed.lpContent = lpContent;
              parsed.designStyle = selectedStyle;
              parsed.designDescription = designDescription;
              parsed.isComplete.generate = true;
              localStorage.setItem(`lp_builder_${lpId}`, JSON.stringify(parsed));
              console.log('Final check - Updated LP content before navigation');
            }
          } catch (e) {
            console.error('Error in final check', e);
          }
        }
      }
      
      // 自動構造分析のフラグを付けて遷移する
      router.push(`/lp/${lpId}/edit/structure?forceLoad=true&autoAnalyze=true`);
      
    } catch (error) {
      console.error('LP generation error:', error);
      toast({
        title: "エラーが発生しました",
        description: "LP生成中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">AI LP ジェネレーター</h1>
            <p className="text-muted-foreground mb-6">
              LPコンテンツを入力して、自動生成します
            </p>
            <Button
              onClick={handleGenerate}
              className="px-10 py-6 text-lg mb-6"
              disabled={isGenerating || !lpContent.trim() || !state.title || state.title === 'ランディングページ作成' || state.title === '新規LP' || state.title === '新規AI作成LP'}
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  LP生成中...
                </>
              ) : (
                'AIでLP生成'
              )}
            </Button>
            
            {/* LP名入力フィールド */}
            <div className="max-w-md mx-auto mb-4">
              <Card className="border-2 border-primary/20 bg-white shadow-lg">
                <CardContent className="p-4">
                  <Label htmlFor="lp-title" className="block text-left font-medium mb-2">
                    LP名 <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="lp-title" 
                    placeholder="例: 新サービス紹介LP"
                    className="mb-2 h-10 text-base"
                    value={state.title === 'ランディングページ作成' || state.title === '新規LP' || state.title === '新規AI作成LP' ? '' : state.title}
                    onChange={(e) => {
                      // タイトル変更をコンテキストに通知し、APIで保存
                      setTitle(e.target.value);
                      console.log('Title updated:', e.target.value);
                      
                      // APIを使用してタイトルをサーバーに保存
                      try {
                        // 入力されたタイトルをAPIで保存（空文字列の場合は保存しない）
                        if (e.target.value.trim()) {
                          updateLP(lpId, { title: e.target.value });
                        }
                      } catch (error) {
                        console.error('タイトル更新エラー:', error);
                      }
                    }}
                    autoFocus
                  />
                  <p className="text-xs text-left text-muted-foreground">
                    分かりやすいLP名を設定してください（例: 新商品紹介ページ、セミナー申込みLP）
                  </p>
                  {(!state.title || state.title === 'ランディングページ作成' || state.title === '新規LP' || state.title === '新規AI作成LP') && (
                    <p className="text-xs text-left text-red-500 mt-1 font-medium">
                      LP名を入力しないと生成ボタンが有効になりません
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* LP内容の確認 - 左側 3カラム */}
            <div className="md:col-span-3">
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <Label className="text-lg font-semibold">LP内容の確認</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    AIとの会話から抽出した内容です。必要に応じて編集してください。
                  </p>
                  <Textarea
                    value={lpContent}
                    onChange={(e) => {
                      // ローカル状態を更新
                      setContentState(e.target.value);
                      // コンテキストにも即時反映（保存ボタンで使用するため）
                      setLPContent(e.target.value, selectedStyle, designDescription);
                    }}
                    className="min-h-[400px]"
                    placeholder="LPの内容をここで確認・編集できます..."
                    onBlur={() => {
                      // フォーカスが外れたときにもコンテキストを更新
                      console.log('LP内容を更新:', lpContent);
                      setLPContent(lpContent, selectedStyle, designDescription);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* デザイン設定 - 右側 2カラム */}
            <div className="md:col-span-2">
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <Label className="text-lg font-semibold">デザインイメージを設定</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    LPのトーンやスタイルを指定してください。
                  </p>
                  
                  <Tabs defaultValue="style" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="style">デザインスタイル</TabsTrigger>
                      <TabsTrigger value="colors">カラー設定</TabsTrigger>
                      <TabsTrigger value="typography">タイポグラフィ</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="style" className="space-y-6 mt-4">
                      <div>
                        <Label htmlFor="design-style" className="mb-2 block">デザインスタイル</Label>
                        <Select
                          value={selectedStyle}
                          onValueChange={(value) => {
                            setSelectedStyle(value);
                            // コンテキストにも即時反映
                            setLPContent(lpContent, value, designDescription);
                            // 新しいスタイルに基づいてデザインシステムを生成
                            generateDesignSystem(value, designDescription);
                          }}
                        >
                          <SelectTrigger id="design-style">
                            <SelectValue placeholder="デザインスタイルを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {designStyles.map(style => (
                              <SelectItem key={style.id} value={style.id}>
                                {style.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-2">
                          {designStyles.find(s => s.id === selectedStyle)?.description}
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="design-description" className="mb-2 block">自然言語でデザインイメージを説明（オプション）</Label>
                        <Input
                          id="design-description"
                          value={designDescription}
                          onChange={(e) => {
                            setDesignDescription(e.target.value);
                            // コンテキストにも即時反映
                            setLPContent(lpContent, selectedStyle, e.target.value);
                          }}
                          placeholder="例: 「明るく優しい雰囲気で、自然のイメージを取り入れたデザイン」"
                        />
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">参考イメージをアップロード（オプション）</Label>
                        <Input
                          type="file"
                          id="design-image"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // ファイルサイズチェック (5MB以下)
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: "ファイルサイズが大きすぎます",
                                description: "5MB以下の画像を選択してください",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            try {
                              // 画像を処理してデザインシステム生成に活用
                              // 画像のプレビュー表示
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                // 画像プレビューを表示
                                const imagePreviewEl = document.getElementById('design-image-preview') as HTMLImageElement;
                                if (imagePreviewEl && event.target?.result) {
                                  imagePreviewEl.src = event.target.result as string;
                                  imagePreviewEl.classList.remove('hidden');
                                }
                                
                                // イメージに基づいてデザインシステムを生成
                                // 画像の特性からスタイルを推定（今回は簡易的に実装）
                                const style = selectedStyle;
                                const updatedDescription = `${designDescription}
以下の画像のトーンや雰囲気を参考にしてください: ${file.name}`;
                                
                                // 更新された説明でデザインシステムを再生成
                                setDesignDescription(updatedDescription);
                                await generateDesignSystem(style, updatedDescription);
                                
                                // コンテキストの更新
                                setLPContent(lpContent, style, updatedDescription);
                                
                                toast({
                                  title: "画像を反映してデザインシステムを更新しました",
                                  description: "画像の雰囲気を取り入れたデザインになります",
                                });
                              };
                              reader.readAsDataURL(file);
                            } catch (error) {
                              console.error('画像処理エラー:', error);
                              toast({
                                title: "画像処理エラー",
                                description: "画像の処理中にエラーが発生しました",
                                variant: "destructive",
                              });
                            }
                          }}
                        />
                        <Button 
                          variant="outline" 
                          type="button" 
                          className="w-full"
                          onClick={() => {
                            document.getElementById('design-image')?.click();
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          イメージをアップロード
                        </Button>
                        
                        {/* 画像プレビュー */}
                        <div className="mt-4">
                          <img 
                            id="design-image-preview" 
                            className="hidden max-w-full h-auto rounded-md border border-gray-200" 
                            alt="デザイン参考画像"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="colors" className="space-y-6 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primary-color" className="mb-2 block">メインカラー</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-md border border-gray-200"
                              style={{ backgroundColor: primaryColor }}
                            />
                            <Input
                              id="primary-color"
                              type="color"
                              value={primaryColor}
                              onChange={(e) => {
                                setPrimaryColor(e.target.value);
                              }}
                              onBlur={() => updateDesignSystemWithUserSettings()}
                              className="w-24"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="secondary-color" className="mb-2 block">セカンダリカラー</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-md border border-gray-200"
                              style={{ backgroundColor: secondaryColor }}
                            />
                            <Input
                              id="secondary-color"
                              type="color"
                              value={secondaryColor}
                              onChange={(e) => {
                                setSecondaryColor(e.target.value);
                              }}
                              onBlur={() => updateDesignSystemWithUserSettings()}
                              className="w-24"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="accent-color" className="mb-2 block">アクセントカラー</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-md border border-gray-200"
                              style={{ backgroundColor: accentColor }}
                            />
                            <Input
                              id="accent-color"
                              type="color"
                              value={accentColor}
                              onChange={(e) => {
                                setAccentColor(e.target.value);
                              }}
                              onBlur={() => updateDesignSystemWithUserSettings()}
                              className="w-24"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="text-color" className="mb-2 block">テキストカラー</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-md border border-gray-200"
                              style={{ backgroundColor: textColor }}
                            />
                            <Input
                              id="text-color"
                              type="color"
                              value={textColor}
                              onChange={(e) => {
                                setTextColor(e.target.value);
                              }}
                              onBlur={() => updateDesignSystemWithUserSettings()}
                              className="w-24"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={updateDesignSystemWithUserSettings}
                        className="w-full mt-4"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        カラー設定を適用
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="typography" className="space-y-6 mt-4">
                      <div>
                        <Label htmlFor="font-family" className="mb-2 block">フォント</Label>
                        <Select
                          value={selectedFont}
                          onValueChange={(value) => {
                            setSelectedFont(value);
                            // 即時適用
                            setTimeout(() => updateDesignSystemWithUserSettings(), 100);
                          }}
                        >
                          <SelectTrigger id="font-family">
                            <SelectValue placeholder="フォントを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                            <SelectItem value="poppins">Poppins</SelectItem>
                            <SelectItem value="montserrat">Montserrat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="mt-4">
                        <div className="p-4 border rounded-md bg-gray-50">
                          <p className={`text-2xl font-bold ${selectedFont === 'inter' ? 'font-sans' : selectedFont === 'roboto' ? 'font-sans' : selectedFont === 'poppins' ? 'font-sans' : 'font-sans'}`}>
                            見出しテキストサンプル
                          </p>
                          <p className={`mt-2 ${selectedFont === 'inter' ? 'font-sans' : selectedFont === 'roboto' ? 'font-sans' : selectedFont === 'poppins' ? 'font-sans' : 'font-sans'}`}>
                            本文テキストのサンプルです。選択したフォントがどのように表示されるかを確認できます。
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* プレビューボタン */}
                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex-1 mr-2"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {showPreview ? "プレビューを閉じる" : "プレビューを表示"}
                    </Button>
                    
                    <Button
                      variant="default"
                      type="button"
                      onClick={() => generateDesignSystem(selectedStyle, designDescription)}
                      className="flex-1 ml-2"
                      disabled={isGeneratingDesignSystem}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      {isGeneratingDesignSystem ? "生成中..." : "デザイン生成"}
                    </Button>
                  </div>
                  
                  {/* プレビュー表示エリア */}
                  {showPreview && (
                    <div className="mt-6 border rounded-md overflow-hidden">
                      <div className="p-2 bg-gray-100 border-b flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={previewMode === 'desktop' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPreviewMode('desktop')}
                          >
                            デスクトップ
                          </Button>
                          <Button
                            variant={previewMode === 'mobile' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPreviewMode('mobile')}
                          >
                            モバイル
                          </Button>
                        </div>
                      </div>
                      
                      <div className={`p-4 ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'}`}>
                        {/* プレビューコンテンツ */}
                        <div
                          style={{
                            fontFamily: selectedFont === 'inter' ? 'Inter, sans-serif' :
                                      selectedFont === 'roboto' ? 'Roboto, sans-serif' :
                                      selectedFont === 'poppins' ? 'Poppins, sans-serif' :
                                      selectedFont === 'montserrat' ? 'Montserrat, sans-serif' :
                                      'Inter, sans-serif',
                            color: textColor,
                            backgroundColor: backgroundColor,
                          }}
                          className="p-4 rounded-md"
                        >
                          <h1 style={{ color: primaryColor }} className="text-3xl font-bold mb-4">
                            サンプル見出し
                          </h1>
                          <p className="mb-4">このテキストは選択したフォント「{selectedFont}」で表示されています。</p>
                          <button
                            style={{ backgroundColor: accentColor, color: 'white' }}
                            className="px-4 py-2 rounded-md font-medium"
                          >
                            サンプルボタン
                          </button>
                          <div className="mt-6 p-4 rounded-md" style={{ backgroundColor: secondaryColor, color: 'white' }}>
                            <p>アクセントエリア</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* デザインシステムファイル生成ボタン */}
                  <div className="mt-6">
                    <Button
                      variant="secondary"
                      type="button"
                      className="w-full"
                      disabled={!designSystem}
                      onClick={async () => {
                            // まずローカルのdesignSystemを確認
                            let currentDesignSystem = designSystem;
                            
                            // designSystemがない場合はローカルストレージから取得
                            if (!currentDesignSystem) {
                              try {
                                // コンテキストから取得を試みる
                                const { state } = useLPBuilder();
                                if (state.designSystem) {
                                  currentDesignSystem = state.designSystem;
                                  console.log('コンテキストからデザインシステムを取得しました');
                                } else {
                                  // ローカルストレージからの取得を試みる
                                  const storedDesignSystem = localStorage.getItem(`design_system_full_${lpId}`);
                                  if (storedDesignSystem) {
                                    currentDesignSystem = JSON.parse(storedDesignSystem);
                                    console.log('ローカルストレージからデザインシステムを取得しました');
                                  }
                                }
                              } catch (e) {
                                console.error('デザインシステム取得エラー:', e);
                              }
                            }
                            
                            // それでもデザインシステムがない場合は新規生成
                            if (!currentDesignSystem) {
                              toast({
                                title: "デザインシステム生成中",
                                description: "デザインシステムを生成してからファイルを作成します",
                              });
                              
                              try {
                                // 現在のスタイルでデザインシステムを生成
                                currentDesignSystem = await generateDesignSystem(selectedStyle, designDescription);
                                
                                if (!currentDesignSystem) {
                                  toast({
                                    title: "デザインシステム生成エラー",
                                    description: "デザインシステムの生成に失敗しました",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                              } catch (e) {
                                console.error('デザインシステム生成エラー:', e);
                                toast({
                                  title: "デザインシステム生成エラー",
                                  description: "デザインシステムの生成に失敗しました",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            
                            // デザインシステムファイルを生成
                            try {
                              // tailwind.config.tsファイルの内容を生成
                              const tailwindConfig = `
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: ${JSON.stringify(currentDesignSystem.tailwindConfig.theme.extend, null, 2)}
  },
  plugins: [],
};

export default config;
`;
                              
                              // globals.cssファイルの内容
                              const globalCss = currentDesignSystem.globalCss;
                              
                              // ファイル内容をBlobとして作成
                              const tailwindConfigBlob = new Blob([tailwindConfig], { type: 'text/plain' });
                              const globalCssBlob = new Blob([globalCss], { type: 'text/css' });
                              
                              // ダウンロードリンクを作成
                              const tailwindConfigUrl = URL.createObjectURL(tailwindConfigBlob);
                              const globalCssUrl = URL.createObjectURL(globalCssBlob);
                              
                              // ダウンロードリンクを作成してクリック
                              const tailwindLink = document.createElement('a');
                              tailwindLink.href = tailwindConfigUrl;
                              tailwindLink.download = 'tailwind.config.ts';
                              document.body.appendChild(tailwindLink);
                              tailwindLink.click();
                              
                              const cssLink = document.createElement('a');
                              cssLink.href = globalCssUrl;
                              cssLink.download = 'globals.css';
                              document.body.appendChild(cssLink);
                              cssLink.click();
                              
                              // リンクを削除
                              document.body.removeChild(tailwindLink);
                              document.body.removeChild(cssLink);
                              
                              // URLを解放
                              URL.revokeObjectURL(tailwindConfigUrl);
                              URL.revokeObjectURL(globalCssUrl);
                              
                              // デザインシステムオブジェクトをJSONファイルとしてダウンロード
                              const designSystemJson = JSON.stringify(currentDesignSystem, null, 2);
                              const designSystemBlob = new Blob([designSystemJson], { type: 'application/json' });
                              const designSystemUrl = URL.createObjectURL(designSystemBlob);
                              
                              const designSystemLink = document.createElement('a');
                              designSystemLink.href = designSystemUrl;
                              designSystemLink.download = 'design-system.json';
                              document.body.appendChild(designSystemLink);
                              designSystemLink.click();
                              document.body.removeChild(designSystemLink);
                              URL.revokeObjectURL(designSystemUrl);
                              
                              toast({
                                title: "デザインシステムファイルを生成しました",
                                description: "tailwind.config.ts、globals.css、design-system.jsonをダウンロードしました",
                              });
                              
                              // ローカル状態とコンテキストを更新
                              if (!designSystem && currentDesignSystem) {
                                setDesignSystem(currentDesignSystem);
                                try {
                                  const { setDesignSystem } = useLPBuilder();
                                  if (setDesignSystem) {
                                    setDesignSystem(currentDesignSystem);
                                  }
                                } catch (e) {
                                  console.error('コンテキスト更新エラー:', e);
                                }
                              }
                              
                              // デザインシステムの情報をローカルストレージに保存
                              localStorage.setItem(`design_system_full_${lpId}`, JSON.stringify(currentDesignSystem));
                              
                              // データベースにも保存
                              try {
                                await saveDesignSystem(lpId, {
                                  designSystem: currentDesignSystem,
                                  designStyle: selectedStyle
                                });
                                console.log('デザインシステムファイルをデータベースに保存しました');
                              } catch (error) {
                                console.error('デザインシステムのデータベース保存に失敗:', error);
                                // ダウンロードは続行
                              }
                            } catch (error) {
                              console.error('ファイル生成エラー:', error);
                              toast({
                                title: "ファイル生成エラー",
                                description: "ファイルの生成中にエラーが発生しました",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          デザインシステムファイルを生成
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t p-4 bg-white">
        <div className="max-w-5xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/lp')}
          >
            キャンセル
          </Button>
          <div className="space-x-4">
            <Button
              onClick={async () => {
                console.log('次のステップへ進むボタンがクリックされました');
                console.log('遷移先URL:', `/lp/${lpId}/edit/structure?autoAnalyze=true`);
                console.log('保存するデータ:', {
                  lpId,
                  title: state.title,
                  lpContent: lpContent ? lpContent.substring(0, 50) + '...' : 'なし'
                });
                
                // セーブ中のダイアログを表示
                toast({
                  title: "処理中...",
                  description: "データを保存してから次のステップに進みます",
                });
                
                try {
                  console.log('updateLP関数を呼び出します...');
                  // awaitを使ってPromiseの解決を待つ
                  const result = await updateLP(lpId, { 
                    title: state.title,
                    description: lpContent || ''
                  });
                  
                  console.log('データ保存成功:', result);
                  
                  // 成功トースト
                  toast({
                    title: "保存完了",
                    description: "次のステップに進みます",
                  });
                  
                  // コンテキストを更新
                  setLPContent(lpContent, selectedStyle, designDescription);
                  completePhase('generate');
                  
                  // localStorageに保存
                  if (typeof window !== 'undefined') {
                    const savedState = localStorage.getItem(`lp_builder_${lpId}`);
                    if (savedState) {
                      const parsedState = JSON.parse(savedState);
                      parsedState.lpContent = lpContent;
                      parsedState.isComplete.generate = true;
                      localStorage.setItem(`lp_builder_${lpId}`, JSON.stringify(parsedState));
                    }
                  }
                  
                  // 遅延を入れて遷移
                  setTimeout(() => {
                    console.log('次のステップへ遷移します');
                    router.push(`/lp/${lpId}/edit/structure?autoAnalyze=true`);
                  }, 500);
                } catch (error) {
                  console.error('データ保存または遷移エラー:', error);
                  // エラートースト
                  toast({
                    title: "エラー",
                    description: "保存中にエラーが発生しました。それでも続行しますか？",
                    variant: "destructive",
                  });
                  
                  // エラーが発生しても5秒後に遷移を試みる
                  setTimeout(() => {
                    console.log('エラー後に遷移を試みます');
                    router.push(`/lp/${lpId}/edit/structure?autoAnalyze=true`);
                  }, 3000);
                }
              }}
              className="px-10 py-6 text-lg"
              disabled={!lpContent.trim() || !state.title || state.title === 'ランディングページ作成' || state.title === '新規LP' || state.title === '新規AI作成LP'}
            >
              次のステップへ進む
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}