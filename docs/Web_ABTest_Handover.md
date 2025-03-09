# Web完結型ABテスト機能 引継ぎ資料

## 概要

この資料は「Web完結型ABテストプラットフォーム」機能の実装状況と今後の開発指針についての引継ぎ資料です。このフェーズでは、5dayChallengeのリファレンス実装を参考に、単一のリンクでABテストを実行し、ユーザー行動を追跡・分析できるシステムを構築しています。

## 実装済み機能

### 1. 公開エンドポイント (フェーズ1: 完了)

- **公開LP表示API**
  - ファイル: `/src/app/api/public/lp/[id]/route.ts`
  - 機能: 認証不要でLPデータを取得し、セッションベースでバリアントを振り分ける
  - 仕様:
    - セッションIDの生成と管理
    - セッション単位のバリアント固定割り当て
    - URLパラメータによるバリアント強制指定
    - IP、デバイス、ブラウザ情報の収集

- **公開LP表示ページ**
  - ファイル: `/src/app/public/lp/[id]/page.tsx`
  - 機能: LPの公開表示ページとメタデータ生成
  - 仕様:
    - SSRによる初期表示の最適化
    - SEO対応メタデータ生成
    - エラーハンドリング

- **LP表示コンポーネント**
  - ファイル: `/src/components/public/PublicLPDisplay.tsx`
  - 機能: LPコンポーネントの表示とユーザーインタラクション追跡
  - 仕様:
    - コンポーネント単位でのレンダリング
    - イベント追跡機能の組み込み
    - Intersection Observerによる表示認識

### 2. トラッキングAPI (フェーズ1: 完了)

- **基本トラッキングエンドポイント**
  - ファイル: 
    - `/src/app/api/tracking/pageview/route.ts`
    - `/src/app/api/tracking/component/route.ts`
    - `/src/app/api/tracking/event/route.ts`
    - `/src/app/api/tracking/conversion/route.ts`
    - `/src/app/api/tracking/scroll/route.ts`
    - `/src/app/api/tracking/exit/route.ts`
  - 機能: 各種イベントの記録とデータベース保存
  - 仕様:
    - 各イベントの検証と正規化
    - リアルタイム集計機能の基盤
    - ビーコンAPIによる離脱イベント対応

- **トラッキングスクリプト**
  - ファイル: `/src/components/public/TrackingScript.tsx`
  - 機能: 外部アナリティクスツールとの連携とカスタムトラッキング
  - 仕様:
    - Google Analytics連携
    - Facebook Pixel連携
    - カスタムトラッキングロジック

### 3. データモデル (フェーズ1: 完了)

- **データベースモデル**
  - ファイル: `/prisma/schema.prisma`
  - 追加したモデル:
    - LP（公開LP情報）
    - LPComponent（セクション情報）
    - ComponentVariant（バリアント情報）
    - LPSession（セッション情報）
    - LPEvent（イベント情報）
    - ComponentEvent（コンポーネントイベント）
    - ComponentStats（統計情報）
    - LPStats（全体統計情報）

## 現在進行中の機能

### トラッキング強化 (フェーズ2: 進行中)

- **クライアント側トラッキングライブラリ**
  - 進捗: 10%
  - ファイル: 
    - `/src/lib/tracking/tracker.ts` (予定)
    - `/src/lib/tracking/session.ts` (予定)
    - `/src/lib/tracking/variant-manager.ts` (予定)
  - 機能: 
    - イベントキューによるバッチ処理
    - 自動トラッキング（スクロール深度、滞在時間など）
    - トラッキングデバッグ機能
    - トラッキングエラーリトライ機能

## 未着手の機能

### データ永続化とリアルタイム分析 (フェーズ3: 未着手)

- **リアルタイム集計機能**
  - 機能: 
    - コンポーネント表示、クリック率などのリアルタイム集計
    - コンバージョン率と改善率の自動計算
    - 統計的有意差検定と信頼度計算

- **分析ダッシュボード連携**
  - 機能:
    - テスト結果リアルタイム表示
    - バリアント比較ビュー
    - デバイス別分析
    - 自動インサイト生成

## 技術的な注意点

### データベース関連

1. **接続設定**
   - 本番環境でのSupabase接続が必要
   - 環境変数`DATABASE_URL`と`DIRECT_URL`が適切に設定されていることを確認
   - プリペアードステートメントの無効化(`PRISMA_CLIENT_NO_PREPARED_STATEMENTS=true`)

2. **スキーマ変更**
   - Prismaスキーマを更新した後は`npx prisma db push`を実行
   - 本番環境ではマイグレーションファイルの作成を推奨(`npx prisma migrate dev`)

### API関連

1. **トラッキングエンドポイント**
   - 大量のリクエストが予想されるため、レート制限の設定を推奨
   - 負荷対策としてキューイングシステムの検討が必要
   - 長いセッションでデータが大きくなる場合の対策が必要

2. **セッション管理**
   - Cookieベースのセッション管理が実装済み
   - Cookieが無効な場合のフォールバック（LocalStorage + URLパラメータ）を検討

### トラッキング関連

1. **プライバシー対応**
   - GDPRやCCPAなどのプライバシー規制対応が必要
   - OptOut機能の追加を検討
   - 収集するデータの最小化を意識

2. **負荷対策**
   - イベントバッチ処理の最適化
   - クライアント側でのデータ圧縮検討
   - サーバーレス関数での処理分散

## 実装方針の提案

1. **短期目標** (1-2週間)
   - クライアント側トラッキングライブラリの完成（フェーズ2）
   - イベントキューとバッチ処理の実装
   - 外部アナリティクス連携機能の強化

2. **中期目標** (2-4週間)
   - リアルタイム集計機能の実装（フェーズ3）
   - 統計分析機能の実装
   - ダッシュボード連携機能の実装

3. **長期目標** (1-2ヶ月)
   - 機械学習による自動最適化機能
   - 多変量テスト機能の拡張
   - パーソナライゼーション機能の追加

## テスト方法

1. **APIテスト**
   - `/temp/test-api-curl.sh`スクリプトを使用したエンドポイントテスト
   - 以下のコマンドでテスト実行:
     ```bash
     chmod +x temp/test-api-curl.sh && ./temp/test-api-curl.sh
     ```

2. **トラッキングテスト**
   - 開発サーバー起動: `npm run dev`
   - ブラウザでの動作確認: `http://localhost:3000/public/lp/[テスト用LP_ID]`
   - ブラウザコンソールでのイベントログ確認

## 参考資料

1. **リファレンス実装**
   - 5dayChallengeのABテスト実装: `/Users/tatsuya/Desktop/システム開発/AILP2/referrence/ailp-5days-challenge/src`
   - 主要参照ファイル:
     - `/src/components/ABTestProvider.tsx`
     - `/src/hooks/useABTest.ts`
     - `/src/lib/ab-test/tracker.ts`
     - `/src/lib/analytics/events.ts`

2. **実装計画ドキュメント**
   - `/Users/tatsuya/Desktop/システム開発/AILP2/docs/CURRENT_STATUS.md`
   - Web完結型ABテスト機能の詳細計画

## 連絡先

- 実装担当者: Claude Code
- メール: noreply@anthropic.com
- 引継ぎ日: 2025年3月9日