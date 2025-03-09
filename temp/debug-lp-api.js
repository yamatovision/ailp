// APIデバッグスクリプト
// Node.js環境で実行: node temp/debug-lp-api.js

const fetch = require('node-fetch');

// デバッグ用API呼び出し関数
async function debugAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // 開発環境用の認証回避フラグ（ミドルウェアでスキップする）
      'X-Debug-Mode': 'true',
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n===== API呼び出し: ${method} ${endpoint} =====`);
  console.log('リクエストオプション:', JSON.stringify(options, null, 2));
  
  try {
    const url = `http://localhost:3000${endpoint}`;
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    console.log(`ステータス: ${response.status} ${response.statusText}`);
    console.log(`ヘッダー:`, Object.fromEntries([...response.headers]));
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('レスポンス:', JSON.stringify(data, null, 2));
      return { success: response.ok, data };
    } else {
      const text = await response.text();
      console.log('テキストレスポンス長さ:', text.length);
      console.log('テキストレスポンス (最初の500文字):', 
        text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      if (text.includes('<!DOCTYPE html>')) {
        console.log('HTMLレスポンスを検出 - サーバーエラーページが返されています');
      }
      return { success: response.ok, text };
    }
  } catch (error) {
    console.error('エラー:', error);
    return { success: false, error: error.message };
  }
}

// テスト実行
async function runDebug() {
  console.log('===== LP API デバッグ開始 =====');
  
  // 1. 基本的なLP一覧取得テスト（認証なし）
  await debugAPI('/api/lp');
  
  // 2. クエリパラメータを追加してテスト
  await debugAPI('/api/lp?skip_auth=true');
  
  // 3. 固有のパスを使ってテスト
  await debugAPI('/api/lp?status=draft&skip_auth=true');
  
  console.log('\n===== デバッグ完了 =====');
}

// デバッグ実行
runDebug().catch(error => {
  console.error('デバッグ実行エラー:', error);
});