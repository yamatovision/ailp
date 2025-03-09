// デザインシステムAPIのテスト
require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';
const LP_ID = 'test-lp-id'; // 実際のLPのIDに置き換える必要があります

// 認証用のモックトークン (実際のテストでは有効なトークンが必要)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'your-auth-token';

// デザインシステムのサンプル
const mockDesignSystem = {
  designSystem: {
    designSystem: {
      colors: {
        primary: "#3B82F6",
        secondary: "#10B981",
        accent: "#F59E0B",
        background: "#FFFFFF",
        text: "#1F2937",
        heading: "#111827",
        muted: "#6B7280",
        border: "#E5E7EB",
      },
      typography: {
        fonts: {
          heading: "ui-sans-serif, system-ui, sans-serif",
          body: "ui-sans-serif, system-ui, sans-serif"
        },
        sizes: {
          h1: "2.25rem",
          h2: "1.875rem",
          h3: "1.5rem",
          h4: "1.25rem",
          body: "1rem",
          small: "0.875rem"
        },
        weights: {
          normal: "400",
          medium: "500",
          bold: "700"
        }
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem"
      },
      borderRadius: {
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.5rem",
        full: "9999px"
      }
    },
    tailwindConfig: {
      theme: {
        extend: {
          colors: {
            primary: "#3B82F6",
            secondary: "#10B981",
            accent: "#F59E0B"
          }
        }
      }
    },
    globalCss: `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      
      @layer base {
        body {
          font-family: ui-sans-serif, system-ui, sans-serif;
          color: #1F2937;
          background-color: #FFFFFF;
        }
      }
    `
  },
  designStyle: "modern"
};

// APIが利用可能かの基本チェック
async function checkEndpoints() {
  try {
    console.log('API エンドポイントの可用性を確認中...');
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('API サーバーは正常に動作しています');
    } else {
      console.warn(`APIサーバーからエラーレスポンスを受信: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('APIサーバーへの接続に失敗しました。サーバーが起動しているか確認してください。', error);
  }
}

// デザインシステム保存APIのテスト
async function testSaveDesignSystem() {
  try {
    console.log('デザインシステム保存APIのテスト...');
    const response = await fetch(`${API_BASE_URL}/api/lp/${LP_ID}/design-system`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(mockDesignSystem)
    });
    
    const data = await response.json();
    console.log('デザインシステム保存API レスポンス:', data);
    
    if (response.ok) {
      console.log('✅ デザインシステム保存API テスト成功');
    } else {
      console.error('❌ デザインシステム保存API テスト失敗:', data.error || response.statusText);
    }
    
    return response.ok;
  } catch (error) {
    console.error('デザインシステム保存API テスト エラー:', error);
    return false;
  }
}

// デザインシステム取得APIのテスト
async function testGetDesignSystem() {
  try {
    console.log('デザインシステム取得APIのテスト...');
    const response = await fetch(`${API_BASE_URL}/api/lp/${LP_ID}/design-system`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const data = await response.json();
    console.log('デザインシステム取得API レスポンス:', data);
    
    if (response.ok) {
      console.log('✅ デザインシステム取得API テスト成功');
      
      // 保存したデータと一致しているか確認
      if (data.designStyle === mockDesignSystem.designStyle) {
        console.log('✅ デザインスタイルが一致しています');
      } else {
        console.warn('⚠️ デザインスタイルが一致していません');
      }
      
      if (data.designSystem) {
        console.log('✅ デザインシステムデータが存在します');
      }
    } else {
      console.error('❌ デザインシステム取得API テスト失敗:', data.error || response.statusText);
    }
    
    return response.ok;
  } catch (error) {
    console.error('デザインシステム取得API テスト エラー:', error);
    return false;
  }
}

// 全テストの実行
async function runTests() {
  console.log('===== デザインシステムAPI テスト開始 =====');
  
  // APIサーバー状態チェック
  await checkEndpoints();
  
  // 実際のテスト
  const saveSuccess = await testSaveDesignSystem();
  
  if (saveSuccess) {
    await testGetDesignSystem();
  }
  
  console.log('===== デザインシステムAPI テスト完了 =====');
}

// エラー発生時のスタックトレース表示改善
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// テスト実行
runTests();