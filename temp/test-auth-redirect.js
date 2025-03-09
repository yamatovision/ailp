// ログイン処理とリダイレクトのテスト用スクリプト
const fetch = require('node-fetch');

// 設定
const BASE_URL = 'http://localhost:3000'; // 開発サーバーのURLを設定
const TEST_EMAIL = 'test123@mailinator.com';
const TEST_PASSWORD = 'password123';

async function testLogin() {
  console.log('===== ログインAPIのテスト開始 =====');
  
  try {
    // 1. ログインAPIを呼び出し
    console.log('ログインAPIリクエスト送信中...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      // 重要: リダイレクトを自動的に追従しない
      redirect: 'manual',
    });

    console.log('ステータスコード:', loginResponse.status);
    console.log('レスポンスヘッダー:');
    loginResponse.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });

    // リダイレクトの有無をチェック
    if (loginResponse.status >= 300 && loginResponse.status < 400) {
      const redirectUrl = loginResponse.headers.get('location');
      console.log('リダイレクト検出:', redirectUrl);
    } else {
      console.log('リダイレクトなし');
    }

    // レスポンスデータの取得
    const responseData = await loginResponse.json();
    console.log('レスポンスデータ:', JSON.stringify(responseData, null, 2));

    // セッションデータの存在確認
    if (responseData.session) {
      console.log('セッションが正常に返されました。キー:', Object.keys(responseData.session));
    } else {
      console.log('警告: セッションデータがレスポンスに含まれていません');
    }

    // ユーザーデータの存在確認
    if (responseData.user) {
      console.log('ユーザーデータが正常に返されました。ID:', responseData.user.id);
    } else {
      console.log('警告: ユーザーデータがレスポンスに含まれていません');
    }

    // エラーの確認
    if (responseData.error) {
      console.error('エラー:', responseData.error);
    } else {
      console.log('ログイン成功');
    }

    // 2. セッション検証API呼び出し
    console.log('\nセッション検証テスト中...');
    // セッションクッキーを取得
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (cookies) {
      // ダッシュボードページのアクセスをテスト
      const dashboardResponse = await fetch(`${BASE_URL}/dashboard`, {
        headers: {
          Cookie: cookies,
        },
        redirect: 'manual',
      });

      console.log('ダッシュボードアクセスステータス:', dashboardResponse.status);
      console.log('ダッシュボードレスポンスヘッダー:');
      dashboardResponse.headers.forEach((value, name) => {
        console.log(`  ${name}: ${value}`);
      });

      if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
        const redirectUrl = dashboardResponse.headers.get('location');
        console.log('リダイレクト検出:', redirectUrl);
      } else {
        console.log('リダイレクトなし - ダッシュボードアクセス可能');
      }
    } else {
      console.log('警告: セッションクッキーが見つかりません');
    }

  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
  
  console.log('===== ログインAPIのテスト終了 =====');
}

// テスト実行
testLogin();