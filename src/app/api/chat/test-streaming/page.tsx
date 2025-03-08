'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestStreamingPage() {
  const [output, setOutput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // ストリーミングテスト関数
  const testStreaming = async () => {
    setIsStreaming(true);
    setOutput('');
    setError(null);
    
    try {
      console.log('ストリーミングテストを開始します...');
      const response = await fetch('/api/chat/test-streaming');
      
      if (!response.ok) {
        const errorText = await response.text();
        setError(`APIエラー (${response.status}): ${errorText}`);
        setIsStreaming(false);
        return;
      }
      
      console.log('ストリームのレスポンスを受信:', response.headers.get('Content-Type'));
      
      // EventSourceが使えない場合はfetchを使用
      const reader = response.body?.getReader();
      if (!reader) {
        setError('レスポンスボディが取得できませんでした');
        setIsStreaming(false);
        return;
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('ストリーム読み取り完了');
          setIsStreaming(false);
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // SSEフォーマットの行を処理
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;
          
          const data = match[1];
          if (data === '[DONE]') {
            setIsStreaming(false);
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setOutput(prev => prev + parsed.text);
            }
          } catch (e) {
            console.error('JSON解析エラー:', e);
          }
        }
      }
    } catch (err) {
      console.error('ストリーミングテストエラー:', err);
      setError(`エラー: ${err instanceof Error ? err.message : String(err)}`);
      setIsStreaming(false);
    }
  };
  
  // 出力が更新されたらスクロール
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">ストリーミングテストページ</h1>
      
      <div className="mb-6">
        <Button 
          onClick={testStreaming} 
          disabled={isStreaming}
          className="px-6 py-2"
        >
          {isStreaming ? 'ストリーミング中...' : 'ストリーミングテスト開始'}
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <Card className="p-4 mb-4">
        <h2 className="text-lg font-medium mb-2">出力:</h2>
        <div 
          ref={outputRef}
          className="bg-gray-100 rounded p-4 h-80 overflow-y-auto whitespace-pre-wrap"
        >
          {output || (isStreaming ? 'ストリーミング待機中...' : '出力がここに表示されます')}
        </div>
      </Card>
      
      <div className="text-sm text-gray-500">
        <p>このページはClaudeのストリーミングAPIをテストするためのものです。</p>
        <p>「ストリーミングテスト開始」ボタンをクリックすると、APIからの応答がリアルタイムで表示されます。</p>
      </div>
    </div>
  );
}