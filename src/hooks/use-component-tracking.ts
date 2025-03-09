/**
 * コンポーネントトラッキングフック
 * LP内のコンポーネントの表示・クリック・変換などをトラッキングするためのReactフック
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  trackComponentView, 
  trackClick, 
  trackComponentVisibility,
  EventType
} from '../lib/tracking/tracker';
import { getComponentVariant } from '../lib/tracking/session';

interface UseComponentTrackingProps {
  lpId: string;
  componentId: string;
  trackVisibility?: boolean; // Intersection Observerを使用して表示を追跡
  visibilityThreshold?: number; // 何％表示されたらトラッキングするか（0-1）
  trackClicks?: boolean; // クリックイベントを追跡
  trackChildren?: boolean; // 子要素のクリックも追跡
  conversionElements?: string[]; // コンバージョンと見なす要素のセレクタ
}

interface UseComponentTrackingResult {
  variant: 'a' | 'b'; // 表示するバリアント
  ref: React.RefObject<HTMLElement>; // トラッキング対象要素のref
  trackClick: (elementIdentifier: string) => void; // クリックを手動でトラッキング
  trackEvent: (eventType: EventType, data?: Record<string, any>) => void; // カスタムイベントをトラッキング
  impressions: number; // 表示回数（デバッグ用）
  clicks: number; // クリック回数（デバッグ用）
}

/**
 * コンポーネントトラッキングフック
 */
export function useComponentTracking({
  lpId,
  componentId,
  trackVisibility = true,
  visibilityThreshold = 0.5,
  trackClicks = true,
  trackChildren = true,
  conversionElements = []
}: UseComponentTrackingProps): UseComponentTrackingResult {
  const ref = useRef<HTMLElement>(null);
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  
  // コンポーネントのバリアントを取得
  const variant = getComponentVariant(componentId);
  
  // クリーンアップ関数の参照
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // マウント時に即時トラッキング
  useEffect(() => {
    if (lpId && componentId) {
      trackComponentView(lpId, componentId, variant);
      setImpressions(prev => prev + 1);
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [lpId, componentId, variant]);
  
  // 要素が参照されたらIntersection Observerを設定
  useEffect(() => {
    const element = ref.current;
    
    if (element && trackVisibility && lpId && componentId) {
      const cleanup = trackComponentVisibility(lpId, componentId, variant, element, {
        threshold: visibilityThreshold,
        trackHide: true
      });
      
      // クリーンアップ関数を保存
      cleanupRef.current = cleanup;
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [lpId, componentId, variant, trackVisibility, visibilityThreshold]);
  
  // クリックイベントの設定
  useEffect(() => {
    const element = ref.current;
    
    if (!element || !trackClicks || !lpId || !componentId) {
      return;
    }
    
    const handleClick = (e: MouseEvent) => {
      // クリック要素の特定
      const target = e.target as HTMLElement;
      
      // 対象要素またはその子要素がクリックされた場合
      if (element === target || (trackChildren && element.contains(target))) {
        // 要素の識別子（データ属性またはクラス名やID）
        const elementId = 
          target.dataset.trackingId || 
          target.id || 
          target.className || 
          target.tagName.toLowerCase();
        
        trackClick(lpId, componentId, variant, elementId);
        setClicks(prev => prev + 1);
        
        // コンバージョン要素かどうかチェック
        if (conversionElements.length > 0) {
          const isConversion = conversionElements.some(selector => {
            // セレクタに一致するか確認
            if (target.matches(selector)) {
              return true;
            }
            // 親要素を辿ってセレクタに一致するか確認
            let parent = target.parentElement;
            while (parent) {
              if (parent.matches(selector)) {
                return true;
              }
              parent = parent.parentElement;
            }
            return false;
          });
          
          if (isConversion) {
            // ここでコンバージョントラッキングを行うこともできる
            // trackConversion(lpId, 'click', 1, { componentId, variant });
            console.log('Conversion element clicked:', elementId);
          }
        }
      }
    };
    
    element.addEventListener('click', handleClick);
    
    return () => {
      element.removeEventListener('click', handleClick);
    };
  }, [lpId, componentId, variant, trackClicks, trackChildren, conversionElements]);
  
  // 手動クリックトラッキング関数
  const trackClickCallback = useCallback((elementIdentifier: string) => {
    if (lpId && componentId) {
      trackClick(lpId, componentId, variant, elementIdentifier);
      setClicks(prev => prev + 1);
    }
  }, [lpId, componentId, variant]);
  
  // 汎用イベントトラッキング関数
  const trackEventCallback = useCallback((eventType: EventType, data?: Record<string, any>) => {
    if (lpId && componentId) {
      // ここでイベントタイプに応じた適切なトラッキング関数を呼び出す
      // 実装はトラッキングライブラリに依存
      console.log('Custom event tracked:', eventType, lpId, componentId, variant, data);
    }
  }, [lpId, componentId, variant]);
  
  return {
    variant,
    ref,
    trackClick: trackClickCallback,
    trackEvent: trackEventCallback,
    impressions,
    clicks
  };
}