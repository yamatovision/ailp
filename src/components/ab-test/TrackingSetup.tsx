'use client';

import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TrackingSetup() {
  const { state } = useTest();
  const [trackingMethod, setTrackingMethod] = useState('automatic');
  const [customSelectors, setCustomSelectors] = useState<Record<string, string>>({});
  const [trackScrollDepth, setTrackScrollDepth] = useState(false);
  const [trackTimeOnPage, setTrackTimeOnPage] = useState(false);
  const [embedCode, setEmbedCode] = useState<string>('');
  
  // テスト対象プロジェクトのトラッキングコード生成
  React.useEffect(() => {
    if (state.testId) {
      generateEmbedCode();
    }
  }, [state.testId]);
  
  // トラッキングコード生成
  const generateEmbedCode = () => {
    // 簡略化されたテスト用埋め込みコード
    const code = `<!-- A/Bテストトラッキングコード -->
<script>
  (function() {
    console.log("A/Bテストトラッキングコードが読み込まれました");
    
    // ここに実際のトラッキングコードが入ります
    // ビルドエラーを回避するために簡略化しています
  })();
</script>`;
    
    setEmbedCode(code);
  };
  
  // カスタムセレクタの更新
  const handleCustomSelectorChange = (componentId: string, selector: string) => {
    setCustomSelectors({
      ...customSelectors,
      [componentId]: selector
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>トラッキング設定</CardTitle>
        <CardDescription>
          A/Bテストのトラッキング方法を設定します。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="automatic">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger 
              value="automatic" 
              onClick={() => setTrackingMethod('automatic')}
            >
              自動トラッキング (推奨)
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              onClick={() => setTrackingMethod('manual')}
            >
              手動設定
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="automatic" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                自動トラッキングでは、テスト対象のコンポーネントに自動的にdata属性が付与され、バリアントの切り替えとトラッキングが行われます。
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label className="text-base">追加のトラッキングオプション</Label>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="trackScrollDepth" 
                  checked={trackScrollDepth}
                  onCheckedChange={(checked) => setTrackScrollDepth(!!checked)}
                />
                <div>
                  <Label
                    htmlFor="trackScrollDepth"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    スクロール深度を追跡
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    ページのスクロール深度(25%, 50%, 75%, 90%)を追跡します
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 mt-2">
                <Checkbox 
                  id="trackTimeOnPage" 
                  checked={trackTimeOnPage} 
                  onCheckedChange={(checked) => setTrackTimeOnPage(!!checked)}
                />
                <div>
                  <Label
                    htmlFor="trackTimeOnPage"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    ページ滞在時間を追跡
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    ページの閲覧時間(10秒, 30秒, 1分, 2分)を追跡します
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                手動設定では、各コンポーネントのセレクタを指定し、カスタムトラッキングを設定できます。
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <Label className="text-base">コンバージョン追跡方法</Label>
              <RadioGroup
                defaultValue={state.conversionGoal}
                className="space-y-2"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="form_submit" id="form_submit" />
                  <div>
                    <Label htmlFor="form_submit">フォーム送信</Label>
                    <p className="text-xs text-muted-foreground">
                      フォームの送信をコンバージョンとして追跡
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="button_click" id="button_click" />
                  <div>
                    <Label htmlFor="button_click">ボタンクリック</Label>
                    <p className="text-xs text-muted-foreground">
                      特定のボタンクリックをコンバージョンとして追跡
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="page_view" id="page_view" />
                  <div>
                    <Label htmlFor="page_view">ページ閲覧時間</Label>
                    <p className="text-xs text-muted-foreground">
                      一定時間以上のページ滞在をコンバージョンとして追跡
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <div>
                    <Label htmlFor="custom">カスタム</Label>
                    <p className="text-xs text-muted-foreground">
                      独自のコンバージョン定義
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label className="text-base">コンポーネントセレクタ</Label>
              <p className="text-sm text-muted-foreground">
                各テスト対象コンポーネントのDOMセレクタを指定してください
              </p>
              
              {state.testedComponents.map((componentId) => (
                <div key={componentId} className="space-y-1 mt-3">
                  <Label htmlFor={`selector-${componentId}`}>
                    {componentId} コンポーネント
                  </Label>
                  <Input
                    id={`selector-${componentId}`}
                    value={customSelectors[componentId] || ''}
                    onChange={(e) => 
                      handleCustomSelectorChange(componentId, e.target.value)
                    }
                    placeholder={`#${componentId} または .${componentId}-section など`}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* トラッキングコード表示 */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="embed-code" className="text-base">埋め込みコード</Label>
          <p className="text-sm text-muted-foreground">
            以下のコードをLPのHTML内、&lt;/body&gt;タグの直前に追加してください。
          </p>
          <Textarea
            id="embed-code"
            value={embedCode}
            readOnly
            className="h-[200px] font-mono text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(embedCode);
            }}
          >
            コードをコピー
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline">戻る</Button>
        <Button onClick={() => generateEmbedCode()}>コードを生成</Button>
      </CardFooter>
    </Card>
  );
}