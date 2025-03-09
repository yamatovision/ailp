// Claude API テスト

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// 環境変数のチェック
const apiKey = process.env.CLAUDE_API_KEY;
const model = process.env.CLAUDE_API_MODEL || 'claude-3-7-sonnet-20250219';

console.log('=== Claude API テスト ===');
console.log('API Key設定状況:', apiKey ? '設定済み' : '未設定');
console.log('使用モデル:', model);

if (!apiKey) {
  console.error('エラー: CLAUDE_API_KEY 環境変数が設定されていません');
  process.exit(1);
}

// Anthropicクライアントの初期化
const anthropic = new Anthropic({
  apiKey: apiKey,
});

// テスト用プロンプト
const testPrompt = `
Generate a design system for a modern corporate website with:
- Color palette (primary, secondary, accent colors)
- Typography recommendations
- Component styles (buttons, cards, etc.)

Return the result as a structured JSON object.
`;

// モック用のClaude APIクラス（design-system-generator.tsで使用されるもの）
const Claude = {
  async sendMessage({ message, system, temperature = 0.7 }) {
    console.log('Claude.sendMessageを呼び出し');
    console.log('- message:', message.substring(0, 100) + '...');
    console.log('- system:', system);
    console.log('- temperature:', temperature);
    
    try {
      // 実際のAnthropicクライアントを使用
      const response = await anthropic.messages.create({
        model: model,
        system: system || 'You are an expert LP designer and web developer.',
        messages: [{ role: 'user', content: message }],
        temperature,
        max_tokens: 4000,
      });
      
      return { content: response.content[0].text };
    } catch (error) {
      console.error('APIエラー:', error);
      throw error;
    }
  }
};

// テスト実行
async function testClaudeAPI() {
  console.log('\n=== 標準APIテスト ===');
  console.log('APIリクエスト送信中...');
  
  try {
    console.time('API応答時間');
    
    // 標準的なClaude API呼び出し
    const response = await anthropic.messages.create({
      model: model,
      system: 'You are an expert UI/UX designer.',
      messages: [{ role: 'user', content: testPrompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });
    
    console.timeEnd('API応答時間');
    
    // 応答メタデータ表示
    console.log('\n=== レスポンスメタデータ ===');
    console.log('モデル:', response.model);
    console.log('トークン使用量:', {
      input_tokens: response.usage?.input_tokens || 'N/A',
      output_tokens: response.usage?.output_tokens || 'N/A'
    });
    
    // 応答内容表示
    console.log('\n=== レスポンス内容 ===');
    console.log(response.content[0].text.substring(0, 500) + '...');
    
    // カスタムClaude実装のテスト
    console.log('\n=== カスタムClaude実装テスト ===');
    const customResponse = await Claude.sendMessage({
      message: testPrompt,
      system: 'You are an expert UI/UX designer.',
      temperature: 0.7,
    });
    
    console.log('カスタムResponse:', customResponse.content.substring(0, 200) + '...');
    
    console.log('\n=== テスト結果 ===');
    console.log('ステータス: 成功');
    
  } catch (error) {
    console.timeEnd('API応答時間');
    console.error('\n=== エラー発生 ===');
    console.error('エラーメッセージ:', error.message);
    console.error('詳細:', error);
    console.log('ステータス: 失敗');
  }
}

// テスト実行
testClaudeAPI();