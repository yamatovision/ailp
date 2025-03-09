const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Next.jsサーバー再起動準備をしています...');

// .nextディレクトリを削除してキャッシュをクリア
try {
  console.log('Next.jsキャッシュをクリアしています...');
  const nextCachePath = path.join(__dirname, '..', '.next');
  
  if (fs.existsSync(nextCachePath)) {
    fs.rmSync(nextCachePath, { recursive: true, force: true });
    console.log('- .nextディレクトリを削除しました');
  } else {
    console.log('- .nextディレクトリは既に存在しません');
  }
} catch (err) {
  console.error('キャッシュクリア中にエラーが発生しました:', err.message);
}

// Prismaキャッシュを再生成
try {
  console.log('\nPrismaクライアントを再生成しています...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prismaクライアントの再生成に成功しました');
} catch (err) {
  console.error('Prismaクライアントの再生成に失敗しました:', err);
}

console.log('\n再起動の準備が完了しました。以下のコマンドでサーバーを再起動してください:');
console.log('npm run dev');
console.log('\n注意: このスクリプトはサーバーを直接再起動しません。手動でnpm run devを実行してください。');