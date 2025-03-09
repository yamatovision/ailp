'use client';

import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

import { useLPBuilder } from '../LPBuilderContext';
import { updateLP, generateLP } from '@/lib/api/lp';

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

  // 初期化処理
  useEffect(() => {
    // この画面が最初のステップなので、特別な初期化は不要
    console.log('Generate interface initialized');
  }, []);

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
      console.log('Navigating to:', `/lp/${lpId}/edit/structure?forceLoad=true`);
      
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
      
      router.push(`/lp/${lpId}/edit/structure?forceLoad=true`);
      
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
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="design-style" className="mb-2 block">デザインスタイル</Label>
                      <Select
                        value={selectedStyle}
                        onValueChange={(value) => {
                          setSelectedStyle(value);
                          // コンテキストにも即時反映
                          setLPContent(lpContent, value, designDescription);
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
                      <Button variant="outline" type="button" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        イメージをアップロード
                      </Button>
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
              onClick={() => router.push(`/lp/${lpId}/edit/structure`)}
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