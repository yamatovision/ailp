'use client';

/**
 * 公開LP表示用クライアントコンポーネント
 * LPのコンポーネントを組み合わせて表示し、ユーザーインタラクションを追跡します
 */
import { useState, useEffect, useRef } from 'react';
import TrackingScript from './TrackingScript';
import PublicFooter from './PublicFooter';
import { usePathname, useSearchParams } from 'next/navigation';

// LP型定義
interface LP {
  id: string;
  name: string;
  description: string;
  components: Array<{
    id: string;
    componentType: string;
    html: string;
    position: number;
    activeVariant: 'a' | 'b';
  }>;
  meta?: {
    sessionId: string;
    [key: string]: any;
  };
}

interface PublicLPDisplayProps {
  lpData: LP;
}

/**
 * 公開LP表示コンポーネント
 */
export default function PublicLPDisplay({ lpData }: PublicLPDisplayProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [startTime] = useState(Date.now());
  const componentsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // セッションID
  const sessionId = lpData.meta?.sessionId || '';
  
  // ページビュー記録
  useEffect(() => {
    // ページビューを記録
    trackPageView();
    
    // コンポーネント表示記録（初期表示用）
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const componentId = entry.target.getAttribute('data-component-id');
        if (componentId && entry.isIntersecting) {
          trackComponentView(componentId);
        }
      });
    }, { threshold: 0.2 }); // 20%以上表示されたら記録
    
    // 各コンポーネントを監視
    lpData.components.forEach((component) => {
      const el = componentsRef.current.get(component.id);
      if (el) {
        observer.observe(el);
      }
    });
    
    // スクロールイベント監視
    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
        trackEvent('scroll_started');
      }
    };
    
    // ユーザーインタラクション監視
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        trackEvent('first_interaction');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    
    // アンマウント時にイベントリスナーとオブザーバーを削除
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      
      // ページ離脱時に滞在時間を記録
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      trackEvent('page_exit', { timeSpent });
    };
  }, []);
  
  // ページビュー記録関数
  const trackPageView = async () => {
    try {
      await fetch('/api/tracking/pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lpId: lpData.id,
          sessionId,
          pathname,
          search: searchParams.toString(),
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to track pageview:', error);
    }
  };
  
  // コンポーネント表示記録関数
  const trackComponentView = async (componentId: string) => {
    try {
      const component = lpData.components.find(c => c.id === componentId);
      if (!component) return;
      
      await fetch('/api/tracking/component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lpId: lpData.id,
          sessionId,
          componentId,
          componentType: component.componentType,
          variant: component.activeVariant,
          eventType: 'view',
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error(`Failed to track component view for ${componentId}:`, error);
    }
  };
  
  // イベント記録関数
  const trackEvent = async (eventType: string, data: Record<string, any> = {}) => {
    try {
      await fetch('/api/tracking/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lpId: lpData.id,
          sessionId,
          eventType,
          data,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error(`Failed to track event ${eventType}:`, error);
    }
  };
  
  // クリックイベントハンドラー
  const handleClick = async (e: React.MouseEvent) => {
    // クリックされた要素またはその親要素からコンポーネントIDを見つける
    let target = e.target as HTMLElement;
    let componentId = null;
    
    while (target && !componentId) {
      componentId = target.getAttribute('data-component-id');
      if (!componentId && target.parentElement) {
        target = target.parentElement;
      } else {
        break;
      }
    }
    
    if (componentId) {
      const component = lpData.components.find(c => c.id === componentId);
      if (component) {
        // クリック情報を収集
        const clickData = {
          componentId,
          componentType: component.componentType,
          variant: component.activeVariant,
          elementType: target.tagName.toLowerCase(),
          elementClass: target.className,
          elementText: target.textContent?.trim().substring(0, 50) || '',
          isButton: target.tagName === 'BUTTON' || 
                    target.getAttribute('role') === 'button' ||
                    target.classList.contains('btn') ||
                    target.classList.contains('button'),
          x: e.clientX,
          y: e.clientY,
        };
        
        // クリックイベントを記録
        await trackEvent('click', clickData);
        
        // ボタンクリックはコンバージョン候補としても記録
        if (clickData.isButton) {
          await trackEvent('potential_conversion', clickData);
        }
      }
    }
  };
  
  // コンバージョントラッキング関数
  const trackConversion = async (conversionType: string, data: Record<string, any> = {}) => {
    try {
      await fetch('/api/tracking/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lpId: lpData.id,
          sessionId,
          conversionType,
          data,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error(`Failed to track conversion ${conversionType}:`, error);
    }
  };
  
  // フォーム送信ハンドラー（コンバージョン記録用）
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // フォーム情報を収集
    const form = e.target as HTMLFormElement;
    const componentId = form.getAttribute('data-component-id');
    
    if (componentId) {
      const component = lpData.components.find(c => c.id === componentId);
      if (component) {
        // フォームデータを収集（機密情報は除外）
        const formData = new FormData(form);
        const formFields = Array.from(formData.entries())
          .filter(([key]) => !key.includes('password') && !key.includes('credit'))
          .map(([key, value]) => ({ key, value: typeof value === 'string' ? value : 'file' }));
        
        // コンバージョン記録
        await trackConversion('form_submission', {
          componentId,
          componentType: component.componentType,
          variant: component.activeVariant,
          formId: form.id || 'unnamed_form',
          formAction: form.action,
          formFields,
        });
        
        // ここで実際のフォーム送信処理...
        // 仮実装: 送信成功のアラート表示
        alert('フォームが送信されました。実際のデータは処理されていません。');
      }
    }
  };
  
  // コンポーネントHTML内のformおよびリンクにイベントリスナーを追加
  const enhanceHtml = (html: string, componentId: string): string => {
    // formタグにdata-component-idと送信ハンドラを追加
    let enhancedHtml = html.replace(
      /<form(.*?)>/gi,
      `<form$1 data-component-id="${componentId}" onsubmit="window.__trackFormSubmit(event)">`
    );
    
    // aタグにdata-component-idを追加
    enhancedHtml = enhancedHtml.replace(
      /<a(.*?)>/gi,
      `<a$1 data-component-id="${componentId}">`
    );
    
    // buttonタグにdata-component-idを追加
    enhancedHtml = enhancedHtml.replace(
      /<button(.*?)>/gi,
      `<button$1 data-component-id="${componentId}">`
    );
    
    return enhancedHtml;
  };
  
  // ウィンドウオブジェクトにフォーム送信トラッキング関数を追加
  useEffect(() => {
    // @ts-ignore
    window.__trackFormSubmit = handleFormSubmit;
    
    return () => {
      // @ts-ignore
      delete window.__trackFormSubmit;
    };
  }, []);
  
  return (
    <>
      {/* トラッキングスクリプト */}
      <TrackingScript lpId={lpData.id} sessionId={sessionId} />
      
      {/* クリックイベントをキャプチャ */}
      <div onClick={handleClick} className="public-lp-container">
        {/* コンポーネントを位置順に表示 */}
        {lpData.components
          .sort((a, b) => a.position - b.position)
          .map((component) => (
            <div
              key={component.id}
              ref={(el) => {
                if (el) componentsRef.current.set(component.id, el);
              }}
              data-component-id={component.id}
              data-component-type={component.componentType}
              data-variant={component.activeVariant}
              dangerouslySetInnerHTML={{ 
                __html: enhanceHtml(component.html, component.id) 
              }}
            />
          ))}
        
        {/* フッター */}
        <PublicFooter lpName={lpData.name} />
      </div>
    </>
  );
}