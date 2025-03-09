# デバッグ探偵 シャーロックホームズ - システムプロンプト

私はデバッグ探偵シャーロックホームズとして、あなたのプロジェクトのエラーを解析し、最適な解決策を提供します。

## 基本情報
- **役割**: プロジェクトのエラー検出と解決を行うシャーロックホームズ
- **目的**: ワトソンくん（ユーザー）のプロジェクトで発生したエラーを分析し、根本原因を特定し、最適な解決策を提案すること
- **スタイル**: 探偵のように分析的、論理的、そして確実な証拠に基づく推論

## 調査プロセス

### Phase 1: エラー情報の収集と分析
1. エラーメッセージの詳細分析
2. エラー発生時の状況確認 
3. エラーの種類と影響範囲の特定
4. 関連ファイルの自動検出と分析

### Phase 2: 根本原因の特定
1. エラーパターンの認識と分類
2. 関連するコードの詳細検証
3. 環境要因の確認
   - 環境変数の設定状況（CURRENT_STATUS.mdの環境変数セクションを確認）
   - 不足している環境変数や設定ミスが検出された場合は特に注意
   - ライブラリバージョンや依存関係の問題
4. 依存関係とコード間の矛盾点の検出

### Phase 3: 解決策の提案
1. 関連ファイルの修正提案
   - ファイル名
   - 修正前のコード
   - 修正後のコード
   - 修正の詳細な説明
2. 環境設定の変更提案
   - 環境変数関連のエラーの場合、CURRENT_STATUS.mdの環境変数セクションにマーク [!] を付ける
   - 環境変数アシスタントで設定が必要な変数を明確に指示
   - 実際の値設定方法の提案（環境変数アシスタントUIを使用するよう案内）
3. 再発防止のためのベストプラクティス提案
4. テスト方法の提案

### Phase 4: 実装と検証
1. 修正の適用方法（具体的なステップ）
2. 修正適用後の確認テスト方法
3. 関連する他の部分に対する影響確認

## 分析のルール

### 厳格な証拠主義
1. 推測ではなく、目の前の証拠（コード、エラーメッセージ）のみに基づいて分析
2. 証拠が不十分な場合は、必要な追加情報を明確に要求
3. 調査に必要なファイル内容がない場合、明示的にファイルを要求

### 段階的な分析
1. いきなり解決策を提示せず、まず根本原因を特定
2. 診断と解決のプロセスを明確に説明
3. 一度に一つの問題に焦点を当て、複数の問題が見つかった場合は優先順位をつける

### 明確なコミュニケーション
1. 技術的な専門用語を平易な言葉で説明
2. 修正の理由と意図を明確に伝える
3. 次のステップを具体的に指示する

## デバッグの重点分野

### バックエンドエラー
- サーバー起動エラー
- データベース接続エラー
- API通信エラー
- 環境変数問題
- バージョン不整合

### フロントエンドエラー
- ビルドエラー
- レンダリングエラー
- 型チェックエラー
- 依存関係エラー
- API接続エラー

### 環境設定エラー
- パッケージ依存関係
- 環境変数不足
- ファイルパスの問題
- 権限エラー

## エラーデータ収集のガイド

1. エラーメッセージの全文
2. エラーの発生状況（どのコマンドを実行したか、どのような操作をしたか）
3. 関連ファイルの内容
4. 環境情報（OS、Node.jsバージョン、使用フレームワークなど）

## 結論の提示方法

1. **分析結果の要約**
   ```
   【事件の要約】
   <エラーの本質とその原因についての簡潔な説明>
   ```

2. **原因の詳細説明**
   ```
   【原因分析】
   <エラーがなぜ起きたかの詳細な説明>
   ```

3. **解決策の提案**
   ```
   【解決策】
   <具体的な修正内容と手順>
   ```

4. **再発防止策**
   ```
   【今後の対策】
   <類似の問題を防ぐためのアドバイス>
   ```

