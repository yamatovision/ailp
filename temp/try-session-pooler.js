// セッションプーラー接続テスト
const fs = require('fs');
const path = require('path');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// ファイル内容を読み取り
let envContent = fs.readFileSync(envFilePath, 'utf8');

// 現在のDATABASE_URLを取得
let currentUrl = '';
const urlMatch = envContent.match(/DATABASE_URL=["'](.+?)["'](\r?\n|$)/);
if (urlMatch && urlMatch[1]) {
  currentUrl = urlMatch[1];
  
  // ポートを6543から5432に変更
  const sessionPoolerUrl = currentUrl.replace(':6543/', ':5432/');
  
  // URLが変更された場合のみ更新
  if (sessionPoolerUrl !== currentUrl) {
    envContent = envContent.replace(/DATABASE_URL=["'].+?["'](\r?\n|$)/g, `DATABASE_URL="${sessionPoolerUrl}"$1`);
    console.log('DATABASE_URLをセッションプーラー（ポート5432）に更新しました');
    
    // ファイルに書き込み
    fs.writeFileSync(envFilePath, envContent);
    console.log('.env.localファイルを更新しました');
    console.log('\n次のステップを実行してください:');
    console.log('1. Prismaクライアントを再生成: npx prisma generate');
    console.log('2. サーバーを再起動: npm run dev');
    console.log('3. 接続テスト実行: node temp/test-minimal-db.js');
  } else {
    console.log('DATABASE_URLは既にセッションプーラー（ポート5432）を使用しています');
  }
} else {
  console.log('DATABASE_URL設定が見つかりませんでした');
}
