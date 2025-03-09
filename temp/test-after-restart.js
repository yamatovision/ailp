// サーバー再起動後のテスト方法
console.log('サーバー再起動後のテスト手順:');
console.log('1. 次のコマンドでサーバーを再起動:');
console.log('   npm run dev');
console.log('2. サーバー起動後、別のターミナルで次のコマンドを実行:');
console.log('   node temp/debug-lp-api.js');
console.log('3. レスポンスを確認');

console.log('\n現在の環境変数設定を確認します:');
const fs = require('fs');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  // 機密情報を隠して表示
  const safeContent = envContent
    .replace(/(PASSWORD|KEY|TOKEN)=(.*)/g, '$1=***隠蔽済み***')
    .replace(/(DATABASE_URL|DIRECT_URL)=([^\\n]*)/g, '$1=***隠蔽済み***');
  
  console.log('.env.local の内容:');
  console.log(safeContent);
  
  // 重要な設定の確認
  const hasPrismaNoStatements = envContent.includes('PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true');
  const mockSetting = envContent.match(/USE_MOCK_DATA=([^\r\n]*)/);
  
  console.log('\n重要な設定:');
  console.log(`- PRISMA_CLIENT_NO_PREPARED_STATEMENTS: ${hasPrismaNoStatements ? '有効' : '無効'}`);
  console.log(`- USE_MOCK_DATA: ${mockSetting ? mockSetting[1] : '未設定'}`);
} catch (err) {
  console.error('.env.localファイルの読み込みエラー:', err.message);
}