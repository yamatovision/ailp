# トラッキング強化機能（フェーズ2）引継ぎ資料

## 概要

この資料はWeb完結型ABテスト機能のトラッキング強化フェーズ（フェーズ2）の実装状況と今後の開発指針についての引継ぎ資料です。このフェーズでは、クライアント側のトラッキングライブラリやセッション管理、バリアント振り分けロジック、サーバー側のトラッキングAPIなどを実装しました。

## 実装済み機能

### 1. セッション管理（`src/lib/tracking/session.ts`）

- セッション情報の管理（Cookie, LocalStorage）
- デバイス・ブラウザ情報の検出
- UTMパラメータの取得
- セッションの永続化と復元

### 2. バリアント管理（`src/lib/tracking/variant-manager.ts`）

- コンポーネント単位のバリアント割り当て
- URLパラメータによるバリアント強制指定
- バリアント情報の永続化
- 共有用URLの生成

### 3. トラッキングライブラリ（`src/lib/tracking/tracker.ts`）

- ページビュー、コンポーネント表示、クリック、フォーム送信、コンバージョン、離脱などのイベントトラッキング
- イベントキューとバッチ処理
- Beacon APIによる離脱前データ送信
- 自動スクロールトラッキング
- Intersection Observerによるコンポーネント表示トラッキング

### 4. トラッキングAPI

- バッチトラッキングAPI（`src/app/api/tracking/batch/route.ts`）
- Beacon API（`src/app/api/tracking/beacon/route.ts`）
- 同期XMLHttpRequest API（`src/app/api/tracking/sync/route.ts`）

### 5. テストツール

- トラッキングAPIテスト（`temp/test-tracking-api.js`）
- バリアント振り分けロジックテスト（`temp/test-variant-logic.js`）
- curlを使用したAPIテスト（`temp/test-api-curl.sh`）

## アーキテクチャ

### データフロー

1. **クライアントサイド**:
   - セッション管理：Cookie/LocalStorageベース
   - イベントの収集：各種ユーザーアクションを検出
   - イベントキュー：メモリ内にイベントを一時保存
   - バッチ処理：一定数のイベントが貯まったら送信

2. **サーバーサイド**:
   - バッチ処理：複数のイベントをまとめて効率的に処理
   - デバイス情報の永続化：セッション情報を記録
   - イベントの永続化：各種イベントをデータベースに保存
   - 統計情報の更新：カウント更新やステータス変更

### 主要なコンポーネント

1. **セッション管理システム**
   - セッション作成/取得
   - デバイス情報検出
   - バリアント割り当て

2. **トラッキングライブラリ**
   - イベント定義と検知
   - イベントキューと最適化
   - 離脱時データ送信

3. **バリアント管理システム**
   - バリアント割り当てロジック
   - URLパラメータによる強制指定
   - バリアント情報永続化

4. **バックエンドAPI**
   - バッチ処理API
   - 軽量イベント処理
   - データベース永続化

## 技術的詳細

### セッション管理

```typescript
// SessionInfo型
interface SessionInfo {
  id: string;           // セッションID
  startedAt: number;    // 開始時間（タイムスタンプ）
  variants: Record<string, 'a' | 'b'>; // コンポーネントID => バリアント
  source?: string;      // 参照元
  campaign?: string;    // キャンペーン
  device: {             // デバイス情報
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
  };
}
```

- セッションの永続化は`Cookie`と`LocalStorage`の両方を使用（冗長性確保）
- 有効期間は30日（デフォルト）

### バリアント振り分けロジック

1. **優先順位**:
   - URLパラメータによる強制指定（`variant_[componentId]=a|b`）
   - グローバルバリアント指定（`variant=a|b`）
   - 既存セッションのバリアント情報
   - ランダム割り当て（50:50）

2. **振り分けのコード例**:
   ```typescript
   // 優先順位に基づいてバリアントを決定
   export function getComponentVariant(componentId: string): 'a' | 'b' {
     // URLパラメータによる強制指定を確認
     const forcedVariant = getVariantFromURL(componentId);
     if (forcedVariant) {
       return forcedVariant;
     }
     
     // セッションの既存割り当てを確認
     const session = getOrCreateSession();
     if (session.variants[componentId]) {
       return session.variants[componentId];
     }
     
     // ランダム割り当て（新規）
     const newVariant = Math.random() < 0.5 ? 'a' : 'b';
     updateSessionVariant(componentId, newVariant, session);
     return newVariant;
   }
   ```

### トラッキングシステム

1. **イベントタイプ**:
   - `PAGEVIEW`: ページ表示
   - `COMPONENT_VIEW`: コンポーネント表示
   - `COMPONENT_HIDE`: コンポーネント非表示
   - `CLICK`: クリック
   - `SCROLL`: スクロール位置
   - `FORM_SUBMIT`: フォーム送信
   - `CONVERSION`: コンバージョン
   - `CUSTOM`: カスタムイベント
   - `EXIT`: ページ離脱

