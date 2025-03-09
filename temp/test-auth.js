// 認証デバッグテストスクリプト
// Node.js 環境で以下のコマンドで実行可能：
// node temp/test-auth.js

console.log('Supabase 認証トークンデバッグスクリプト');
console.log('-------------------------------------');

// ローカルストレージのモック（ブラウザ環境をシミュレート）
const mockLocalStorage = {
  items: {},
  getItem(key) {
    return this.items[key] || null;
  },
  setItem(key, value) {
    this.items[key] = value;
  },
  removeItem(key) {
    delete this.items[key];
  },
  clear() {
    this.items = {};
  },
  get length() {
    return Object.keys(this.items).length;
  },
  key(index) {
    return Object.keys(this.items)[index] || null;
  }
};

// テスト用のサンプルトークンデータ
const testTokenData = {
  'supabase.auth.token': JSON.stringify({
    currentSession: {
      access_token: 'test_access_token_supabase_auth',
      refresh_token: 'test_refresh_token',
      expires_at: Date.now() + 3600000 // 1時間後
    }
  }),
  'sb-YOUR_PROJECT_REF-auth-token': JSON.stringify({
    session: {
      access_token: 'test_access_token_sb',
      refresh_token: 'test_refresh_token',
      expires_at: Date.now() + 3600000 // 1時間後
    }
  })
};

// テストデータをローカルストレージに設定
Object.keys(testTokenData).forEach(key => {
  mockLocalStorage.setItem(key, testTokenData[key]);
});

// トークン取得関数（src/lib/api/lp.ts から抽出）
function getAuthToken() {
  let authToken;
  
  const localStorage = mockLocalStorage; // ブラウザでは実際のlocalStorageを使用
  
  // Supabaseの認証トークンを取得するための様々なキーをチェック
  const supabaseKeys = Object.keys(localStorage.items).filter(key => 
    key.startsWith('supabase.auth.token') || 
    key.startsWith('sb-') || 
    key.includes('supabase')
  );
  
  console.log('検出されたSupabase関連のlocalStorageキー:', supabaseKeys);
  
  if (supabaseKeys.length > 0) {
    for (const key of supabaseKeys) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log(`キー "${key}" から解析されたデータ:`, parsedData);
          
          // Supabaseのトークン構造に合わせて様々なパスをチェック
          if (parsedData?.currentSession?.access_token) {
            authToken = parsedData.currentSession.access_token;
            console.log(`トークンが見つかりました (currentSession.access_token): ${authToken.substring(0, 10)}...`);
            break;
          } else if (parsedData?.access_token) {
            authToken = parsedData.access_token;
            console.log(`トークンが見つかりました (access_token): ${authToken.substring(0, 10)}...`);
            break;
          } else if (parsedData?.session?.access_token) {
            authToken = parsedData.session.access_token;
            console.log(`トークンが見つかりました (session.access_token): ${authToken.substring(0, 10)}...`);
            break;
          }
        }
      } catch (e) {
        console.error(`トークン解析エラー (${key}):`, e);
      }
    }
  }
  
  return authToken;
}

// テスト実行
console.log('トークン取得テスト:');
console.log('-------------------');
const token = getAuthToken();
console.log('最終的に取得されたトークン:', token ? `${token.substring(0, 10)}...` : 'なし');

// テスト結果のサマリー
console.log('\nテスト結果サマリー:');
console.log('----------------');
console.log('トークン取得状態:', token ? '成功' : '失敗');
console.log('見つかったlocalStorageアイテム数:', mockLocalStorage.length);
console.log('デバッグテスト完了!');