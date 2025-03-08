import { NextRequest } from 'next/server';
import { streamCompletion } from '@/server/ai/claude-client';

export const maxDuration = 300; // 5分のタイムアウト

// テスト用ストリーミングAPIエンドポイント
export async function GET(req: NextRequest) {
  try {
    console.log('ストリーミングテストAPI開始');
    console.log('CLAUDE_API_KEY in test route:', process.env.CLAUDE_API_KEY ? '設定されています' : '設定されていません');
    console.log('CLAUDE_API_MODEL in test route:', process.env.CLAUDE_API_MODEL || 'デフォルト値を使用します');
    
    if (!process.env.CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY が設定されていません');
      return new Response(
        JSON.stringify({ error: 'API設定が不完全です。環境変数 CLAUDE_API_KEY を設定してください。' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // テスト用プロンプト
    const prompt = "1から10まで数えながら、各数字について簡単に説明してください。";
    
    // システムプロンプト
    const systemPrompt = "あなたは丁寧でフレンドリーなアシスタントです。";
    
    console.log('streamCompletion を呼び出します...');
    const stream = await streamCompletion(prompt, {
      systemPrompt,
      temperature: 0.7,
    });
    
    // ストリームを返す
    const textEncoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        console.log('ストリーミング開始...');
        let chunkCount = 0;
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.text) {
            chunkCount++;
            if (chunkCount <= 3 || chunkCount % 10 === 0) {
              console.log(`ストリームチャンク #${chunkCount}:`, chunk.delta.text.substring(0, 20) + '...');
            }
            controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        
        console.log(`ストリーミング完了: 合計 ${chunkCount} チャンク送信`);
        controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
    
    console.log('ストリーミングレスポンスを返します');
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('ストリーミングテスト全体エラー:', error);
    
    return new Response(
      JSON.stringify({ error: '処理中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}