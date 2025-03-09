// データベース接続修正スクリプト
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// .env.localファイルのパス
const envFilePath = path.join(__dirname, '..', '.env.local');

// 既存の.env.localファイルの内容を取得
let existingEnv = '';
try {
  existingEnv = fs.readFileSync(envFilePath, 'utf8');
  console.log('既存の.env.localファイルを読み込みました');
} catch (error) {
  console.log('既存の.env.localファイルが見つかりません。新規作成します');
  existingEnv = '';
}

// 修正された接続文字列（@をURLエンコード）
const correctDbUrl = 'postgresql://postgres.qdjikxdmpctkfpvkqaof:Mikoto%40123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

// DATABASE_URL設定を更新
let updatedEnv = existingEnv;
if (updatedEnv.includes('DATABASE_URL=')) {
  // 既存の設定を更新
  updatedEnv = updatedEnv.replace(/DATABASE_URL=.*(\r?\n|$)/g, `DATABASE_URL=${correctDbUrl}$1`);
} else {
  // 新規に設定を追加
  updatedEnv += `\n# データベース接続設定\nDATABASE_URL=${correctDbUrl}\n`;
}

// USE_MOCK_DATA設定をfalseに変更
if (updatedEnv.includes('USE_MOCK_DATA=')) {
  updatedEnv = updatedEnv.replace(/USE_MOCK_DATA=.*(\r?\n|$)/g, 'USE_MOCK_DATA=false$1');
} else {
  updatedEnv += '\n# モックデータ使用設定\nUSE_MOCK_DATA=false\n';
}

// ファイルに書き込み
fs.writeFileSync(envFilePath, updatedEnv);
console.log('.env.localファイルを更新しました');
console.log('DATABASE_URL接続文字列を修正しました');
console.log('USE_MOCK_DATA=false を設定しました');

// Prismaの更新とキャッシュクリア
try {
  console.log('\nPrismaのキャッシュをクリアしています...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prismaクライアントを再生成しました');
  
  // 任意: Prismaバージョン更新
  console.log('\nPrismaをアップデートしますか？(y/N)');
  process.stdout.write('> ');
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y' || answer === 'yes') {
      try {
        console.log('\nPrismaを最新バージョンに更新しています...');
        execSync('npm i --save-dev prisma@latest', { stdio: 'inherit' });
        execSync('npm i @prisma/client@latest', { stdio: 'inherit' });
        console.log('Prismaを更新しました');
        
        console.log('\nPrismaクライアントを再生成しています...');
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('Prismaクライアントを再生成しました');
      } catch (err) {
        console.error('Prisma更新エラー:', err.message);
      }
    } else {
      console.log('Prismaの更新をスキップします');
    }
    
    console.log('\n✅ セットアップ完了!');
    console.log('次のコマンドを実行して開発サーバーを再起動してください:');
    console.log('npm run dev');
    
    // テストスクリプトの実行を提案
    console.log('\nデータベース接続をテストするには次のコマンドを実行してください:');
    console.log('node temp/test-db-connection.js');
  });
} catch (err) {
  console.error('Prismaキャッシュクリアエラー:', err.message);
}