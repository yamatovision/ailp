/**
 * 公開LP表示ページ
 * ABテスト用のパブリック表示ページで、セッションベースでバリアントが振り分けられます
 */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicLPDisplay from '@/components/public/PublicLPDisplay';

// 型定義
interface PublicLPPageProps {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// 動的メタデータ
export async function generateMetadata({ params }: PublicLPPageProps): Promise<Metadata> {
  try {
    // APIから基本情報を取得
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/public/lp/${params.id}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return {
        title: 'Landing Page',
        description: 'View landing page',
      };
    }
    
    const data = await res.json();
    
    return {
      title: data.name || 'Landing Page',
      description: data.description || 'View our landing page',
      // OGP設定なども追加可能
      openGraph: {
        title: data.name || 'Landing Page',
        description: data.description || 'View our landing page',
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Landing Page',
      description: 'View landing page',
    };
  }
}

/**
 * 公開LP表示ページコンポーネント
 */
export default async function PublicLPPage({ params, searchParams }: PublicLPPageProps) {
  const { id } = params;
  
  // クエリパラメータがある場合はURLSearchParamsに変換
  const queryString = Object.entries(searchParams)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
      }
      return `${key}=${encodeURIComponent(value || '')}`;
    })
    .join('&');
  
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/public/lp/${id}${queryString ? `?${queryString}` : ''}`;
  
  try {
    // SSRでLPデータを取得（ビルド時ではなくリクエスト時）
    const res = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!res.ok) {
      if (res.status === 404) {
        return notFound();
      }
      throw new Error(`Failed to fetch LP: ${res.status}`);
    }
    
    const lpData = await res.json();
    
    // LPデータをクライアントコンポーネントに渡す
    return <PublicLPDisplay lpData={lpData} />;
  } catch (error) {
    console.error('Error loading public LP:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-700 mb-4">
            ランディングページの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }
}