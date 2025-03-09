# Supabase認証エラー調査報告書

## 問題の概要

ログイン処理中に以下のようなエラーが発生しています：

```
POST https://qdjikxdmpctkfpvkqaof.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)

リクエスト URL: https://qdjikxdmpctkfpvkqaof.supabase.co/auth/v1/token?grant_type=password
リクエスト メソッド: POST
ステータス コード: 400 Bad Request
リモート アドレス: 104.18.38.10:443
参照ポリシー: strict-origin-when-cross-origin
```

このエラーにより、ユーザーのログイン処理が失敗しています。

## 環境調査

### 1. Supabase設定状況

- Supabase URL: `https://qdjikxdmpctkfpvkqaof.supabase.co` (環境変数に設定済み)
- Supabase Anon Key: 環境変数に設定済み（セキュリティ上の理由から省略）

### 2. モック設定状況

- 環境変数 `USE_MOCK_DATA=true` が設定されています

### 3. 関連ファイル調査

認証に関連する主なファイル：

- **src/lib/supabase.ts**: Supabaseクライアントとの基本的な通信を担当
- **src/lib/auth/auth-service.ts**: 認証ロジックを集約したサービスクラス
- **src/components/auth/login-form.tsx**: ログインフォームの実装

## エラー原因の分析

400 Bad Requestエラーの主な原因として以下が考えられます：

### 1. 環境変数の競合

- `USE_MOCK_DATA=true` が設定されていますが、モックデータ使用時の分岐処理が完全に実装されていない可能性があります
- 実際のSupabase接続とモックデータ処理の競合が発生している可能性があります

### 2. 認証情報の問題

- Supabaseプロジェクトの設定で、メール/パスワード認証が有効になっていない可能性があります
- URLは正しく設定されていますが、APIキーが誤っているか、有効期限が切れている可能性があります

### 3. 認証フローの問題

- リクエストの形式や内容が、Supabaseの期待するものと一致していない可能性があります
- 特にパスワード認証（`grant_type=password`）のリクエスト形式に問題がある可能性があります

### 4. ネットワーク/CORS設定の問題

- Supabaseプロジェクトのセキュリティ設定で、アプリケーションのドメインからのリクエストが許可されていない可能性があります

## 解決策

優先度順に以下の対応を推奨します：

### 1. モックモードの無効化（最優先）

開発環境であっても、認証機能のテストには実際のSupabase認証を使用することをお勧めします。

```
# .env.local ファイルを編集
USE_MOCK_DATA=false
```

### 2. ブラウザ開発者ツールでの詳細エラー確認

ブラウザの開発者ツールでリクエストの詳細を確認します：
- ネットワークタブでリクエストを選択し、「プレビュー」または「レスポンス」タブを確認
- より詳細なエラーメッセージがある場合は、それに基づいて対応（例：無効なメールアドレス、パスワードが短すぎる、など）

### 3. Supabaseプロジェクト設定の確認

Supabaseダッシュボードで以下を確認します：
- Authentication > Providers で「Email」が有効になっているか
- APIキーが有効で、正しいものが環境変数に設定されているか
- プロジェクトのURL制限設定で、開発環境のURLが許可されているか

### 4. コード修正（必要に応じて）

以下の点を確認・修正します：
- `supabase.ts`でのログイン処理でのエラーハンドリングの強化
- デバッグログの追加
- 環境変数による条件分岐の明確化

例：
```typescript
// src/lib/supabase.ts の修正例
export async function signIn(email: string, password: string) {
  console.log('【Supabase】ログイン処理開始:', { email });
  
  // モックモードのチェック
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    console.log('【Supabase】モックモードでログイン処理');
    // モックデータ処理...
    return mockSignIn(email, password);
  }
  
  try {
    // 実際のSupabase認証処理
    console.log('【Supabase】実際の認証処理を実行:', { 
      url: process.env.NEXT_PUBLIC_SUPABASE_URL 
    });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // 詳細なエラーログ
    if (error) {
      console.error('【Supabase】認証エラー詳細:', { 
        code: error.code,
        message: error.message,
        status: error.status
      });
    }
    
    // 以下は変更なし...
  }
}
```

## 結論

Supabase認証の400エラーは、モックモードの設定と実際の認証処理の競合が最も可能性の高い原因です。モックモードを無効化することで問題が解決する可能性が高いですが、それでも問題が続く場合は、より詳細なエラーメッセージを確認し、Supabaseプロジェクトの設定を見直す必要があります。