## デバッグ探偵の黄金ルール

1. 一つの事件（エラー）につき、一つの解決策を提示する
2. 確証がない限り、推測に基づく解決策は提案しない
3. 必要な情報がない場合は、必ず追加情報を要求する
4. コード修正の提案は、既存のコーディングスタイルを尊重する
5. 解決策を適用する前に、その影響範囲を説明する
6. 常に最も単純で効果的な解決策を優先する
7. 修正後の検証方法を必ず提案する

ワトソンくん、さあ一緒に事件を解決しましょう。まずはエラーの詳細を教えてください

# エラー情報

```
API呼び出し: /api/lp {headers: {…}}headers: {Content-Type: 'application/json'}[[Prototype]]: Object
lp.ts:98 API returned non-JSON response: <!DOCTYPE html><html lang="ja"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1741424958724" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=1741424958724"/><script src="/_next/static/chunks/main-app.js?v=1741424958724" async=""></script><script src="/_next/static/chunks/app-pages-internals.js" async=""></script><script src="/_next/static/chunks/app/(auth)/login/page.js" async=""></script><script src="/_next/static/chunks/app/layout.js" async=""></script><title>ログイン - 多変量テストLP作成システム</title><meta name="description" content="アカウントにログインして、多変量テストLP作成システムを利用します。"/><script src="/_next/static/chunks/polyfills.js" noModule=""></script></head><body class="min-h-screen bg-background antialiased"><script>!function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('theme');if('system'===e||(!e&&false)){var t='(prefers-color-scheme: dark)',m=window.matchMedia(t);if(m.media!==t||m.matches){d.style.colorScheme = 'dark';c.add('dark')}else{d.style.colorScheme = 'light';c.add('light')}}else if(e){c.add(e|| '')}else{c.add('light')}if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'light'}catch(e){}}()</script><div class="flex min-h-screen bg-muted/40"><div class="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24"><div class="mx-auto w-full max-w-sm lg:w-96"><div class="flex flex-col items-center"><a class="flex items-center space-x-2" href="/"><span class="text-xl font-bold">多変量テストLP作成システム</span></a><h2 class="mt-6 text-3xl font-bold tracking-tight">アカウント管理</h2></div><div class="mt-8"><div class="space-y-6"><div><h1 class="text-2xl font-semibold tracking-tight">ログイン</h1><p class="text-sm text-muted-foreground">メールアドレスとパスワードを入力してログインしてください</p></div><form class="space-y-4"><div class="space-y-2"><label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for=":Rquujf6kq:-form-item">メールアドレス</label><input type="email" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="your@email.com" autoComplete="email" id=":Rquujf6kq:-form-item" aria-describedby=":Rquujf6kq:-form-item-description" aria-invalid="false" name="email" value=""/></div><div class="space-y-2"><label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for=":R1auujf6kq:-form-item">パスワード</label><input type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="••••••••" autoComplete="current-password" id=":R1auujf6kq:-form-item" aria-describedby=":R1auujf6kq:-form-item-description" aria-invalid="false" name="password" value=""/></div><div class="flex items-center space-x-2"><input type="checkbox" id="rememberMe" class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" name="rememberMe"/><label for="rememberMe" class="text-sm text-muted-foreground">ログイン状態を保持する</label></div><button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full" type="submit">ログイン</button></form><div class="flex flex-col space-y-4 text-sm text-muted-foreground"><a class="underline" href="/forgot-password">パスワードをお忘れですか？</a><div>アカウントをお持ちでない場合は<a class="ml-1 underline" href="/register">新規登録</a>してください。</div></div></div></div></div></div><div class="relative hidden w-0 flex-1 lg:block"><div class="absolute inset-0 h-full w-full bg-muted"><div class="flex h-full items-center justify-center"><div class="px-8 text-center"><h2 class="text-3xl font-bold text-foreground mb-4">AIで簡単にA/Bテスト</h2><p class="text-muted-foreground max-w-md mx-auto">技術レベルが高くなくても、AIがあなたに代わって最適なランディングページを作成。多変量テストで効果を最大化します。</p></div></div></div></div></div><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events:none"><ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420p
window.console.error @ app-index.js:35
console.error @ hydration-error-info.js:41
fetchAPI @ lp.ts:98
await in fetchAPI
createLP @ lp.ts:141
handleCreateNew @ page.tsx:100
callCallback @ react-dom.development.js:17629
invokeGuardedCallbackImpl @ react-dom.development.js:17667
invokeGuardedCallback @ react-dom.development.js:17729
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:17741
executeDispatch @ react-dom.development.js:27186
processDispatchQueueItemsInOrder @ react-dom.development.js:27206
processDispatchQueue @ react-dom.development.js:27215
dispatchEventsForPlugins @ react-dom.development.js:27223
eval @ react-dom.development.js:27378
batchedUpdates$1 @ react-dom.development.js:21180
batchedUpdates @ react-dom.development.js:24349
dispatchEventForPluginEventSystem @ react-dom.development.js:27377
dispatchEvent @ react-dom.development.js:25416
dispatchDiscreteEvent @ react-dom.development.js:25392このエラーを分析AI
lp.ts:102 API fetch error: Error: APIがJSON以外のレスポンスを返しました
    at fetchAPI (lp.ts:99:13)
    at async createLP (lp.ts:141:20)
    at async handleCreateNew (page.tsx:100:21)
window.console.error @ app-index.js:35
console.error @ hydration-error-info.js:41
fetchAPI @ lp.ts:102
await in fetchAPI
createLP @ lp.ts:141
handleCreateNew @ page.tsx:100
callCallback @ react-dom.development.js:17629
invokeGuardedCallbackImpl @ react-dom.development.js:17667
invokeGuardedCallback @ react-dom.development.js:17729
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:17741
executeDispatch @ react-dom.development.js:27186
processDispatchQueueItemsInOrder @ react-dom.development.js:27206
processDispatchQueue @ react-dom.development.js:27215
dispatchEventsForPlugins @ react-dom.development.js:27223
eval @ react-dom.development.js:27378
batchedUpdates$1 @ react-dom.development.js:21180
batchedUpdates @ react-dom.development.js:24349
dispatchEventForPluginEventSystem @ react-dom.development.js:27377
dispatchEvent @ react-dom.development.js:25416
dispatchDiscreteEvent @ react-dom.development.js:25392このエラーを分析AI
lp.ts:151 Error creating LP: Error: APIがJSON以外のレスポンスを返しました
    at fetchAPI (lp.ts:99:13)
    at async createLP (lp.ts:141:20)
    at async handleCreateNew (page.tsx:100:21)
window.console.error @ app-index.js:35
console.error @ hydration-error-info.js:41
createLP @ lp.ts:151
await in createLP
handleCreateNew @ page.tsx:100
callCallback @ react-dom.development.js:17629
invokeGuardedCallbackImpl @ react-dom.development.js:17667
invokeGuardedCallback @ react-dom.development.js:17729
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:17741
executeDispatch @ react-dom.development.js:27186
processDispatchQueueItemsInOrder @ react-dom.development.js:27206
processDispatchQueue @ react-dom.development.js:27215
dispatchEventsForPlugins @ react-dom.development.js:27223
eval @ react-dom.development.js:27378
batchedUpdates$1 @ react-dom.development.js:21180
batchedUpdates @ react-dom.development.js:24349
dispatchEventForPluginEventSystem @ react-dom.development.js:27377
dispatchEvent @ react-dom.development.js:25416
dispatchDiscreteEvent @ react-dom.development.js:25392このエラーを分析AI
page.tsx:115 LP作成エラー: Error: LPの作成に失敗しました
    at createLP (lp.ts:152:11)
    at async handleCreateNew (page.tsx:100:21)
```

# 関連ファイル

