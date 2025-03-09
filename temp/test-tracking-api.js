/**
 * トラッキングAPIのテスト用スクリプト
 * トラッキングデータの永続化APIを包括的にテストする
 * 
 * 実行方法:
 * node temp/test-tracking-api.js
 */

const fetch = require('node-fetch');

// 基本設定
const API_BASE_URL = 'http://localhost:3000/api';
const LP_ID = 'test-lp-id';  // テスト用LP ID
const SESSION_ID = `test-session-${Date.now()}`;  // テスト用セッションID
const COMPONENT_ID = 'test-component-1';  // テスト用コンポーネントID

// 1. バッチトラッキングAPIのテスト
async function testBatchTracking() {
  console.log('\n--- バッチトラッキングAPIのテスト ---');
  
  const testEvents = [
    // ページビューイベント
    {
      type: 'pageview',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      meta: {
        url: 'http://localhost:3000/test-page',
        referrer: 'http://localhost:3000/'
      }
    },
    // コンポーネント表示イベント
    {
      type: 'component_view',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      componentId: 'test-component-1',
      variant: 'a',
      timestamp: Date.now(),
      meta: {
        viewTime: Date.now()
      }
    },
    // クリックイベント
    {
      type: 'click',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      componentId: 'test-component-1',
      variant: 'a',
      timestamp: Date.now(),
      data: {
        element: 'button-primary'
      }
    }
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: testEvents })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('バッチトラッキングAPI結果:', result);
    console.log('ステータス:', response.status);
    return true;
  } catch (error) {
    console.error('バッチトラッキングAPIエラー:', error.message);
    return false;
  }
}

// 2. Beacon APIのテスト
async function testBeaconAPI() {
  console.log('\n--- Beacon APIのテスト ---');
  
  const testEvents = [
    // 離脱イベント
    {
      type: 'exit',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      meta: {
        exitUrl: 'http://localhost:3000/next-page',
        timeOnPage: 15000,
        scrollDepth: 85
      }
    }
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/beacon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: testEvents })
    });
    
    console.log('Beacon API結果 - ステータス:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('Beacon APIエラー:', error.message);
    return false;
  }
}

// 3. 同期XMLHttpRequestのテスト
async function testSyncAPI() {
  console.log('\n--- 同期XMLHttpRequestのテスト ---');
  
  const testEvents = [
    // 離脱イベント（同期API用）
    {
      type: 'exit',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      meta: {
        exitUrl: 'http://localhost:3000/other-page',
        timeOnPage: 25000,
        scrollDepth: 100
      }
    }
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: testEvents })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('同期API結果:', result);
    console.log('ステータス:', response.status);
    return true;
  } catch (error) {
    console.error('同期APIエラー:', error.message);
    return false;
  }
}

// 4. コンバージョンイベントのテスト
async function testConversionTracking() {
  console.log('\n--- コンバージョントラッキングのテスト ---');
  
  const testEvents = [
    // コンバージョンイベント
    {
      type: 'conversion',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      data: {
        conversionType: 'form_submit',
        value: 1
      }
    }
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: testEvents })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('コンバージョントラッキング結果:', result);
    console.log('ステータス:', response.status);
    return true;
  } catch (error) {
    console.error('コンバージョントラッキングエラー:', error.message);
    return false;
  }
}

// 5. カスタムイベントのテスト
async function testCustomEvent() {
  console.log('\n--- カスタムイベントのテスト ---');
  
  const testEvents = [
    // カスタムイベント
    {
      type: 'custom',
      lpId: LP_ID,
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      data: {
        eventName: 'video_watched',
        duration: 120,
        percentage: 75
      }
    }
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: testEvents })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('カスタムイベント結果:', result);
    console.log('ステータス:', response.status);
    return true;
  } catch (error) {
    console.error('カスタムイベントエラー:', error.message);
    return false;
  }
}

