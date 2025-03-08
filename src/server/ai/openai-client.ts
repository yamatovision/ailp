import OpenAI from 'openai';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// モデル名を環境変数から取得（デフォルトはGPT-4）
export const MODEL_NAME = process.env.OPENAI_API_MODEL || 'gpt-4o';

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

  const stream = await openai.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: systemPrompt || 'You are an expert LP designer and web developer.',
      },
      { role: 'user', content: prompt },
    ],
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

  const response = await openai.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: systemPrompt || 'You are an expert LP designer and web developer.',
      },
      { role: 'user', content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0].message.content;
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

export default openai;