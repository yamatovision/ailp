import Anthropic from '@anthropic-ai/sdk';

// Anthropicクライアントの初期化
const apiKey = process.env.CLAUDE_API_KEY;
console.log('CLAUDE_API_KEY 設定状況:', apiKey ? '設定されています' : '設定されていません');

if (!apiKey) {
  console.error('CLAUDE_API_KEY 環境変数が設定されていません。ClaudeのAPIを使用するには、この環境変数が必要です。');
}

const anthropic = new Anthropic({
  apiKey: apiKey || 'dummy-key-for-preventing-crash',
});

// モデル名を環境変数から取得（デフォルトはClaude 3 Sonnet）
export const MODEL_NAME = process.env.CLAUDE_API_MODEL || 'claude-3-sonnet-20240229';

// ストリーミングレスポンスを処理する関数
export async function streamCompletion(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
) {
  const { temperature = 0.7, maxTokens = 4000, systemPrompt = '' } = options;

  const stream = await anthropic.messages.create({
    model: MODEL_NAME,
    system: systemPrompt || 'You are an expert LP designer and web developer.',
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  return stream;
}

// 通常の完了を処理する関数
export async function getCompletion(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
) {
  const { temperature = 0.7, maxTokens = 4000, systemPrompt = '' } = options;

  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY環境変数が設定されていません。AI機能を使用するには、この環境変数が必要です。');
  }

  try {
    console.log(`AnthropicAPI呼び出し: model=${MODEL_NAME}, prompt長=${prompt.length}文字`);
    
    const response = await anthropic.messages.create({
      model: MODEL_NAME,
      system: systemPrompt || 'You are an expert LP designer and web developer.',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    console.log('AnthropicAPI応答を受信: 成功');
    return response.content[0].text;
  } catch (error) {
    console.error('Anthropic API エラー:', error);
    if (error instanceof Error) {
      throw new Error(`Anthropic API エラー: ${error.message}`);
    }
    throw new Error('Anthropic API 呼び出し中に不明なエラーが発生しました');
  }
}

// バッチレスポンスを処理する関数（複数セクションを並列処理）
export async function getBatchCompletions(
  prompts: { id: string; prompt: string; systemPrompt?: string }[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const { temperature = 0.7, maxTokens = 4000 } = options;

  // すべてのプロミスを作成
  const promises = prompts.map(async ({ id, prompt, systemPrompt }) => {
    try {
      const content = await getCompletion(prompt, {
        temperature,
        maxTokens,
        systemPrompt,
      });
      return { id, content, error: null };
    } catch (error) {
      console.error(`Error with prompt ${id}:`, error);
      return { id, content: null, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // すべてのプロミスを並列実行
  const results = await Promise.all(promises);
  return results;
}

export default anthropic;