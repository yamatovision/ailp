/**
 * セッション管理ユーティリティ
 * LPのABテスト用セッションを管理するクライアント側ユーティリティ
 */
import { v4 as uuidv4 } from 'uuid';

// セッション情報の型定義
export interface SessionInfo {
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

// デバイス情報の型定義
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os?: string;
  screenWidth?: number;
  screenHeight?: number;
}

// セッションストレージキー
const SESSION_STORAGE_KEY = 'lp_session';

/**
 * セッション情報を取得または新規作成
 */
export function getOrCreateSession(): SessionInfo {
  // ブラウザ環境でない場合は空のセッションを返す
  if (typeof window === 'undefined') {
    return createEmptySession();
  }

  try {
    // 既存のセッションクッキーを確認
    const cookie = getCookie(SESSION_STORAGE_KEY);
    if (cookie) {
      try {
        const sessionData = JSON.parse(cookie) as SessionInfo;
        return sessionData;
      } catch (error) {
        console.error('Error parsing session cookie:', error);
      }
    }

    // セッションストレージを確認
    const localSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (localSession) {
      try {
        const sessionData = JSON.parse(localSession) as SessionInfo;
        return sessionData;
      } catch (error) {
        console.error('Error parsing session from localStorage:', error);
      }
    }

    // 新しいセッションを作成
    const newSession = createNewSession();
    saveSession(newSession);
    return newSession;
  } catch (error) {
    console.error('Error in getOrCreateSession:', error);
    return createEmptySession();
  }
}

/**
 * 新しいセッションを作成
 */
function createNewSession(): SessionInfo {
  // デバイス情報を取得
  const deviceInfo = detectDevice();

  // URLパラメータを取得
  const utmParams = getUTMParams();

  return {
    id: uuidv4(),
    startedAt: Date.now(),
    variants: {},
    ...utmParams,
    device: {
      type: deviceInfo.type,
      browser: deviceInfo.browser
    }
  };
}

/**
 * 空のセッションを作成（SSRなどで使用）
 */
function createEmptySession(): SessionInfo {
  return {
    id: 'placeholder',
    startedAt: Date.now(),
    variants: {},
    device: {
      type: 'desktop',
      browser: 'unknown'
    }
  };
}

/**
 * セッション情報を保存
 */
export function saveSession(session: SessionInfo): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // クッキーに保存
    const serialized = JSON.stringify(session);
    setCookie(SESSION_STORAGE_KEY, serialized, 30); // 30日間保持

    // ローカルストレージにもバックアップ
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * セッションにバリアント割り当てを更新
 */
export function updateSessionVariant(
  componentId: string,
  variant: 'a' | 'b',
  session: SessionInfo = getOrCreateSession()
): SessionInfo {
  session.variants[componentId] = variant;
  saveSession(session);
  return session;
}

/**
 * URLからUTMパラメータを取得
 */
function getUTMParams() {
  if (typeof window === 'undefined') {
    return {};
  }

  const url = new URL(window.location.href);
  return {
    source: url.searchParams.get('utm_source') || undefined,
    campaign: url.searchParams.get('utm_campaign') || undefined
  };
}

/**
 * デバイス情報を検出
 */
function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      type: 'desktop',
      browser: 'unknown'
    };
  }

  const userAgent = navigator.userAgent;
  
  // デバイスタイプを検出
  const type = detectDeviceType(userAgent);
  
  // ブラウザを検出
  const browser = detectBrowser(userAgent);

  // OSを検出
  const os = detectOS(userAgent);

  return {
    type,
    browser,
    os,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height
  };
}

/**
 * デバイスタイプを検出
 */
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const mobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i;
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
 * OS情報を検出
 */
function detectOS(userAgent: string): string {
  if (userAgent.indexOf('Windows') > -1) return 'Windows';
  if (userAgent.indexOf('Mac') > -1) return 'Mac';
  if (userAgent.indexOf('Linux') > -1) return 'Linux';
  if (userAgent.indexOf('Android') > -1) return 'Android';
  if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) return 'iOS';
  return 'Other';
}

/**
 * クッキーを取得
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

/**
 * クッキーを設定
 */
function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

/**
 * URLパラメータからバリアント情報を取得
 */
export function getVariantFromURL(componentId: string): 'a' | 'b' | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  
  // コンポーネント固有のバリアントパラメータを確認
  const componentVariant = url.searchParams.get(`variant_${componentId}`);
  if (componentVariant === 'a' || componentVariant === 'b') {
    return componentVariant;
  }
  
  // グローバルバリアントパラメータを確認
  const globalVariant = url.searchParams.get('variant');
  if (globalVariant === 'a' || globalVariant === 'b') {
    return globalVariant;
  }
  
  return null;
}

/**
 * コンポーネントのバリアントを決定
 * 優先度: URLパラメータ > 既存セッション > ランダム割り当て
 */
export function getComponentVariant(componentId: string): 'a' | 'b' {
  // セッションを取得
  const session = getOrCreateSession();
  
  // URLからバリアント指定があるか確認
  const forcedVariant = getVariantFromURL(componentId);
  if (forcedVariant) {
    // 強制指定されたバリアントをセッションに保存
    updateSessionVariant(componentId, forcedVariant, session);
    return forcedVariant;
  }
  
  // セッションに既存のバリアント割り当てがあるか確認
  if (session.variants[componentId]) {
    return session.variants[componentId];
  }
  
  // 新規割り当て（ランダム）
  const newVariant = Math.random() < 0.5 ? 'a' : 'b';
  updateSessionVariant(componentId, newVariant, session);
  return newVariant;
}