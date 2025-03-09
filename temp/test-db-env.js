// 環境変数をログ出力するスクリプト
console.log('=== 環境変数の確認 ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'セット済み' : '未設定');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'セット済み' : '未設定');
console.log('PRISMA_CLIENT_NO_PREPARED_STATEMENTS:', process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS);