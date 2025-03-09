// test-max-tokens.js - 最大トークン数のテスト

// .env.localファイルから環境変数を読み込む
require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testMaxTokens() {
  console.log('=== 最大トークン数テスト開始 ===');
  
  const apiKey = process.env.CLAUDE_API_KEY;
  const modelName = process.env.CLAUDE_API_MODEL || 'claude-3-7-sonnet-20250219';
  
  console.log('API Key設定状況:', apiKey ? '設定されています' : '設定されていません');
  console.log('使用モデル:', modelName);
  
  if (!apiKey) {
    console.error('エラー: CLAUDE_API_KEY 環境変数が設定されていません。');
    process.exit(1);
  }
  
  // Anthropicクライアントの初期化
  const anthropic = new Anthropic({
    apiKey: apiKey
  });
  
  // 異なるmax_tokensを試す
  const maxTokensValues = [4000, 6000, 8192];
  
  for (const maxTokens of maxTokensValues) {
    try {
      console.log(`\n--- max_tokens=${maxTokens}のテスト ---`);
      console.time(`max_tokens=${maxTokens}の処理時間`);
      
      const response = await anthropic.messages.create({
        model: modelName,
        system: 'You are an expert LP designer and web developer.',
        messages: [{ 
          role: 'user', 
          content: 'AIを活用したLPサービスに最適なランディングページの構造を5つのセクションに分けてJSON形式で提案してください' 
        }],
        temperature: 0.7,
        max_tokens: maxTokens
      });
      
      console.timeEnd(`max_tokens=${maxTokens}の処理時間`);
      
      // レスポンスの内容を取得
      const responseText = response.content[0].text;
      
      console.log(`応答文字数: ${responseText.length}文字`);
      console.log('トークン使用量:', {
        input_tokens: response.usage?.input_tokens || 'N/A',
        output_tokens: response.usage?.output_tokens || 'N/A'
      });
      console.log('応答サンプル:', responseText.substring(0, 100) + '...');
      console.log(`max_tokens=${maxTokens}: 成功`);
    } catch (error) {
      console.timeEnd(`max_tokens=${maxTokens}の処理時間`);
      console.error(`max_tokens=${maxTokens}: エラー`, error.message);
    }
  }
  
  console.log('\n=== テスト完了 ===');
}

testMaxTokens().catch(console.error);
