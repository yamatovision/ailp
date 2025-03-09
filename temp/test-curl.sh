#!/bin/bash

# ログインAPIをテストするためのcurlスクリプト
echo "===== ログインAPIのcurlテスト開始 ====="

# 変数設定
BASE_URL="http://localhost:3000"
EMAIL="test123@mailinator.com"
PASSWORD="password123"

# ログインリクエスト
echo -e "\n1. ログインAPIリクエスト送信中..."
RESPONSE=$(curl -s -D headers.txt -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  $BASE_URL/api/auth/login)

# レスポンスヘッダーの表示
echo -e "\nレスポンスヘッダー:"
cat headers.txt

# レスポンスボディの表示
echo -e "\nレスポンスボディ:"
echo $RESPONSE

# クッキーを抽出
COOKIES=$(grep -i "set-cookie" headers.txt)

if [ -n "$COOKIES" ]; then
  echo -e "\nクッキーが見つかりました。"
  # クッキーを保存
  grep -i "set-cookie" headers.txt > cookies.txt
  
  # クッキーを使用してダッシュボードにアクセス
  echo -e "\n2. ダッシュボードアクセステスト中..."
  curl -s -D dashboard_headers.txt -b cookies.txt -c cookies.txt \
    -H "Content-Type: application/json" \
    $BASE_URL/dashboard
  
  echo -e "\nダッシュボードレスポンスヘッダー:"
  cat dashboard_headers.txt
  
  # リダイレクトをチェック
  REDIRECT=$(grep -i "location" dashboard_headers.txt)
  if [ -n "$REDIRECT" ]; then
    echo -e "\nリダイレクトが検出されました:"
    echo $REDIRECT
  else
    echo -e "\nリダイレクトなし - ダッシュボードにアクセス可能"
  fi
else
  echo -e "\n警告: セッションクッキーが見つかりません"
fi

# クリーンアップ
rm -f headers.txt dashboard_headers.txt cookies.txt

echo -e "\n===== ログインAPIのcurlテスト終了 ====="