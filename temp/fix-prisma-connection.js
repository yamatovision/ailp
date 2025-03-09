const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Prisma接続問題修正スクリプトを実行しています...');

// 現在の環境変数を確認
console.log('現在の環境変数:');
console.log(`DATABASE_URL=${process.env.DATABASE_URL || '未設定'}`);
console.log(`DIRECT_URL=${process.env.DIRECT_URL || '未設定'}`);
console.log(`PRISMA_CLIENT_NO_PREPARED_STATEMENTS=${process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS || '未設定'}`);

// Prismaクライアントを削除してクリーンな状態にする
try {
  console.log('Prismaクライアントモジュールをクリーンアップしています...');
  fs.rmSync(path.join(__dirname, '..', 'node_modules', '.prisma'), { recursive: true, force: true });
  console.log('- .prismaフォルダを削除しました');
  
  // node_modules/@prisma/clientを削除 - 再インストールされる
  fs.rmSync(path.join(__dirname, '..', 'node_modules', '@prisma', 'client'), { recursive: true, force: true });
  console.log('- @prisma/clientを削除しました');
} catch (err) {
  console.log(`クリーンアップ中にエラーが発生しました: ${err.message}`);
}

// prisma generateを実行
try {
  console.log('\nPrismaクライアントを再生成しています...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prismaクライアントの再生成に成功しました');
} catch (err) {
  console.error('Prismaクライアントの再生成に失敗しました:', err);
  process.exit(1);
}

console.log('\n修正が完了しました。以下の手順を実行してください:');
console.log('1. サーバーを停止して再起動してください: Ctrl+C で停止し、npm run dev で再起動');
console.log('2. エラーが続く場合は、パッケージを完全に再インストールしてください: rm -rf node_modules && npm install');