// API route.tsファイル修正スクリプト
const fs = require('fs');
const path = require('path');

// ファイルパス
const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'lp', 'route.ts');

// ファイル内容を読み取り
const content = fs.readFileSync(filePath, 'utf8');

// isDev変数が未定義のエラーを修正
// エラーメッセージを返す部分でもisDev変数を再定義
const fixedContent = content.replace(
  /console\.error\('LP一覧取得エラー:', error\);/g,
  'console.error(\'LP一覧取得エラー:\', error);\n    const isDev = process.env.NODE_ENV === \'development\';'
);

// ファイルに書き込み
fs.writeFileSync(filePath, fixedContent);
console.log('route.tsファイルを修正しました - isDev変数を再定義');
