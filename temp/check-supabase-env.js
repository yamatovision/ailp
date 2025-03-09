// Supabase関連の環境変数チェック
require('dotenv').config({ path: '.env.local' });

// Supabase接続情報チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// データベース接続情報チェック
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
const preparedStatements = process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS;

// Claude API情報チェック
const claudeKey = process.env.CLAUDE_API_KEY;
const claudeModel = process.env.CLAUDE_API_MODEL;

console.log('=== Supabase環境変数チェック ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定あり' : '未設定');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定あり' : '未設定');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定あり' : '未設定');

console.log('\n=== データベース接続情報 ===');
console.log('DATABASE_URL (プーラー):', databaseUrl ? '設定あり' : '未設定');
console.log('DIRECT_URL (直接接続):', directUrl ? '設定あり' : '未設定');
console.log('プリペアードステートメント無効化:', preparedStatements === 'true' ? '無効化済み' : '有効（未設定）');

console.log('\n=== Claude API情報 ===');
console.log('CLAUDE_API_KEY:', claudeKey ? '設定あり' : '未設定');
console.log('CLAUDE_API_MODEL:', claudeModel || 'デフォルト値を使用');

console.log('\n=== 接続URL構文チェック ===');

// 実際のURL構造を詳細にチェック
console.log('\nDATABASE_URL (実際の値):', databaseUrl);
console.log('DIRECT_URL (実際の値):', directUrl);

// CLAUDE.mdのガイドラインと照合
const expectedPoolerPattern = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto@123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const expectedDirectPattern = 'postgresql://postgres:Mikoto@123@db.qdjikxdmpctkfpvkqaof.supabase.co:5432/postgres';

console.log('\n=== CLAUDE.mdのガイドラインとの照合 ===');
console.log('期待されるプーラー接続文字列:', expectedPoolerPattern);
console.log('実際のプーラー接続文字列:', databaseUrl);
console.log('一致しているか:', databaseUrl === expectedPoolerPattern ? 'はい' : 'いいえ');

console.log('\n期待される直接接続文字列:', expectedDirectPattern);
console.log('実際の直接接続文字列:', directUrl);
console.log('一致しているか:', directUrl === expectedDirectPattern ? 'はい' : 'いいえ');

// "@" 文字がパスワードに含まれるためのエスケープ問題を詳細チェック
console.log('\n=== エスケープ問題の詳細チェック ===');
console.log('DATABASE_URLにおけるMikoto@123:', databaseUrl.includes('Mikoto@123') ? '未エスケープ(正しい)' : 'エスケープされているか存在しない');
console.log('DIRECT_URLにおけるMikoto@123:', directUrl.includes('Mikoto@123') ? '未エスケープ(正しい)' : 'エスケープされているか存在しない');

console.log('\n=== 環境変数チェック完了 ===');
