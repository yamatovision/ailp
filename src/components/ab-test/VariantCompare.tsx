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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// コンポーネント名のマッピング
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

interface ComponentVariant {
  id: string;
  variantType: 'a' | 'b';
  htmlContent: string;
}

interface ComponentWithVariants {
  id: string;
  componentType: string;
  variants: {
    a: ComponentVariant;
    b: ComponentVariant;
  };
}

export default function VariantCompare() {
  const { state } = useTest();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [componentData, setComponentData] = useState<ComponentWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  
  // テスト対象コンポーネントのバリアント情報を取得
  useEffect(() => {
    const fetchComponentVariants = async () => {
      try {
        setLoading(true);
        
        if (state.testedComponents.length === 0) {
          setComponentData([]);
          setLoading(false);
          return;
        }
        
        // 対象コンポーネントのバリアント情報を取得
        const response = await fetch(`/api/lp/${state.projectId}/variants?components=${state.testedComponents.join(',')}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch component variants');
        }
        
        const data = await response.json();
        setComponentData(data.components);
        
        // 最初のコンポーネントを選択
        if (data.components.length > 0 && !selectedComponent) {
          setSelectedComponent(data.components[0].id);
        }
      } catch (error) {
        console.error('Error fetching component variants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComponentVariants();
  }, [state.projectId, state.testedComponents]);
  
  // 現在選択されているコンポーネントのデータを取得
  const getSelectedComponentData = () => {
    return componentData.find(comp => comp.id === selectedComponent);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>バリアント比較</CardTitle>
        <CardDescription>
          テスト対象コンポーネントのバリアントA/Bを比較確認します。
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">バリアント情報を読み込み中...</span>
          </div>
        ) : componentData.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            テスト対象のコンポーネントがありません。前のステップで選択してください。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* コンポーネント選択サイドバー */}
            <div className="col-span-1 border rounded-lg p-2">
              <h3 className="text-sm font-medium mb-2">テスト対象</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {componentData.map((component) => {
                    const name = componentNames[component.componentType] || component.componentType;
                    
                    return (
                      <Button
                        key={component.id}
                        variant={selectedComponent === component.id ? "default" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedComponent(component.id)}
                      >
                        <span className="truncate">{name}</span>
                        <Badge variant="outline" className="ml-2">
                          2バリアント
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
            
            {/* バリアントプレビュー */}
            <div className="col-span-1 md:col-span-3">
              {selectedComponent ? (
                <Tabs defaultValue="split" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="split">分割表示</TabsTrigger>
                    <TabsTrigger value="a">バリアントA</TabsTrigger>
                    <TabsTrigger value="b">バリアントB</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="split" className="mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-secondary p-2 text-center text-sm font-medium">
                          バリアントA
                        </div>
                        <div className="h-[350px] overflow-auto p-4">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: getSelectedComponentData()?.variants.a.htmlContent || ''
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-primary text-primary-foreground p-2 text-center text-sm font-medium">
                          バリアントB
                        </div>
                        <div className="h-[350px] overflow-auto p-4">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: getSelectedComponentData()?.variants.b.htmlContent || ''
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="a" className="mt-0">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-secondary p-2 text-center text-sm font-medium">
                        バリアントA
                      </div>
                      <div className="h-[400px] overflow-auto p-4">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: getSelectedComponentData()?.variants.a.htmlContent || ''
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="b" className="mt-0">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-primary text-primary-foreground p-2 text-center text-sm font-medium">
                        バリアントB
                      </div>
                      <div className="h-[400px] overflow-auto p-4">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: getSelectedComponentData()?.variants.b.htmlContent || ''
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex justify-center items-center h-[400px] border rounded-lg">
                  <p className="text-muted-foreground">
                    左側からコンポーネントを選択してください
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline">戻る</Button>
        <Button>テスト開始</Button>
      </CardFooter>
    </Card>
  );
}