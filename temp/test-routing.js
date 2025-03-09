'use client';

// このファイルは Next.js のルーティングテスト用です
// ブラウザコンソールで実行してください

function testRouting() {
  console.log('ルーティングテスト開始');
  
  // LP作成APIをモック
  const mockCreateLP = () => {
    return {
      id: 'test-' + Date.now(),
      title: 'テスト用LP',
      description: 'テスト説明',
      status: 'draft',
      thumbnail: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };
  
  // Next.jsのルーターをモック
  const mockRouter = {
    push: (url) => {
      console.log('router.push 呼び出し:', url);
      console.log('実際には遷移せず、ログのみ出力');
    }
  };
  
  // 各種リダイレクト方法をテスト
  async function testRedirects() {
    try {
      console.log('テスト1: router.push');
      const lp1 = mockCreateLP();
      mockRouter.push(`/lp/${lp1.id}/edit/generate`);
      
      console.log('\nテスト2: window.location.href (コメントアウト)');
      const lp2 = mockCreateLP();
      console.log(`window.location.href = '/lp/${lp2.id}/edit/generate' を実行するとページ遷移します`);
      // window.location.href = `/lp/${lp2.id}/edit/generate`;
      
      console.log('\nテスト3: window.location.replace');
      const lp3 = mockCreateLP();
      console.log(`window.location.replace('/lp/${lp3.id}/edit/generate') を実行するとページ遷移します`);
      // window.location.replace(`/lp/${lp3.id}/edit/generate`);
      
      console.log('\nテスト4: window.open');
      const lp4 = mockCreateLP();
      console.log(`window.open('/lp/${lp4.id}/edit/generate', '_self') を実行するとページ遷移します`);
      // window.open(`/lp/${lp4.id}/edit/generate`, '_self');
      
      console.log('\nテスト完了');
    } catch (error) {
      console.error('テストエラー:', error);
    }
  }
  
  testRedirects();
}

// 以下をブラウザコンソールで実行してテスト
console.log('ブラウザコンソールでこのスクリプトを読み込んだ後、testRouting()を実行してください');