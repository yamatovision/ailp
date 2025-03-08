  # スコープマネージャー システムプロンプト

  あなたはプロジェクト実装のスコープ管理専門家です。要件定義書とモックアップを
  もとに、効率的な実装単位（スコープ）を設計する役割を担います。

  ## 目的
  全体要件定義とページ単位の要件から適切な実装単位を策定し、各スコープのファイ
  ル構成と依存関係を明確にして、ClaudeCodeが効率的に実装できるようにします。

  ## プロセス

  ### Phase 1: プロジェクト全体の把握
  - まず全体要件定義書を読み込み、プロジェクト全体像を理解します
  - ページごとの要件定義書を分析し、各機能の関連性を把握します
  - フロントエンドとバックエンドの構成要素を整理します

  ### Phase 2: ディレクトリ構造設計
  - プロジェクト全体のディレクトリ構造を設計します
    - フロントエンド構造（ページ、コンポーネント、サービスなど）
    - バックエンド構造（ルート、コントローラー、モデルなど）
    - 共通モジュール構成
  - 命名規則とファイル配置のルールを策定します

  ### Phase 3: スコープ分割
  - **スコープ1: 初期セットアップ/環境構築**を最優先で定義します
    - プロジェクト基盤
    - 共通コンポーネント
    - 環境変数設定
    - データベース接続
    - 認証基盤
  -
  **ページごとのスコープ**を定義します（フロントからバックエンドまで横断的に）
    - 例: ログインページスコープ、商品管理ページスコープなど
  - 各スコープの優先順位、複雑度、依存関係を明確にします

  ### Phase 4: スコープ詳細設計
  各スコープについて以下の情報を明確にします：
  - スコープID
  - スコープ名
  - 目的と概要
  - 含まれる機能
  - 優先度
  - 複雑度
  - 関連するファイル一覧（実装対象ファイル）
  - 依存関係
  - 想定作業時間

  ### Phase 5: CLAUDE.md出力準備
  スコープ情報をCLAUDE.md形式で出力します：
  ```markdown
  ## Project Scope

  ### General Information
  - **Name**: スコープ名
  - **ID**: スコープID
  - **Description**: 説明
  - **Project Path**: プロジェクトパス

  ### Requirements
  1. 要件1
  2. 要件2
  ...

  ### Implementation Items
  1. **実装項目1** (ID: 項目ID)
  2. **実装項目2** (ID: 項目ID)
  ...

  ### Related Files
  - path/to/file1.js
  - path/to/file2.js
  ...

  スコープ設計原則

  1. 適切なサイズ感：各スコープは20万トークン以内で実装可能な単位とする
  2. 独立性：可能な限り他のスコープへの依存を減らす
  3. 一貫性：関連する機能は同一スコープに含める
  4. 優先順位：基盤となる機能から順に実装できるよう順序付けする
  5. 完結性：各スコープはテスト可能な単位として完結している
  6.
  横断的アプローチ：ページ単位でフロントエンドからバックエンドまで一貫して実装

  出力形式

  スコープ計画は以下の形式で出力します：

  1. ディレクトリ構造概要
    - プロジェクト全体のファイル構成
    - 命名規則と配置ルール
  2. スコープ一覧
    - スコープ1: 初期セットアップ（最優先）
    - スコープ2〜n: ページ単位のスコープ（優先順位付き）
  3. 各スコープの詳細情報
    - 実装するファイル一覧
    - 依存関係
    - 作業順序の提案
  4. CLAUDE.md出力用フォーマット
    - 各スコープのCLAUDE.md記述方法

  質問ガイド

  ユーザーから十分な情報が得られない場合、以下を確認します：
  - プロジェクトの技術スタック（フレームワーク、ライブラリなど）
  - 優先して実装すべきページ/機能
  - 認証やデータベースの詳細
  - 共通コンポーネントの想定
  - 環境変数や外部APIの連携


# エラー情報

```
シスタント: プロジェクトパスを設定しました: /Users/tatsuya/Desktop/システム開発/AILP2
[2025-03-07T10:59:17.073Z] [INFO] 環境変数ファイルを検出しました: 1個
[2025-03-07T10:59:17.075Z] [INFO] 環境変数ファイルを読み込みました: /Users/tatsuya/Desktop/システム開発/AILP2/.env.local
[2025-03-07T10:59:17.075Z] [INFO] 環境変数ファイルを読み込みました: /Users/tatsuya/Desktop/システム開発/AILP2/.env.local
[2025-03-07T10:59:17.187Z] [INFO] 環境変数ファイルを検出しました: 1個
[2025-03-07T10:59:17.188Z] [INFO] 環境変数ファイルを読み込みました: /Users/tatsuya/Desktop/システム開発/AILP2/.env.local
[2025-03-07T10:59:20.198Z] [DEBUG] DOM構造をキャプチャしました
[2025-03-07T10:59:23.201Z] [DEBUG] DOM構造をキャプチャしました
[2025-03-07T10:59:23.432Z] [ERROR] 環境変数アシスタントプロンプトの準備に失敗しました
[2025-03-07T10:59:23.432Z] [ERROR] Error details: projectPathenvFilePath.env is not a function
[2025-03-07T10:59:23.433Z] [ERROR] Stack trace: TypeError: projectPathenvFilePath.env is not a function
	at EnvironmentVariablesAssistantPanel._generateEnvAssistantPrompt (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:30428:10)
	at EnvironmentVariablesAssistantPanel._prepareEnvAssistantPrompt (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:30351:34)
	at EnvironmentVariablesAssistantPanel._handleLaunchClaudeCodeAssistant (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:30028:47)
	at Ah.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29473:36)
	at D.B (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2373)
	at D.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2591)
	at aH.$onMessage (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:135:91646)
	at Uy.S (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:114979)
	at Uy.Q (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:114759)
	at Uy.M (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:113848)
	at Uy.L (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:113086)
	at Ah.value (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:111750)
	at D.B (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2373)
	at D.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2591)
	at Xn.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:9458)
	at Ah.value (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:190:13296)
	at D.B (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2373)
	at D.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2591)
	at Xn.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:9458)
	at MessagePortMain.<anonymous> (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:190:11588)
	at MessagePortMain.emit (node:events:518:28)
	at MessagePortMain._internalPort.emit (node:electron/js2c/utility_init:2:2949)
	at Object.callbackTrampoline (node:internal/async_hooks:130:17)
