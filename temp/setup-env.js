// 環境変数設定スクリプト
// 実行方法: node temp/setup-env.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// 既存の.env.localファイルの内容を取得
let existingEnv = '';
try {
  existingEnv = fs.readFileSync(envFilePath, 'utf8');
  console.log('既存の.env.localファイルを読み込みました');
} catch (error) {
  console.log('既存の.env.localファイルが見つかりません。新規作成します');
}

// 環境変数テンプレート
const envTemplate = `# サーバー設定
NODE_ENV=development
PORT=3000

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# データベース設定
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@YOUR_SUPABASE_URL.supabase.co:5432/postgres

# AIサービス設定（オプション）
# CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY
# CLAUDE_API_MODEL=claude-3-7-sonnet-20240229

# モックデータ使用設定（true/false）
USE_MOCK_DATA=false
`;

// 設定する環境変数のリスト
const envVars = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', prompt: 'SupabaseのURL（例: https://xxxxxxxxxxxx.supabase.co）: ' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', prompt: 'Supabaseの匿名キー: ' },
  { key: 'DATABASE_URL', prompt: 'データベース接続URL（例: postgresql://postgres:password@xxxxxxxxxxxx.supabase.co:5432/postgres）: ' },
  { key: 'USE_MOCK_DATA', prompt: 'モックデータを使用しますか？(true/false、デフォルトはfalse): ', default: 'false' }
];

// 環境変数を順番に設定する
async function setupEnv() {
  // 既存の設定値を解析
  const existingValues = {};
  if (existingEnv) {
    existingEnv.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          existingValues[key.trim()] = value.trim();
        }
      }
    });
  }

  // 新しい環境変数の値を取得
  let newEnv = '';
  for (const envVar of envVars) {
    // 既存の値があれば表示
    const existingValue = existingValues[envVar.key] || '';
    const defaultValue = existingValue || envVar.default || '';
    
    // ユーザーに入力を促す
    const answer = await new Promise(resolve => {
      const promptText = defaultValue 
        ? `${envVar.prompt} (現在: ${defaultValue}): ` 
        : envVar.prompt;
      
      rl.question(promptText, answer => {
        resolve(answer.trim() || defaultValue);
      });
    });
    
    // 環境変数を設定
    newEnv += `${envVar.key}=${answer}\n`;
  }

  // .env.localファイルを作成/更新
  try {
    // エンプレートの内容をベースにして環境変数を追加
    let finalEnv = envTemplate;
    
    // 設定した値で置き換え
    newEnv.split('\n').forEach(line => {
      if (line.trim()) {
        const [key, value] = line.split('=');
        if (key && value) {
          // テンプレート内の該当行を置き換え
          const regex = new RegExp(`${key}=.*(\r?\n|$)`, 'g');
          finalEnv = finalEnv.replace(regex, `${key}=${value}$1`);
        }
      }
    });
    
    // ファイル書き込み
    fs.writeFileSync(envFilePath, finalEnv);
    console.log('\n.env.localファイルを更新しました');
    
    // 次のステップの案内
    console.log('\n次のステップ:');
    console.log('1. 開発サーバーを再起動：npm run dev');
    console.log('2. データベースの初期設定を実行：node temp/setup-db.js');
  } catch (error) {
    console.error('ファイル書き込みエラー:', error);
  }
  
  rl.close();
}

// 実行
setupEnv();