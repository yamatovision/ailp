// Claudeストリーミングテスト用スクリプト
const fetch = require('node-fetch');
require('dotenv').config();

async function testStreaming() {
  console.log('Claudeストリーミングテストを開始します...');
  console.log('API KEY:', process.env.CLAUDE_API_KEY ? '設定済み' : '未設定');
  
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  
  try {
    console.log('APIリクエスト送信...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        messages: [{ role: 'user', content: 'Hello, please count from 1 to 10 slowly, explaining each number briefly.' }],
        max_tokens: 256,
        stream: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('エラーレスポンス:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    console.log('ストリームのレスポンスを受信しました');
    
    // ストリームを処理
    const reader = response.body;
    if (!reader) {
      throw new Error('レスポンスボディが見つかりません');
    }
    
    reader.on('readable', () => {
      let chunk;
      while (null !== (chunk = reader.read())) {
        const text = chunk.toString();
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              console.log('ストリーム終了');
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                process.stdout.write(parsed.delta.text);
              }
            } catch (e) {
              console.error('JSON解析エラー:', e);
            }
          }
        }
      }
    });
    
    reader.on('end', () => {
      console.log('\nストリーム読み取り完了');
    });
    
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
  }
}

testStreaming();