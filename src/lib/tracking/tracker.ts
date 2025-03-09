/**
 * クライアント側トラッキングライブラリ
 * イベントトラッキング、イベントキュー、バッチ処理を管理
 */
import { getOrCreateSession, SessionInfo } from './session';

// トラッキングイベントの種類
export enum EventType {
  PAGEVIEW = 'pageview',
  COMPONENT_VIEW = 'component_view',
  COMPONENT_HIDE = 'component_hide',
  CLICK = 'click',
  SCROLL = 'scroll',
  FORM_SUBMIT = 'form_submit',
  CONVERSION = 'conversion',
  CUSTOM = 'custom',
  EXIT = 'exit'
}

// トラッキングイベントの型定義
export interface TrackingEvent {
  type: EventType;
  lpId: string;
  sessionId: string;
  timestamp: number;
  componentId?: string;
  variantId?: string;
  variant?: 'a' | 'b';
  data?: Record<string, any>;
  meta?: {
    url?: string;
    referrer?: string;
    scrollDepth?: number;
    viewTime?: number;
    [key: string]: any;
  };
}

// イベントキュー
let eventQueue: TrackingEvent[] = [];

// 設定値
const CONFIG = {
  batchSize: 10, // バッチで送信するイベント数の閾値
  batchInterval: 5000, // バッチ処理の間隔 (ms)
  maxQueueSize: 100, // キューの最大サイズ
  retryLimit: 3, // 送信失敗時のリトライ回数
  retryDelay: 2000, // リトライ間の遅延時間 (ms)
  beaconApiSupported: typeof navigator !== 'undefined' && 'sendBeacon' in navigator,
  debug: process.env.NODE_ENV === 'development'
};

// バッチ処理用タイマー
let batchProcessTimer: ReturnType<typeof setTimeout> | null = null;

// 終了イベント登録フラグ
let exitEventRegistered = false;

/**
 * トラッカーの初期化
 */
export function initTracker(
  lpId: string,
  options: Partial<typeof CONFIG> = {}
): void {
  // 設定をマージ
  Object.assign(CONFIG, options);
  
  // 終了イベントを登録（ページを離れる前の最終データ送信）
  registerExitEvents(lpId);
  
  // バッチ処理タイマーを開始
  startBatchProcessTimer();
  
  // ページビューイベントを記録
  trackPageView(lpId);
  
  if (CONFIG.debug) {
    console.log('Tracker initialized for LP:', lpId);
  }
}

/**
 * ページビューのトラッキング
 */
export function trackPageView(lpId: string): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.PAGEVIEW,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    meta: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    }
  };
  
  queueEvent(event);
  
  // 開発モードでは即時送信
  if (CONFIG.debug) {
    processEventQueue(true);
  }
}

/**
 * コンポーネント表示のトラッキング
 */
export function trackComponentView(
  lpId: string,
  componentId: string,
  variant: 'a' | 'b'
): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.COMPONENT_VIEW,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    componentId,
    variant,
    meta: {
      viewTime: Date.now() // 表示開始時間記録（離脱時に表示時間を計算）
    }
  };
  
  queueEvent(event);
}

/**
 * クリックイベントのトラッキング
 */
export function trackClick(
  lpId: string,
  componentId: string,
  variant: 'a' | 'b',
  elementIdentifier: string
): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.CLICK,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    componentId,
    variant,
    data: {
      element: elementIdentifier
    }
  };
  
  queueEvent(event);
  
  // クリックはユーザーインタラクションなので、即時送信を検討
  if (eventQueue.length >= Math.min(3, CONFIG.batchSize)) {
    processEventQueue();
  }
}

/**
 * スクロールのトラッキング
 */
export function trackScroll(
  lpId: string,
  scrollDepth: number
): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.SCROLL,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    meta: {
      scrollDepth
    }
  };
  
  queueEvent(event);
}

/**
 * フォーム送信のトラッキング
 */
export function trackFormSubmit(
  lpId: string,
  componentId: string,
  variant: 'a' | 'b',
  formIdentifier: string,
  formData?: Record<string, any>
): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.FORM_SUBMIT,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    componentId,
    variant,
    data: {
      form: formIdentifier,
      // フォームデータは機密情報を含む可能性があるため、送信前にフィルタリングする
      // ここでは簡易的に実装
      formData: formData ? filterSensitiveData(formData) : undefined
    }
  };
  
  queueEvent(event);
  processEventQueue(); // フォーム送信は重要なイベントなので即時送信
}

/**
 * 機密情報のフィルタリング
 */
