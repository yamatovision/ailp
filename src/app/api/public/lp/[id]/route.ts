/**
 * パブリック LP 表示用 API エンドポイント
 * 認証を必要とせず、LPを表示するための公開APIを提供します
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/db/prisma';

// セッション情報の型定義
interface SessionInfo {
  id: string;
  startedAt: number;
  variants: Record<string, 'a' | 'b'>;
  source?: string;
  campaign?: string;
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
  };
}

/**
 * GET: LP表示用データを取得するエンドポイント
 * URLパラメータでバリアントを強制指定でき、それ以外はセッションに基づいて振り分けられます
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lpId = params.id;
    const searchParams = request.nextUrl.searchParams;
    
    // セッション管理
    const sessionInfo = await getOrCreateSession(request, searchParams);
    
    // LPの基本情報を取得
    const lp = await prisma.lP.findUnique({
      where: { id: lpId },
      include: {
        components: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!lp) {
      return NextResponse.json({ error: 'LP not found' }, { status: 404 });
    }

    // コンポーネントのバリアント取得
    const componentsWithVariants = await Promise.all(
      lp.components.map(async (component) => {
        // このコンポーネントに対するバリアントを決定
        const variant = getComponentVariant(component.id, sessionInfo, searchParams);
        
        // バリアントBがある場合は取得
        const variantBData = await prisma.componentVariant.findFirst({
          where: { 
            componentId: component.id,
            variant: 'b'
          }
        });
        
        // コンポーネントの最終的なHTMLを決定
        let html = component.html || '';
        if (variant === 'b' && variantBData) {
          html = variantBData.html || '';
        }
        
        return {
          ...component,
          activeVariant: variant,
          html,
          // クライアントに返すデータから機密情報を削除
          userId: undefined
        };
      })
    );

    // レスポンスを設定（セッションCookieを含む）
    const response = NextResponse.json({
      id: lp.id,
      name: lp.name,
      description: lp.description,
      components: componentsWithVariants,
      // 追加のメタデータがあれば含める
      meta: {
        sessionId: sessionInfo.id,
      }
    });
    
    // セッションCookieを設定
    response.cookies.set('lp_session', JSON.stringify(sessionInfo), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30日
      path: '/',
      sameSite: 'lax',
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching public LP:', error);
    return NextResponse.json(
      { error: 'Failed to load landing page' },
      { status: 500 }
    );
  }
}

/**
 * デバイスタイプを検出
 */
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tablet = /iPad|tablet|Nexus 7|Nexus 10/i;
  
  if (tablet.test(userAgent)) {
    return 'tablet';
  } else if (mobile.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * ブラウザ情報を検出
 */
function detectBrowser(userAgent: string): string {
  if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('Safari') > -1) return 'Safari';
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Edge') > -1) return 'Edge';
  if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) return 'IE';
  return 'Other';
}

/**
 * URLからUTMパラメータを取得
 */
function getUTMParams(searchParams: URLSearchParams) {
  return {
    source: searchParams.get('utm_source') || undefined,
    campaign: searchParams.get('utm_campaign') || undefined
  };
}

/**
 * セッション情報の取得または新規作成
 */
async function getOrCreateSession(
  request: NextRequest,
  searchParams: URLSearchParams
): Promise<SessionInfo> {
  // 既存のセッションCookieがあれば取得
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('lp_session')?.value;
  
  if (sessionCookie) {
    try {
      const existingSession = JSON.parse(sessionCookie) as SessionInfo;
      return existingSession;
    } catch (error) {
      console.error('Error parsing session cookie:', error);
      // 解析エラーの場合は新しいセッションを作成
    }
  }
  
  // 新しいセッションを生成
  const userAgent = request.headers.get('user-agent') || '';
  
  // バリアントの割り当てはここでは行わない（各コンポーネントで個別に判断）
  const newSession: SessionInfo = {
    id: uuidv4(),
    startedAt: Date.now(),
    variants: {},
    ...getUTMParams(searchParams),
    device: {
      type: detectDeviceType(userAgent),
      browser: detectBrowser(userAgent)
    }
  };
  
  return newSession;
}

/**
 * コンポーネントのバリアントを決定
 * 優先度: URLパラメータ > 既存セッション > ランダム割り当て
 */
function getComponentVariant(
  componentId: string,
  session: SessionInfo,
  searchParams: URLSearchParams
): 'a' | 'b' {
  // URLからバリアント指定があるか確認
  const forcedVariant = searchParams.get(`variant_${componentId}`) || searchParams.get('variant');
  if (forcedVariant === 'a' || forcedVariant === 'b') {
    // 強制指定されたバリアントをセッションに保存
    session.variants[componentId] = forcedVariant;
    return forcedVariant;
  }
  
  // セッションに既存のバリアント割り当てがあるか確認
  if (session.variants[componentId]) {
    return session.variants[componentId];
  }
  
  // 新規割り当て（ランダム）
  const newVariant = Math.random() < 0.5 ? 'a' : 'b';
  session.variants[componentId] = newVariant;
  return newVariant;
}