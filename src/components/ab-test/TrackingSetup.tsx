'use client';

import { useState } from 'react';
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
  useState(() => {
    if (state.testId) {
      generateEmbedCode();
    }
  });
  
  // トラッキングコード生成
  const generateEmbedCode = () => {
    const code = `<!-- A/Bテストトラッキングコード -->
<script>
  (function() {
    var testId = "${state.testId || 'TEST_ID'}";
    var projectId = "${state.projectId}";
    
    // セッションIDの生成または取得
    function getSessionId() {
      var sessionId = localStorage.getItem('ab_test_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ab_test_session_id', sessionId);
      }
      return sessionId;
    }
    
    // デバイスタイプの取得
    function getDeviceType() {
      var width = window.innerWidth;
      if (width < 768) {
        return 'mobile';
      } else if (width < 1024) {
        return 'tablet';
      }
      return 'desktop';
    }
    
    // バリアント割り当て
    function getAssignedVariants() {
      var key = 'ab_test_variants_' + testId;
      var variants = localStorage.getItem(key);
      
      if (variants) {
        return JSON.parse(variants);
      }
      
      // 新規割り当て
      var newVariants = {};
      ${state.testedComponents.map(componentId => `
      newVariants["${componentId}"] = Math.random() < 0.5 ? "a" : "b";`).join('')}
      
      localStorage.setItem(key, JSON.stringify(newVariants));
      return newVariants;
    }
    
    // セッション初期化
    function initSession() {
      var sessionId = getSessionId();
      var deviceType = getDeviceType();
      var variants = getAssignedVariants();
      
      // セッション開始を記録
      fetch('/api/tests/${state.testId || 'TEST_ID'}/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browserSessionId: sessionId,
          deviceType: deviceType,
          assignedVariants: variants
        })
      }).catch(console.error);
      
      return { sessionId, deviceType, variants };
    }
    
    // イベント記録
    function recordEvent(eventType, componentId, variantId, timeSpent) {
      fetch('/api/tests/${state.testId || 'TEST_ID'}/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionInfo.sessionId,
          eventType: eventType,
          componentId: componentId,
          variantId: variantId,
          timeSpent: timeSpent || null,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
    
    // 初期化
    var sessionInfo = initSession();
    
    // ページビュー記録
    recordEvent('page_view', null, null, null);
    
    // コンバージョン目標のトラッキング
    ${state.conversionGoal === 'form_submit' ? 
      `document.addEventListener('submit', function(e) {
        if (e.target.tagName === 'FORM') {
          recordEvent('conversion', null, null, null);
        }
      });` : 
      state.conversionGoal === 'button_click' ?
      `document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || 
            (e.target.tagName === 'A' && e.target.href && e.target.href.includes('#form'))) {
          recordEvent('conversion', null, null, null);
        }
      });` :
      state.conversionGoal === 'page_view' ?
      `// ページ滞在時間の記録
      var pageStartTime = Date.now();
      window.addEventListener('beforeunload', function() {
        var timeSpent = Date.now() - pageStartTime;
        if (timeSpent > 30000) { // 30秒以上滞在でコンバージョン
          recordEvent('conversion', null, null, timeSpent);
        }
      });` :
      `// カスタムコンバージョン
      // セレクタに合わせて実装してください`
    }
    
    ${trackScrollDepth ?
      `// スクロール深度のトラッキング
      var scrollDepthMarkers = [25, 50, 75, 90];
      var scrollDepthReached = {};
      
      window.addEventListener('scroll', function() {
        var scrollPosition = window.scrollY;
        var totalHeight = document.body.scrollHeight - window.innerHeight;
        var scrollPercentage = Math.floor((scrollPosition / totalHeight) * 100);
        
        scrollDepthMarkers.forEach(function(marker) {
          if (scrollPercentage >= marker && !scrollDepthReached[marker]) {
            scrollDepthReached[marker] = true;
            recordEvent('scroll_depth', null, null, marker);
          }
        });
      });` : ''}
    
    ${trackTimeOnPage ?
      `// 閲覧時間のトラッキング
      var timeMarkers = [10, 30, 60, 120]; // 秒単位
      var timeMarkersReached = {};
      var pageStartTime = Date.now();
      
      setInterval(function() {
        var timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
        
        timeMarkers.forEach(function(marker) {
          if (timeSpent >= marker && !timeMarkersReached[marker]) {
            timeMarkersReached[marker] = true;
            recordEvent('time_spent', null, null, marker * 1000);
          }
        });
      }, 5000);` : ''}
    
    // コンポーネント表示の適用
    var variants = sessionInfo.variants;
    ${state.testedComponents.map(componentId => `
    var ${componentId}Elements = document.querySelectorAll('[data-component="${componentId}"]');
    if (${componentId}Elements.length > 0) {
      ${componentId}Elements.forEach(function(el) {
        var aVariant = el.querySelector('[data-variant="a"]');
        var bVariant = el.querySelector('[data-variant="b"]');
        
        if (aVariant && bVariant) {
          if (variants["${componentId}"] === "a") {
            aVariant.style.display = "block";
            bVariant.style.display = "none";
            recordEvent('view', "${componentId}", "a", null);
          } else {
            aVariant.style.display = "none";
            bVariant.style.display = "block";
            recordEvent('view', "${componentId}", "b", null);
          }
        }
      });
    }`).join('')}
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
            以下のコードをLPのHTML内、</body>タグの直前に追加してください。
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