function filterSensitiveData(data: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  const sensitiveFields = ['password', 'credit_card', 'cc', 'card', 'cvv', 'ssn', 'secret'];
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '[FILTERED]';
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * コンバージョンのトラッキング
 */
export function trackConversion(
  lpId: string,
  conversionType: string,
  value?: number,
  additionalData?: Record<string, any>
): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.CONVERSION,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    data: {
      conversionType,
      value,
      ...additionalData
    }
  };
  
  queueEvent(event);
  processEventQueue(true); // コンバージョンは重要なイベントなので即時送信を強制
}

/**
 * カスタムイベントのトラッキング
 */
export function trackCustomEvent(
  lpId: string,
  eventName: string,
  componentId?: string,
  variant?: 'a' | 'b',
  data?: Record<string, any>
): void {
  const session = getOrCreateSession();
  
  const event: TrackingEvent = {
    type: EventType.CUSTOM,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    componentId,
    variant,
    data: {
      eventName,
      ...data
    }
  };
  
  queueEvent(event);
}

/**
 * 終了イベント（ページ離脱前）のトラッキング
 */
function trackExitEvent(lpId: string): void {
  const session = getOrCreateSession();
  
  // 滞在時間の計算
  const pageLoadTime = window.performance?.timing?.navigationStart || 0;
  const pageViewTime = pageLoadTime > 0 ? (Date.now() - pageLoadTime) : 0;
  
  // スクロール深度の取得
  const scrollDepth = getScrollDepth();
  
  const event: TrackingEvent = {
    type: EventType.EXIT,
    lpId,
    sessionId: session.id,
    timestamp: Date.now(),
    meta: {
      exitUrl: document.activeElement && (document.activeElement as HTMLAnchorElement).href || '',
      timeOnPage: pageViewTime,
      scrollDepth
    }
  };
  
  // 終了イベントはBeacon APIを使用して確実に送信
  if (CONFIG.beaconApiSupported) {
    sendBeacon([event]);
  } else {
    // フォールバックとして同期XMLHttpRequestを試みる
    sendSyncXHR([event]);
  }
}

/**
 * スクロール深度を取得
 */
function getScrollDepth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 0;
  }
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const documentHeight = Math.max(
    document.body.scrollHeight, 
    document.documentElement.scrollHeight,
    document.body.offsetHeight, 
    document.documentElement.offsetHeight
  );
  const windowHeight = window.innerHeight;
  
  if (documentHeight <= windowHeight) {
    return 100; // ページが画面内に収まる場合は100%
  }
  
  return Math.min(100, Math.round((scrollTop + windowHeight) / documentHeight * 100));
}

/**
 * 終了イベントの登録
 */
function registerExitEvents(lpId: string): void {
  if (exitEventRegistered || typeof window === 'undefined') {
    return;
  }
  
  // ページ離脱前のイベント
  window.addEventListener('beforeunload', () => {
    trackExitEvent(lpId);
  });
  
  // プログラムでのナビゲーション（SPA用）
  window.addEventListener('popstate', () => {
    trackExitEvent(lpId);
  });
  
  // ページが非表示になる時（タブ切り替えなど）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackExitEvent(lpId);
    }
  });
  
  exitEventRegistered = true;
}

/**
 * イベントをキューに追加
 */
function queueEvent(event: TrackingEvent): void {
  eventQueue.push(event);
  
  // キューが最大サイズを超えた場合、古いイベントを削除
  if (eventQueue.length > CONFIG.maxQueueSize) {
    eventQueue = eventQueue.slice(-CONFIG.maxQueueSize);
  }
  
  // キューサイズが閾値を超えたら処理を実行
  if (eventQueue.length >= CONFIG.batchSize) {
    processEventQueue();
  }
}

/**
 * イベントキューの処理
 */
export function processEventQueue(force: boolean = false): void {
  if (eventQueue.length === 0) {
    return;
  }
  
  // 強制送信またはバッチサイズに達した場合に送信
  if (force || eventQueue.length >= CONFIG.batchSize) {
    const eventsToSend = [...eventQueue];
    eventQueue = [];
    
    // イベントの送信
    sendEvents(eventsToSend).catch(error => {
      console.error('Failed to send events:', error);
      // 送信に失敗したイベントを再度キューに追加
      eventQueue = [...eventsToSend, ...eventQueue];
      // キューが最大サイズを超えた場合、古いイベントを削除
      if (eventQueue.length > CONFIG.maxQueueSize) {
        eventQueue = eventQueue.slice(-CONFIG.maxQueueSize);
      }
    });
  }
}

/**
 * バッチ処理タイマーの開始
 */
