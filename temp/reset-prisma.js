// Prisma設定リセットスクリプト
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Prisma設定をリセットしています...');

// クリアコマンドの実行
try {
  // Prismaクライアントの再生成
  console.log('\n1. Prismaキャッシュをクリアしています...');
  execSync('rm -rf node_modules/.prisma', { stdio: 'inherit' });
  
  // Prismaキャッシュクリア
  console.log('\n2. Prismaクライアントをアンインストールしています...');
  execSync('npm uninstall @prisma/client', { stdio: 'inherit' });
  
  // Prisma再インストール
  console.log('\n3. Prismaクライアントを再インストールしています...');
  execSync('npm install @prisma/client', { stdio: 'inherit' });
  
  // Prisma再生成
  console.log('\n4. Prismaクライアントを再生成しています...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Prisma設定のリセットが完了しました！');
  console.log('\n次のステップ:');
  console.log('1. 環境変数を更新: node temp/update-connection.js');
  console.log('2. 開発サーバーを再起動: npm run dev');
} catch (error) {
  console.error('エラー:', error.message);
  console.log('\n問題が発生しました。手動でPrismaのリセットを試してください:');
  console.log('1. npm uninstall @prisma/client');
  console.log('2. rm -rf node_modules/.prisma');
  console.log('3. npm install @prisma/client');
  console.log('4. npx prisma generate');
}