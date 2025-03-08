# 開発環境セットアップガイド

このガイドでは、多変量テストLP作成システムの開発環境をセットアップする方法を説明します。

## 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上
- PostgreSQL（SupabaseのプロジェクトかローカルのPostgreSQLサーバー）

## 環境設定手順

### 1. プロジェクトのセットアップ

プロジェクトを適切なディレクトリにクローンまたはコピーします。**重要**: パス名に日本語や特殊文字（`#`等）を含まないようにしてください。

```bash
# 推奨: 英数字のみのパスにプロジェクトをコピー
cp -r "/元のパス/AILP#2" "/Users/username/Desktop/ailp-project"
cd "/Users/username/Desktop/ailp-project"
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルをプロジェクトのルートディレクトリに作成し、以下の環境変数を設定します。

```
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# データベース設定
DATABASE_URL=<your-postgresql-connection-string>
```

Supabaseプロジェクトを作成していない場合は、[Supabaseのサイト](https://supabase.com/)でアカウントを作成し、新しいプロジェクトを設定してください。

### 4. データベースのセットアップ

Prismaスキーマを使用してデータベースをセットアップします。

```bash
npx prisma generate
npx prisma db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

これにより、開発サーバーが起動し、通常は http://localhost:3000 でアプリケーションにアクセスできます。

## トラブルシューティング

### ビルドエラー

Next.jsのビルドでエラーが発生する場合：

1. パス名に非ASCII文字や特殊文字がないことを確認
2. 環境変数が正しく設定されていることを確認
3. 依存関係が正しくインストールされていることを確認：
   ```bash
   npm ci
   ```

### Supabase認証エラー

Supabaseの認証で問題が発生する場合：

1. 環境変数（`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`）が正しいことを確認
2. Supabaseプロジェクトの認証設定を確認（メールサインアップの有効化など）
3. SupabaseプロジェクトのリダイレクトURLを確認

## テスト用アカウント

開発中に認証機能をテストするための開発用アカウント：

- メールアドレス: test123@mailinator.com
- パスワード: password123

## 関連ドキュメント

- [要件定義](./requirements.md)
- [実装スコープ](./scope.md)
- [現在の実装状況](./CURRENT_STATUS.md)
- [API設計](./api.md)