function startBatchProcessTimer(): void {
  if (batchProcessTimer || typeof window === 'undefined') {
    return;
  }
  
  batchProcessTimer = setInterval(() => {
    processEventQueue();
  }, CONFIG.batchInterval);
}

/**
 * クリーンアップ（SPA用）
 */
export function cleanup(): void {
  if (batchProcessTimer) {
    clearInterval(batchProcessTimer);
    batchProcessTimer = null;
  }
  
  // 残りのイベントを送信
  if (eventQueue.length > 0) {
    processEventQueue(true);
  }
  
  exitEventRegistered = false;
}

/**
 * イベントの送信処理
 */
async function sendEvents(events: TrackingEvent[]): Promise<void> {
  if (events.length === 0) {
    return;
  }

  try {
    const response = await fetch('/api/tracking/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send events: ${response.statusText}`);
    }
    
    if (CONFIG.debug) {
      console.log(`Successfully sent ${events.length} events`);
    }
  } catch (error) {
    console.error('Error sending events:', error);
    throw error;
  }
}

/**
 * Beacon APIを使用してイベントを送信（ページ離脱時に使用）
 */
function sendBeacon(events: TrackingEvent[]): boolean {
  if (!CONFIG.beaconApiSupported || events.length === 0) {
    return false;
  }
  
  try {
    const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
    return navigator.sendBeacon('/api/tracking/beacon', blob);
  } catch (error) {
    console.error('Error sending beacon:', error);
    return false;
  }
}

/**
 * 同期XMLHttpRequestを使用してイベントを送信（Beacon APIの代替）
 */
function sendSyncXHR(events: TrackingEvent[]): boolean {
  if (events.length === 0) {
    return false;
  }
  
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/tracking/sync', false); // 同期リクエスト
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ events }));
    return xhr.status >= 200 && xhr.status < 300;
  } catch (error) {
    console.error('Error sending sync XHR:', error);
    return false;
  }
}

/**
 * 自動スクロールトラッキングの設定
 */
export function setupAutoScrollTracking(
  lpId: string,
  thresholds: number[] = [25, 50, 75, 90, 100]
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  // 既にトラックしたスクロール深度を記録
  const trackedDepths = new Set<number>();
  
  const handleScroll = (): void => {
    const currentDepth = getScrollDepth();
    
    // 現在のスクロール深度が閾値を超えているか確認
    for (const threshold of thresholds) {
      if (currentDepth >= threshold && !trackedDepths.has(threshold)) {
        trackScroll(lpId, threshold);
        trackedDepths.add(threshold);
      }
    }
  };
  
  // スクロールイベントにスロットリングを適用
  let ticking = false;
  const scrollListener = (): void => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', scrollListener, { passive: true });
  
  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('scroll', scrollListener);
  };
}

/**
 * Intersection Observerを使用したコンポーネント表示トラッキング
 */
export function trackComponentVisibility(
  lpId: string,
  componentId: string,
  variant: 'a' | 'b',
  element: HTMLElement,
  options: {
    threshold?: number,
    trackHide?: boolean
  } = {}
): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // IntersectionObserver非対応環境ではコンポーネント表示を記録するだけ
    trackComponentView(lpId, componentId, variant);
    return () => {};
  }
  
  const { threshold = 0.5, trackHide = false } = options;
  let wasVisible = false;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !wasVisible) {
          // コンポーネントが表示された
          trackComponentView(lpId, componentId, variant);
          wasVisible = true;
        } else if (!entry.isIntersecting && wasVisible && trackHide) {
          // コンポーネントが非表示になった
          const session = getOrCreateSession();
          
          const event: TrackingEvent = {
            type: EventType.COMPONENT_HIDE,
            lpId,
            sessionId: session.id,
            timestamp: Date.now(),
            componentId,
            variant
          };
          
          queueEvent(event);
          wasVisible = false;
        }
      });
    },
    { threshold }
  );
  
  observer.observe(element);
  
  // クリーンアップ関数を返す
  return () => {
    observer.disconnect();
  };
}

/**
 * デバッグモードの設定
 */
export function setDebugMode(enabled: boolean): void {
  CONFIG.debug = enabled;
  
  if (enabled) {
    console.log('Tracker debug mode enabled');
    console.log('Current event queue:', eventQueue);
  }
}

/**
 * 設定の更新
 */
export function updateConfig(options: Partial<typeof CONFIG>): void {
  Object.assign(CONFIG, options);
  
  // バッチ処理タイマーを再設定
  if (batchProcessTimer) {
    clearInterval(batchProcessTimer);
    batchProcessTimer = null;
  }
  
  startBatchProcessTimer();
}