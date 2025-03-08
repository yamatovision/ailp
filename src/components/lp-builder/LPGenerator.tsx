'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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

// チャットメッセージの型（ChatInterfaceと共通）
type Message = {
  id: number;
  role: 'user' | 'system';
  content: string;
};

type LPGeneratorProps = {
  messages: Message[];
  onGenerate: (lpContent: string, designStyle: string, designDescription: string) => void;
};

export default function LPGenerator({ messages, onGenerate }: LPGeneratorProps) {
  // コンテンツ自動生成
  const generateContent = () => {
    // AIチャットから情報を抽出して構造化
    let content = '';
    
    // ユーザーメッセージを抽出（単純化のため、すべてのユーザーメッセージを連結）
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
    
    // コンテンツに追加
    content = `# LP内容の概要\n\n${userMessages}`;
    
    return content;
  };

  const [lpContent, setLpContent] = useState(generateContent());
  const [selectedStyle, setSelectedStyle] = useState('corporate');
  const [designDescription, setDesignDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // 実際はAPIを呼び出す
      // ここではモック動作のため setTimeout を使用
      setTimeout(() => {
        onGenerate(lpContent, selectedStyle, designDescription);
        setIsGenerating(false);
      }, 2000);
      
    } catch (error) {
      console.error('LP generation error:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">AI LP ジェネレーター</h1>
            <p className="text-muted-foreground">
              チャットで入力した内容をもとに、LPを自動生成します
            </p>
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
                    onChange={(e) => setLpContent(e.target.value)}
                    className="min-h-[400px]"
                    placeholder="LPの内容をここで確認・編集できます..."
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
                        onValueChange={setSelectedStyle}
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
                    </div>
                    
                    <div>
                      <Label htmlFor="design-description" className="mb-2 block">自然言語でデザインイメージを説明（オプション）</Label>
                      <Input
                        id="design-description"
                        value={designDescription}
                        onChange={(e) => setDesignDescription(e.target.value)}
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
        <div className="max-w-5xl mx-auto flex justify-center">
          <Button
            onClick={handleGenerate}
            className="px-10 py-6 text-lg"
            disabled={isGenerating}
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
        </div>
      </div>
    </div>
  );
}