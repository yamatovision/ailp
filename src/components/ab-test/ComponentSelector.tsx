'use client';

import { useState, useEffect } from 'react';
import { useTest } from './TestContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// コンポーネント種類とアイコンマッピング
const componentIcons: Record<string, string> = {
  hero: '🏆',
  features: '✨',
  benefits: '🎁',
  pricing: '💰',
  cta: '🔔',
  testimonials: '💬',
  faq: '❓',
  contact: '📞',
  footer: '🏁',
};

// コンポーネント名の日本語マッピング
const componentNames: Record<string, string> = {
  hero: 'ヒーローセクション',
  features: '機能紹介',
  benefits: 'メリット',
  pricing: '料金プラン',
  cta: '行動喚起',
  testimonials: '顧客の声',
  faq: 'よくある質問',
  contact: 'お問い合わせ',
  footer: 'フッター',
};

interface Component {
  id: string;
  componentType: string;
  hasVariants: boolean;
}

export default function ComponentSelector() {
  const { state, addTestedComponent, removeTestedComponent } = useTest();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  
  // プロジェクトのコンポーネント情報を取得
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/lp/${state.projectId}/components`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch components');
        }
        
        const data = await response.json();
        setComponents(data.components);
      } catch (error) {
        console.error('Error fetching components:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (state.projectId) {
      fetchComponents();
    }
  }, [state.projectId]);
  
  // コンポーネント選択の変更
  const handleComponentChange = (checked: boolean, componentId: string) => {
    if (checked) {
      addTestedComponent(componentId);
    } else {
      removeTestedComponent(componentId);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>テスト対象の選択</CardTitle>
        <CardDescription>
          A/Bテストを行うコンポーネントを選択してください。バリアントBがあるコンポーネントのみテスト可能です。
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">コンポーネント情報を読み込み中...</span>
          </div>
        ) : components.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            利用可能なコンポーネントがありません。LP編集画面でセクションを追加してください。
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {components.map((component) => {
                const icon = componentIcons[component.componentType] || '📄';
                const name = componentNames[component.componentType] || component.componentType;
                
                return (
                  <div 
                    key={component.id} 
                    className={`flex items-center space-x-2 p-3 rounded-md border ${
                      !component.hasVariants ? 'opacity-60' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex-shrink-0 text-2xl">{icon}</div>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <Label 
                          htmlFor={`component-${component.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {name}
                        </Label>
                        {component.hasVariants && (
                          <Badge variant="outline" className="ml-2">
                            2バリアント
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Checkbox
                      id={`component-${component.id}`}
                      checked={state.testedComponents.includes(component.id)}
                      onCheckedChange={(checked) => 
                        handleComponentChange(checked as boolean, component.id)
                      }
                      disabled={!component.hasVariants}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline">戻る</Button>
        <Button 
          disabled={state.testedComponents.length === 0}
          className="ml-2"
        >
          次へ：テスト確認
        </Button>
      </CardFooter>
    </Card>
  );
}