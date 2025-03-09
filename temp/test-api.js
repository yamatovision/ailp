// テストスクリプト for LP API
// Node.js環境で実行: node temp/test-api.js

const fetch = require('node-fetch');

// API呼び出し関数
async function testAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n===== API呼び出し: ${method} ${endpoint} =====`);
  
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, options);
    const contentType = response.headers.get('content-type');
    
    console.log(`ステータス: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('レスポンス:', JSON.stringify(data, null, 2));
      return { success: response.ok, data };
    } else {
      const text = await response.text();
      console.log('テキストレスポンス:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      return { success: response.ok, text };
    }
  } catch (error) {
    console.error('エラー:', error.message);
    return { success: false, error: error.message };
  }
}

// 実行するテスト
async function runTests() {
  console.log('===== LP API テスト開始 =====');
  
  // LP一覧取得テスト
  await testAPI('/api/lp');
  
  // LP作成テスト
  await testAPI('/api/lp', 'POST', { 
    title: 'テストLP', 
    description: 'APIテストから作成されたLP' 
  });
  
  console.log('\n===== テスト完了 =====');
}

// テスト実行
runTests().catch(error => {
  console.error('テスト実行エラー:', error);
});