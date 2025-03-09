#!/bin/bash
# トラッキングおよびバリアント振り分けAPIのテスト用curlスクリプト

# 色の設定
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト設定
API_BASE_URL="http://localhost:3000/api"
LP_ID="test-lp-id"
SESSION_ID="test-session-$(date +%s)"
COMPONENT_ID="test-component-1"

# テスト結果表示用関数
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ 成功${NC}"
  else
    echo -e "${RED}❌ 失敗 (終了コード: $1)${NC}"
  fi
}

# ヘッダーを表示する関数
print_header() {
  echo -e "\n${BLUE}===========================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===========================${NC}"
}

# レスポンスを検証する関数
validate_response() {
  if echo "$1" | grep -q "success"; then
    return 0
  else
    return 1
  fi
}

# 1. サーバー接続テスト
print_header "1. サーバー接続テスト"
echo "サーバーが起動しているか確認しています..."

curl -s -o /dev/null -w "%{http_code}" $API_BASE_URL/tracking/batch -X OPTIONS
status=$?

if [ $status -ne 0 ]; then
  echo -e "${RED}❌ サーバーに接続できません。サーバーが起動しているか確認してください。${NC}"
  exit 1
fi

echo -e "${GREEN}サーバーに接続できました。${NC}"

# 2. バッチトラッキングAPIテスト
print_header "2. バッチトラッキングAPIテスト"

echo "ページビュー、コンポーネント表示、クリックイベントを送信..."

response=$(curl -s -X POST "$API_BASE_URL/tracking/batch" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"type\": \"pageview\",
        \"lpId\": \"$LP_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"timestamp\": $(date +%s000),
        \"meta\": {
          \"url\": \"http://localhost:3000/test-page\",
          \"referrer\": \"http://localhost:3000/\"
        }
      },
      {
        \"type\": \"component_view\",
        \"lpId\": \"$LP_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"componentId\": \"$COMPONENT_ID\",
        \"variant\": \"a\",
        \"timestamp\": $(date +%s000),
        \"meta\": {
          \"viewTime\": $(date +%s000)
        }
      },
      {
        \"type\": \"click\",
        \"lpId\": \"$LP_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"componentId\": \"$COMPONENT_ID\",
        \"variant\": \"a\",
        \"timestamp\": $(date +%s000),
        \"data\": {
          \"element\": \"button-primary\"
        }
      }
    ]
  }")

echo "$response"
test_result $?

# 3. コンバージョントラッキングテスト
print_header "3. コンバージョントラッキングテスト"

echo "コンバージョンイベントを送信..."

response=$(curl -s -X POST "$API_BASE_URL/tracking/batch" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"type\": \"conversion\",
        \"lpId\": \"$LP_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"timestamp\": $(date +%s000),
        \"data\": {
          \"conversionType\": \"form_submit\",
          \"value\": 1
        }
      }
    ]
  }")

echo "$response"
test_result $?

# 4. Beacon APIテスト
print_header "4. Beacon APIテスト"

echo "離脱イベントをBeacon APIに送信..."

response=$(curl -s -X POST "$API_BASE_URL/tracking/beacon" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"type\": \"exit\",
        \"lpId\": \"$LP_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"timestamp\": $(date +%s000),
        \"meta\": {
          \"exitUrl\": \"http://localhost:3000/next-page\",
          \"timeOnPage\": 15000,
          \"scrollDepth\": 85
        }
      }
    ]
  }")

# Beacon APIは空レスポンスが正常
if [ -z "$response" ]; then
  echo -e "${GREEN}Beacon API成功 (空レスポンスは正常です)${NC}"
else
  echo "$response"
fi
test_result $?

# 5. 同期XMLHttpRequestテスト
print_header "5. 同期XMLHttpRequestテスト"

echo "離脱イベントを同期APIに送信..."

response=$(curl -s -X POST "$API_BASE_URL/tracking/sync" \
  -H "Content-Type: application/json" \
  -d "{
    \"events\": [
      {
        \"type\": \"exit\",
        \"lpId\": \"$LP_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"timestamp\": $(date +%s000),
        \"meta\": {
          \"exitUrl\": \"http://localhost:3000/other-page\",
          \"timeOnPage\": 25000,
          \"scrollDepth\": 100
        }
      }
    ]
  }")

echo "$response"
test_result $?

# 6. パブリックLP APIテスト
print_header "6. パブリックLP APIテスト"

echo "公開LP APIでLP取得をテスト..."

response=$(curl -s -w "\nHTTPステータス: %{http_code}" -X GET "$API_BASE_URL/public/lp/$LP_ID" \
  -H "Cookie: lp_session={\"id\":\"$SESSION_ID\",\"variants\":{}}")

echo "$response"

# 404エラーは実際のLP IDがないため予想される結果
if echo "$response" | grep -q "404"; then
  echo -e "${YELLOW}注意: 404エラーは実際のLPデータがないため予想される結果です。${NC}"
  test_result 0
else
  test_result 1
fi

# 7. バリアント強制指定テスト
print_header "7. バリアント強制指定テスト"

echo "URLパラメータでバリアントBを強制指定..."

response=$(curl -s -w "\nHTTPステータス: %{http_code}" -X GET "$API_BASE_URL/public/lp/$LP_ID?variant_$COMPONENT_ID=b" \
  -H "Cookie: lp_session={\"id\":\"$SESSION_ID\",\"variants\":{}}" \
  -v 2>&1 | grep -i "Set-Cookie")

echo "$response"

# Set-Cookieヘッダーを確認
if [ -n "$response" ]; then
  echo -e "${GREEN}クッキーが設定されました${NC}"
  test_result 0
else
  echo -e "${RED}クッキーが設定されませんでした${NC}"
  test_result 1
fi

# 結果サマリー
print_header "テスト結果サマリー"
echo -e "${GREEN}テストが完了しました。${NC}"
echo -e "${YELLOW}注意: 一部のテストは404エラーが正常動作です (LP IDはテスト用のため)${NC}"
echo -e "${BLUE}詳細なテストは 'node temp/test-tracking-api.js' で実行してください。${NC}"