// 6. 公開LP APIのテスト
async function testPublicLpAPI() {
  console.log('\n--- 公開LP APIのテスト ---');
  
  // 実際のLPデータがないので、エラーになることを確認するだけ
  try {
    const response = await fetch(`${API_BASE_URL}/public/lp/${LP_ID}`);
    
    console.log('公開LP API結果 - ステータス:', response.status);
    
    if (response.status === 404) {
      console.log('予想通りのエラー: LPが見つかりません (404)');
      return true;
    }
    
    // 実際のLPデータがある場合のみ成功する
    if (response.ok) {
      const result = await response.json();
      console.log('公開LP API結果:', result);
      return true;
    }
    
    console.error('予期しないHTTPステータス:', response.status);
    return false;
  } catch (error) {
    console.error('公開LP APIエラー:', error.message);
    return false;
  }
}

// 7. 統計情報APIのテスト
async function testStatsAPI() {
  console.log('\n--- 統計情報APIのテスト ---');
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/stats?lpId=${LP_ID}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('統計情報API結果:', result);
    console.log('ステータス:', response.status);
    return true;
  } catch (error) {
    console.error('統計情報APIエラー:', error.message);
    return false;
  }
}

// 8. コンポーネント統計APIのテスト
async function testComponentStatsAPI() {
  console.log('\n--- コンポーネント統計APIのテスト ---');
  
  try {
    const response = await fetch(`${API_BASE_URL}/tracking/stats/components?lpId=${LP_ID}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('コンポーネント統計API結果:', result);
    console.log('ステータス:', response.status);
    return true;
  } catch (error) {
    console.error('コンポーネント統計APIエラー:', error.message);
    return false;
  }
}

// 9. データエクスポートAPIのテスト
async function testExportAPI() {
  console.log('\n--- データエクスポートAPIのテスト ---');
  
  try {
    // JSONフォーマットでエクスポート
    const jsonResponse = await fetch(`${API_BASE_URL}/tracking/export?lpId=${LP_ID}&format=json`);
    
    if (!jsonResponse.ok) {
      throw new Error(`HTTP error ${jsonResponse.status}: ${jsonResponse.statusText}`);
    }
    
    const jsonResult = await jsonResponse.json();
    console.log('JSONエクスポート結果 (一部):', {
      lpId: jsonResult.lpId,
      exportDate: jsonResult.exportDate,
      totalEvents: jsonResult.totalEvents,
      totalComponentEvents: jsonResult.totalComponentEvents
    });
    
    // CSVフォーマットでエクスポート
    const csvResponse = await fetch(`${API_BASE_URL}/tracking/export?lpId=${LP_ID}&format=csv`);
    
    if (!csvResponse.ok) {
      throw new Error(`HTTP error ${csvResponse.status}: ${csvResponse.statusText}`);
    }
    
    const csvResult = await csvResponse.text();
    console.log('CSVエクスポート結果 (先頭部分):', csvResult.substring(0, 150) + '...');
    
    return true;
  } catch (error) {
    console.error('データエクスポートAPIエラー:', error.message);
    return false;
  }
}

// すべてのテストを実行
async function runAllTests() {
  console.log('=== トラッキングAPIテスト開始 ===');
  
  let results = {};
  
  // 各テスト実行
  results.batchTracking = await testBatchTracking();
  results.beaconAPI = await testBeaconAPI();
  results.syncAPI = await testSyncAPI();
  results.conversionTracking = await testConversionTracking();
  results.customEvent = await testCustomEvent();
  results.publicLpAPI = await testPublicLpAPI();
  results.statsAPI = await testStatsAPI();
  results.componentStatsAPI = await testComponentStatsAPI();
  results.exportAPI = await testExportAPI();
  
  // 結果サマリー
  console.log('\n=== テスト結果サマリー ===');
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${test}: ${passed ? '✅ 成功' : '❌ 失敗'}`);
  }
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n全体結果: ${allPassed ? '✅ すべて成功' : '❌ 一部失敗'}`);
}

// テスト実行
runAllTests().catch(err => {
  console.error('テスト実行中にエラーが発生しました:', err);
});