2. **イベントキュー処理**:
   - メモリ内にイベントをキュー
   - バッチサイズに達したら送信（デフォルト10件）
   - 定期的なバッチ処理（デフォルト5秒）
   - 優先度の高いイベント（コンバージョンなど）は即時送信

3. **離脱前データ送信**:
   - Beacon API優先（ブラウザ互換性あり）
   - フォールバックとして同期XMLHttpRequest

## データモデル

トラッキングシステムは以下のデータモデルに基づいています：

1. **LPSession**: セッション情報
   - セッションID、LP ID、開始時間、最終活動時間など
   - デバイス情報、参照元
   - コンバージョン情報

2. **LPEvent**: イベント情報
   - イベントタイプ、セッションID、LP ID、タイムスタンプ
   - イベント固有データ（メタデータ）

3. **ComponentEvent**: コンポーネント関連イベント
   - コンポーネントID、バリアント、イベントタイプ
   - セッションID、LP ID、タイムスタンプ

4. **ComponentStats**: コンポーネント統計情報
   - コンポーネントID、バリアント
   - 表示数、クリック数、コンバージョン数
   - コンバージョン率、統計的有意差など

5. **LPStats**: LP全体の統計情報
   - 訪問者数、ユニーク訪問者数
   - コンバージョン数、コンバージョン率
   - A/B改善率

## テスト方法

### 1. APIテスト

トラッキングAPIをテストするには以下のコマンドを実行：

```bash
node temp/test-tracking-api.js
```

このスクリプトは以下をテストします：
- バッチトラッキングAPI
- Beacon API
- 同期XMLHttpRequest API
- コンバージョントラッキング
- カスタムイベント
- 公開LP API

### 2. バリアント振り分けロジックテスト

バリアント振り分けロジックをテストするには以下のコマンドを実行：

```bash
node temp/test-variant-logic.js
```

このスクリプトは以下をテストします：
- バリアント割り当ての一貫性
- URLパラメータによるバリアント強制指定
- グローバルバリアント指定
- バリアント分布のランダム性

### 3. curlによるAPIテスト

短時間でAPIを検証するには以下のコマンドを実行：

```bash
./temp/test-api-curl.sh
```

## 今後の実装方針（フェーズ3: データ永続化）

### 1. 実装すべき機能

1. **トラッキングAPIクライアント関数**
   - クライアント側でのAPI呼び出し関数
   - エラーハンドリングとリトライロジック

2. **コンポーネントトラッキングフック**
   - Reactコンポーネント用のトラッキングフック
   - 自動的にコンポーネント表示・クリック・コンバージョンを記録

3. **リアルタイム集計機能**
   - バリアント間のパフォーマンス比較
   - 統計的有意差の計算
   - リアルタイムダッシュボード連携

4. **統計分析機能**
   - コンバージョン率と改善率の計算
   - 信頼区間の計算
   - 勝者バリアントの自動判定

### 2. 優先実装順序

1. **トラッキングAPIクライアント関数**
2. **コンポーネントトラッキングフック**
3. **統計情報API**
4. **リアルタイム統計コンポーネント**
5. **バリアント比較コンポーネント**
6. **データエクスポート機能**

### 3. 実装ファイル

- `src/lib/api/tracking.ts`（トラッキングAPIクライアント関数）
- `src/hooks/use-component-tracking.ts`（コンポーネントトラッキングフック）
- `src/hooks/use-tracking-analysis.ts`（トラッキング分析フック）
- `src/lib/analysis/real-time-analysis.ts`（リアルタイム分析ツール）
- `src/app/api/tracking/stats/route.ts`（統計情報API）
- `src/app/api/tracking/export/route.ts`（データエクスポートAPI）
- `src/components/test-results/RealTimeStats.tsx`（リアルタイム統計コンポーネント）
- `src/components/test-results/VariantComparison.tsx`（バリアント比較コンポーネント）
- `src/components/public/TrackingHoc.tsx`（トラッキングHOCコンポーネント）

## まとめ

トラッキング強化フェーズ（フェーズ2）では、クライアント側のトラッキングライブラリ、セッション管理、バリアント振り分けロジック、およびサーバー側のトラッキングAPIを実装しました。このフェーズでの実装により、Web完結型ABテスト機能の基盤が構築されました。

次のフェーズ（データ永続化）では、トラッキングデータの集計と分析機能を実装し、リアルタイムダッシュボードとの連携を強化します。また、コンポーネントレベルでの統計情報計算とバリアント比較機能も実装する予定です。

## 参考情報

- API仕様書: `/docs/api.md`
- データモデル: `/prisma/schema.prisma`
- エンドポイント: `/api/tracking/*`
- テストスクリプト: `/temp/test-tracking-api.js`