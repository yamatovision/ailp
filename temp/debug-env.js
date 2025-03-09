// 環境変数デバッグスクリプト
// Node.js環境で実行: node temp/debug-env.js

console.log('===== 環境変数デバッグスクリプト =====');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Next.js関連の環境変数
console.log('\n===== Next.js関連の環境変数 =====');
const nextVars = Object.keys(process.env).filter(key => key.startsWith('NEXT_'));
nextVars.forEach(key => {
  // 値が空でないか確認（機密情報は表示しない）
  const value = process.env[key];
  const isSensitive = key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN');
  const displayValue = value 
    ? (isSensitive ? `${value.substring(0, 5)}...（機密情報のため省略）` : value) 
    : 'Not set';
  console.log(`${key}: ${displayValue}`);
});

// データベース関連の環境変数
console.log('\n===== データベース関連の環境変数 =====');
const dbVars = ['DATABASE_URL', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
dbVars.forEach(key => {
  const value = process.env[key];
  const displayValue = value 
    ? (key.includes('PASSWORD') ? '***（機密情報のため省略）' : value) 
    : 'Not set';
  console.log(`${key}: ${displayValue}`);
});

// ミドルウェア設定
console.log('\n===== 環境変数の有無チェック =====');
console.log('DATABASE_URL設定有無:', process.env.DATABASE_URL ? '設定あり' : '設定なし');
console.log('NEXT_PUBLIC_SUPABASE_URL設定有無:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定あり' : '設定なし');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY設定有無:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定あり' : '設定なし');