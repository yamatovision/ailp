// 認証とリダイレクトの簡略化した実装方法

// 1. middleware.ts - これを主要な認証チェックとして使用
/**
 * middleware.ts - サーバーサイドでの認証チェックとリダイレクト
 *
 * - すべてのリクエストはここを通過
 * - セッションを確認し、適切にリダイレクト
 * - クライアントサイドでのリダイレクトロジックは不要
 */

// 2. login-form.tsx - シンプルなフォーム処理
/**
 * login-form.tsx - ログイン処理の簡略化
 *
 * - ユーザー認証のみを処理
 * - リダイレクトはミドルウェアに任せる
 * - window.location.hrefなどの手動リダイレクト不要
 */

// 3. use-auth-redirect.ts - このフックは削除するか、最小限に
/**
 * use-auth-redirect.ts - 不要または最小限に
 *
 * - ミドルウェアですべてのリダイレクトを処理するため、このフックは基本的に不要
 * - 特殊な条件付きリダイレクトがある場合のみ使用
 */

// 実装手順:
// 1. まずuse-auth-redirect.tsの使用をすべて停止
// 2. login-form.tsxからリダイレクト処理を削除
// 3. middleware.tsを唯一の認証チェックポイントとして使用