[2025-03-07T10:59:23.434Z] [ERROR] ClaudeCodeアシスタント起動エラー:
[2025-03-07T10:59:23.434Z] [ERROR] Error details: projectPathenvFilePath.env is not a function
[2025-03-07T10:59:23.434Z] [ERROR] Stack trace: TypeError: projectPathenvFilePath.env is not a function
	at EnvironmentVariablesAssistantPanel._generateEnvAssistantPrompt (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:30428:10)
	at EnvironmentVariablesAssistantPanel._prepareEnvAssistantPrompt (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:30351:34)
	at EnvironmentVariablesAssistantPanel._handleLaunchClaudeCodeAssistant (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:30028:47)
	at Ah.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29473:36)
	at D.B (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2373)
	at D.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2591)
	at aH.$onMessage (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:135:91646)
	at Uy.S (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:114979)
	at Uy.Q (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:114759)
	at Uy.M (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:113848)
	at Uy.L (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:113086)
	at Ah.value (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:111750)
	at D.B (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2373)
	at D.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2591)
	at Xn.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:9458)
	at Ah.value (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:190:13296)
	at D.B (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2373)
	at D.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:27:2591)
	at Xn.fire (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:9458)
	at MessagePortMain.<anonymous> (file:///Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:190:11588)
	at MessagePortMain.emit (node:events:518:28)
	at MessagePortMain._internalPort.emit (node:electron/js2c/utility_init:2:2949)
	at Object.callbackTrampoline (node:internal/async_hooks:130:17)
[2025-03-07T10:59:26.206Z] [DEBUG] DOM構造をキャプチャしました
[2025-03-07T10:59:29.212Z] [DEBUG] DOM構造をキャプチャしました
[2025-03-07T10:59:32.216Z] [DEBUG] DOM構造をキャプチャしました
[2025-03-07T10:59:35.226Z] [DEBUG] DOM構造をキャプチャしました
[2025-03-07T10:59:38.233Z] [DEBUG] DOM構造をキャプチャしました
```

# 関連ファイル

## /Users/tatsuya/Desktop/システム開発/AILP2/.env.local

```
# サーバー設定
PORT=3000
NODE_ENV=development

# Supabase設定 - 開発用ダミー値（本番環境では実際の値に置き換えてください）
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5MTYwMCwiZXhwIjoxOTU2NTY3NjAwfQ.exampleKey
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQwOTkxNjAwLCJleHAiOjE5NTY1Njc2MDB9.exampleServiceKey

# AI API設定
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# データベース接続文字列
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"

# 認証設定
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

