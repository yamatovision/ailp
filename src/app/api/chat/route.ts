import { NextRequest, NextResponse } from 'next/server';
import { getCompletion } from '@/server/ai/claude-client';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  try {
    console.log('CLAUDE_API_KEY in API route:', process.env.CLAUDE_API_KEY ? '設定されています' : '設定されていません');
    console.log('CLAUDE_API_MODEL in API route:', process.env.CLAUDE_API_MODEL || 'デフォルト値を使用します');
    
    try {
      const { message, history } = await req.json();
      
      // 必須パラメータのバリデーション
      if (!message) {
        return NextResponse.json(
          { error: 'メッセージが必要です' },
          { status: 400 }
        );
      }
      
      if (!process.env.CLAUDE_API_KEY) {
        console.error('CLAUDE_API_KEY が設定されていません');
        return NextResponse.json(
          { error: 'API設定が不完全です。環境変数 CLAUDE_API_KEY を設定してください。' },
          { status: 500 }
        );
      }
      
      // 会話履歴を構築
      const conversationContext = history && history.length > 0
        ? history.map((msg: any) => `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`).join('\n\n')
        : '';
      
      // プロンプトを構築
      const prompt = `
# 文章作成アシスタント

あなたは文章作成を支援するアシスタントです。ユーザーの入力から最適な文章を作成してください。

## これまでの会話:
${conversationContext}

## ユーザーの新しいメッセージ:
${message}

ユーザーの情報を整理し、追加情報が必要な場合は質問してください。十分な情報が集まったら、適切な文章を作成・提案します。
    `;
      
      // システムプロンプト
      const systemPrompt = `
あなたは文章作成の専門家です。マーケティングの知識と文章作成の経験を活かし、効果的な文章を提案します。

ユーザーから次の情報を引き出すよう努めてください：
1. 目的とターゲットオーディエンス
2. 文章の形式（LP、Webサイト、広告文、SNS投稿など）
3. 伝えたい主要なメッセージ
4. トーンと声（フォーマル、カジュアル、フレンドリーなど）
5. 文章の長さ（文字数など）

十分な情報が得られたら、目的に合った文章を作成し、必要に応じて改善提案も行ってください。
    `;
      
      try {
        // AIからの応答を取得
        console.log('getCompletion を呼び出します...');
        const response = await getCompletion(prompt, {
          systemPrompt,
          temperature: 0.7,
        });
        console.log('getCompletion 呼び出し完了');
        
        return NextResponse.json({ response });
      } catch (aiError) {
        console.error('AI API エラー:', aiError);
        return NextResponse.json(
          { error: 'AI APIとの通信中にエラーが発生しました', details: aiError instanceof Error ? aiError.message : String(aiError) },
          { status: 500 }
        );
      }
    } catch (jsonError) {
      console.error('JSONパースエラー:', jsonError);
      return NextResponse.json(
        { error: 'リクエストの解析に失敗しました' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Chat API全体エラー:', error);
    
    return NextResponse.json(
      { error: '処理中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}