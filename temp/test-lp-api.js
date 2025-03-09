// LP API テスト用スクリプト
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// テスト用のLP IDと一致するデモデータの準備
const mockLPData = {
  id: 'demo-lp-123',
  name: 'デモLP',
  description: 'テスト用デモランディングページ',
  components: [
    {
      id: 'comp-hero-1',
      componentType: 'hero',
      position: 0,
      html: `<section class="bg-purple-700 text-white p-8 text-center">
        <h1 class="text-4xl font-bold">AIで作る 刺さるLP 5日間無料チャレンジ！</h1>
        <p class="mt-4">たった5日で、あなたの事業の"強み"を最大限引き出す最強集客LPが完成</p>
      </section>`,
    },
    {
      id: 'comp-benefits-1',
      componentType: 'benefits',
      position: 1,
      html: `<section class="bg-white p-8">
        <h2 class="text-3xl font-bold text-center mb-8">3つの特典</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-gray-100 p-6 rounded-lg">
            <h3 class="text-xl font-bold">特典1</h3>
            <p>成約率2倍のLP構成テンプレート</p>
          </div>
          <div class="bg-gray-100 p-6 rounded-lg">
            <h3 class="text-xl font-bold">特典2</h3>
            <p>セールスコピーライティング講座</p>
          </div>
          <div class="bg-gray-100 p-6 rounded-lg">
            <h3 class="text-xl font-bold">特典3</h3>
            <p>プロによる個別LP添削</p>
          </div>
        </div>
      </section>`,
    }
  ],
  meta: {
    sessionId: 'test-session-abc123'
  }
};

// APIの基本URLの生成
const API_BASE_URL = 'http://localhost:3000/api';

// HTTPリクエストヘルパー
async function sendRequest(method, url, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : {}
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data
            });
          }
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// テスト関数
async function runTests() {
  console.log('===== LP API テスト開始 =====');
  
  try {
    // テスト1: 公開LP取得API
    const mockEndpointData = JSON.stringify(mockLPData, null, 2);
    console.log(`\n[テスト] /api/public/lp/${mockLPData.id} エンドポイントにアクセスし、モックデータを返します:`);
    console.log(`モックデータ: ${mockEndpointData.substring(0, 100)}...`);
    
    console.log('\n実際のAPIが利用できる場合は以下のコードでテストできます:');
    console.log(`curl -X GET "${API_BASE_URL}/public/lp/${mockLPData.id}"`);
    
    // テスト2: イベントトラッキングAPI
    const mockEvent = {
      lpId: mockLPData.id,
      sessionId: mockLPData.meta.sessionId,
      eventType: 'pageview',
      pathname: '/',
      timestamp: Date.now()
    };
    
    console.log('\n[テスト] /api/tracking/pageview エンドポイントへのPOSTリクエスト:');
    console.log(`ペイロード: ${JSON.stringify(mockEvent, null, 2)}`);
    
    console.log('\n実際のAPIが利用できる場合は以下のコードでテストできます:');
    console.log(`curl -X POST "${API_BASE_URL}/tracking/pageview" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(mockEvent)}'`);
    
    // テスト3: コンポーネントトラッキングAPI
    const mockComponentEvent = {
      lpId: mockLPData.id,
      sessionId: mockLPData.meta.sessionId,
      componentId: 'comp-hero-1',
      componentType: 'hero',
      variant: 'a',
      eventType: 'view',
      timestamp: Date.now()
    };
    
    console.log('\n[テスト] /api/tracking/component エンドポイントへのPOSTリクエスト:');
    console.log(`ペイロード: ${JSON.stringify(mockComponentEvent, null, 2)}`);
    
    console.log('\n実際のAPIが利用できる場合は以下のコードでテストできます:');
    console.log(`curl -X POST "${API_BASE_URL}/tracking/component" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(mockComponentEvent)}'`);
    
    // 実際にテストを実行するコマンド例を書き出す
    await fs.writeFile(
      path.join(__dirname, 'test-api-curl.sh'),
      `#!/bin/bash
      
# 公開LP取得API
curl -X GET "http://localhost:3000/api/public/lp/${mockLPData.id}"

# ページビュートラッキングAPI
curl -X POST "http://localhost:3000/api/tracking/pageview" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(mockEvent)}'

# コンポーネントトラッキングAPI
curl -X POST "http://localhost:3000/api/tracking/component" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(mockComponentEvent)}'

# コンバージョントラッキングAPI
curl -X POST "http://localhost:3000/api/tracking/conversion" \\
  -H "Content-Type: application/json" \\
  -d '{
    "lpId": "${mockLPData.id}",
    "sessionId": "${mockLPData.meta.sessionId}",
    "conversionType": "form_submit",
    "data": {
      "componentId": "comp-hero-1",
      "variant": "a",
      "formId": "signup-form"
    }
  }'
`
    );
    
    console.log('\nテスト用のcurlコマンドをtemp/test-api-curl.shに保存しました。');
    console.log('実行権限を付与して実行できます:');
    console.log('chmod +x temp/test-api-curl.sh && ./temp/test-api-curl.sh');
    
    console.log('\n===== LP API テスト完了 =====');
    console.log('※注意: 実際のAPIテストには、Next.jsサーバーが起動している必要があります。');
    console.log('  サーバーを起動するには: npm run dev');
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
  }
}

runTests();