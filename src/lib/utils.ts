import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * マージされたtailwindクラスを生成するユーティリティ関数
 * clsxでクラスを結合し、tailwind-mergeで競合を解決
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付をフォーマットする関数
 * @param date 日付オブジェクトまたは日付文字列
 * @param format フォーマット (例: 'yyyy/MM/dd')
 */
export function formatDate(date: Date | string, format = 'yyyy/MM/dd') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 値をパーセンテージに変換する関数
 * @param value 変換する値
 * @param decimals 小数点以下の桁数
 */
export function toPercentage(value: number, decimals = 2) {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * テキストを省略する関数
 * @param text 元のテキスト
 * @param maxLength 最大長さ
 */
export function truncateText(text: string, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * ステータスに応じたクラス名を返す関数
 * @param status ステータス (draft, active, testing, ended)
 */
export function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-gray-200 text-gray-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'testing':
      return 'bg-blue-100 text-blue-800';
    case 'ended':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * ステータスの日本語表示を返す関数
 * @param status ステータス (draft, active, testing, ended)
 */
export function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'draft':
      return '下書き';
    case 'active':
      return '公開中';
    case 'testing':
      return 'テスト中';
    case 'ended':
      return '終了';
    default:
      return status;
  }
}

/**
 * API用の共通認証関数
 * Cookie認証とBearer token認証の両方に対応
 * 
 * @param req Request オブジェクト
 * @param cookies cookies 関数 (Next.jsのheadersからインポート)
 * @param supabase supabaseクライアント
 * @param createRouteHandlerClient createRouteHandlerClient関数 (@supabase/auth-helpers-nextjsからインポート)
 */
export async function getUserSession(
  req: Request, 
  cookies: any, 
  supabase: any, 
  createRouteHandlerClient: any
) {
  // Cookie経由でセッションを取得
  const supabaseServerClient = createRouteHandlerClient({ cookies });
  const { data, error } = await supabaseServerClient.auth.getSession();
  
  if (error || !data.session) {
    // 認証ヘッダーから取得を試みる
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && userData.user) {
        return { user: userData.user };
      }
    }
    return null;
  }
  
  return data.session;
}